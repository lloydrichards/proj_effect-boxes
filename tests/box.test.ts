import { String } from "effect";
import * as Equal from "effect/Equal";
import * as Hash from "effect/Hash";
import { describe, expect, it } from "vitest";
import * as Box from "../src/Box";

describe("Box", () => {
  it("text trims trailing spaces per line", () => {
    const s = "abc   \nxy  ";
    expect(Box.render(Box.text(s))).toBe(
      String.stripMargin(
        `|abc
         |xy
         |`
      )
    );
  });

  it("empty right identity", () => {
    const b = Box.hcat([Box.text("hi"), Box.text("!")], Box.top);
    expect(Box.render(Box.hAppend(b, Box.nullBox))).toBe(Box.render(b));
  });

  it("empty left identity", () => {
    const b = Box.text("Z");
    expect(Box.render(Box.hAppend(Box.nullBox, b))).toBe(Box.render(b));
  });

  it("empty top identity", () => {
    const b = Box.text("Z");
    expect(Box.render(Box.vAppend(Box.nullBox, b))).toBe(Box.render(b));
  });

  it("empty bottom identity", () => {
    const b = Box.text("Z");
    expect(Box.render(Box.vAppend(b, Box.nullBox))).toBe(Box.render(b));
  });

  it("associativity horizontal", () => {
    const a = Box.text("a");
    const b = Box.text("b");
    const c = Box.text("c");
    const leftH = Box.hAppend(a, Box.hAppend(b, c));
    const rightH = Box.hAppend(Box.hAppend(a, b), c);
    expect(Box.render(leftH)).toBe(Box.render(rightH));
  });

  it("associativity vertical", () => {
    const a = Box.text("a");
    const b = Box.text("b");
    const c = Box.text("c");
    const leftV = Box.vAppend(a, Box.vAppend(b, c));
    const rightV = Box.vAppend(Box.vAppend(a, b), c);
    expect(Box.render(leftV)).toBe(Box.render(rightV));
  });

  it("semigroup associativity", () => {
    // (a <> b) <> c = a <> (b <> c)
    const a = Box.text("a");
    const b = Box.text("b");
    const c = Box.text("c");
    const left = Box.combine(Box.combine(a, b), c);
    const right = Box.combine(a, Box.combine(b, c));
    expect(Box.render(left)).toBe(Box.render(right));
    expect(Box.render(left)).toBe("abc\n");
  });

  it("monoid left identity", () => {
    // empty <> x = x
    const box = Box.text("box");
    const result = Box.combine(Box.nullBox, box);
    expect(Box.render(result)).toBe(Box.render(box));
    expect(Box.render(result)).toBe("box\n");
  });

  it("monoid right identity", () => {
    // x <> empty = x
    const box = Box.text("world");
    const result = Box.combine(box, Box.nullBox);
    expect(Box.render(result)).toBe(Box.render(box));
    expect(Box.render(result)).toBe("world\n");
  });

  it("monoid combineAll with multiple boxes", () => {
    const result = Box.combineAll([
      Box.text("a"),
      Box.text("b"),
      Box.text("c"),
      Box.text("d"),
    ]);
    expect(Box.render(result)).toBe("abcd\n");
  });

  it("monoid combineAll with empty collection", () => {
    const result = Box.combineAll([]);
    expect(Box.render(result)).toBe(Box.render(Box.nullBox));
    expect(Box.render(result)).toBe("");
  });

  it("combineMany combines a starting box with multiple boxes", () => {
    const result = Box.combineMany(
      [Box.text("1"), Box.text("2"), Box.text("3")],
      Box.text("start")
    );
    expect(Box.render(result)).toBe("start123\n");
  });

  it("rows and cols can describe a Box", () => {
    const box1 = Box.emptyBox(5, 3);
    expect(Box.rows(box1)).toBe(5);
    expect(Box.cols(box1)).toBe(3);

    const box2 = Box.text("line1\nline2\nline3");
    expect(Box.rows(box2)).toBe(3);
    expect(Box.cols(box2)).toBe(5);
  });
});

describe("issue38 parity tests", () => {
  it("char constructs 1x1 and Box.renders the character", () => {
    const b = Box.char("A");
    expect(b.rows).toBe(1);
    expect(b.cols).toBe(1);
    expect(Box.render(b)).toBe("A\n");
  });

  it("rows/cols report correct sizes and after composition", () => {
    const R1 = 3;
    const C1 = 2;
    const R2 = 3;
    const C2 = 3;
    const a = Box.emptyBox(R1, C1);
    const b = Box.emptyBox(R2, C2);
    expect(a.rows).toBe(R1);
    expect(a.cols).toBe(C1);
    const c = Box.hcat([a, b], Box.top);
    expect(c.rows).toBe(R1);
    expect(c.cols).toBe(C1 + C2);
  });

  it("emptyBox Box.renders exact spaces grid", () => {
    const R = 2;
    const C = 3;
    const b = Box.emptyBox(R, C);
    expect(Box.renderWith(b, ".")).toBe(
      String.stripMargin(
        `|...
         |...
         |`
      )
    );
  });

  it("beside/above default to top alignment and match Box.hcat/Box.vcat", () => {
    const a = Box.text("x\ny");
    const b = Box.text("Z");
    const beside = (l: any, r: any) => Box.hcat([l, r], Box.top);
    const above = (t: any, bot: any) => Box.vcat([t, bot], Box.left);
    expect(Box.render(beside(a, b))).toBe(
      Box.render(Box.hcat([a, b], Box.top))
    );
    expect(Box.render(above(b, a))).toBe(
      Box.render(Box.vcat([b, a], Box.left))
    );
  });

  it("Box.hcat vertical alignment center2 vs center1 biases differ on odd free space", () => {
    const tall = Box.text("x\ny"); // height 2
    const short = Box.text("Z"); // height 1
    const c1 = Box.hcat([tall, short], Box.center1);
    const c2 = Box.hcat([tall, short], Box.center2);

    // Under center1 (ceil), Z should be on the bottom row
    expect(Box.renderWith(c1, ".")).toBe(
      String.stripMargin(
        `|xZ
         |y.
         |`
      )
    );

    // Under center2 (floor), Z should be on the top row
    expect(Box.renderWith(c2, ".")).toBe(
      String.stripMargin(
        `|x.
         |yZ
         |`
      )
    );
  });

  it("Box.hcat bottom alignment places shorter box at bottom", () => {
    const tall = Box.text("x\ny\nz");
    const short = Box.text("Q");
    expect(Box.renderWith(Box.hcat([tall, short], Box.bottom), ".")).toBe(
      String.stripMargin(
        `|x.
         |y.
         |zQ
         |`
      )
    );
  });

  it("Box.vcat bottom (right align) pads shorter lines to the right", () => {
    const a = Box.text("a"); // width 1
    const b = Box.text("bb"); // width 2
    expect(Box.renderWith(Box.vcat([a, b], Box.right), ".")).toBe(
      String.stripMargin(
        `|.a
         |bb
         |`
      )
    );
  });
  it("A: align center1 center1 5x5 with text 'x'", () => {
    const H = 5;
    const W = 5;
    expect(
      Box.renderWith(
        Box.align(Box.text("x"), Box.center1, Box.center1, H, W),
        "."
      )
    ).toBe(
      String.stripMargin(
        `|.....
         |.....
         |..x..
         |.....
         |.....
         |`
      )
    );
  });
  it("B: align center1 center1 5x5 with text 'x\\ny'", () => {
    const H = 5;
    const W = 5;
    expect(
      Box.renderWith(
        Box.align(Box.text("x\ny"), Box.center1, Box.center1, H, W),
        "."
      )
    ).toBe(
      String.stripMargin(
        `|.....
         |.....
         |..x..
         |..y..
         |.....
         |`
      )
    );
  });

  it("C: align center1 center1 5x5 with line 'x\\ny'", () => {
    const H = 5;
    const W = 5;
    expect(
      Box.renderWith(
        Box.align(Box.line("x\ny"), Box.center1, Box.center1, H, W),
        "."
      )
    ).toBe(
      String.stripMargin(
        `|.....
         |.....
         |..xy.
         |.....
         |.....
         |`
      )
    );
  });
});

describe("columns", () => {
  it("creates single column for short text", () => {
    const text = "hello world";
    const cols = Box.columns(text, Box.left, 20, 5);
    expect(cols).toHaveLength(1);
    expect(cols[0]?.rows).toBe(5);
    expect(Box.render(cols[0] as any)).toBe(
      String.stripMargin(
        `|hello world
         |
         |
         |
         |
         |`
      )
    );
  });

  it("creates multiple columns for long text", () => {
    const text =
      "This is a very long text that should be split into multiple columns when the width is constrained and height is limited.";
    const cols = Box.columns(text, Box.left, 10, 3);
    expect(cols.length).toBeGreaterThan(1);
    for (const col of cols) {
      expect(col.rows).toBe(3);
    }
    const allText = cols.map((col) => Box.render(col)).join("");
    expect(allText).toContain("This is a");
    expect(allText).toContain("very long");
  });

  it("handles text that fits exactly in one column", () => {
    const text = "line1 line2 line3";
    const cols = Box.columns(text, Box.left, 6, 3);
    expect(cols).toHaveLength(1);
    if (cols[0]) {
      expect(Box.render(cols[0])).toBe(
        String.stripMargin(
          `|line1
           |line2
           |line3
           |`
        )
      );
    }
  });

  it("creates columns with right alignment", () => {
    const text = "short text here";
    const cols = Box.columns(text, Box.right, 8, 2);
    expect(cols.length).toBeGreaterThanOrEqual(1);
    if (cols[0]) {
      expect(cols[0].rows).toBe(2);
      const lines = Box.render(cols[0]).split("\n").slice(0, -1);
      const hasRightAlignment = lines.some(
        (line) => line.startsWith(" ") && line.trim().length > 0
      );
      expect(hasRightAlignment).toBe(true);
    }
  });

  it("handles empty text", () => {
    const cols = Box.columns("", Box.left, 10, 5);
    expect(cols).toHaveLength(1);
    expect(cols[0]?.rows).toBe(5);
    expect(Box.render(cols[0] as any)).toBe("");
  });

  it("handles single word", () => {
    const cols = Box.columns("word", Box.left, 10, 3);
    expect(cols).toHaveLength(1);
    expect(Box.render(cols[0] as any)).toBe(
      String.stripMargin(
        `|word
         |
         |
         |`
      )
    );
  });

  it("creates appropriate number of columns based on text length and constraints", () => {
    const longText = new Array(100).fill("word").join(" ");
    const cols = Box.columns(longText, Box.left, 5, 2);
    expect(cols.length).toBeGreaterThan(10);
    for (const col of cols) {
      expect(col.rows).toBe(2);
    }
  });
});

describe("para", () => {
  it("creates paragraph box with left alignment", () => {
    const text = "This is a test paragraph that should flow nicely.";
    const box = Box.para(text, Box.left, 10);
    expect(box.rows).toBeGreaterThan(0);
    expect(box.cols).toBeLessThanOrEqual(10);
    expect(Box.render(box)).toBe(
      String.stripMargin(
        `|This is a
         |test
         |paragraph
         |that
         |should
         |flow
         |nicely.
         |`
      )
    );
  });

  it("creates paragraph box with left alignment", () => {
    const text = "This is a test paragraph that should flow nicely.";
    const box = Box.para(text, Box.right, 10);
    expect(box.rows).toBeGreaterThan(0);
    expect(box.cols).toBeLessThanOrEqual(10);
    expect(Box.render(box)).toBe(
      String.stripMargin(
        `|This is a
         |     test
         |paragraph
         |     that
         |   should
         |     flow
         |  nicely.
         |`
      )
    );
  });

  it("creates paragraph box with center alignment", () => {
    const text = "This is a test paragraph that should flow nicely.";
    const box = Box.para(text, Box.center1, 10);
    expect(box.rows).toBeGreaterThan(0);
    expect(box.cols).toBeLessThanOrEqual(10);
    expect(Box.render(box)).toBe(
      String.stripMargin(
        `|This is a
         |   test
         |paragraph
         |   that
         |  should
         |   flow
         | nicely.
         |`
      )
    );
  });

  it("flows text to specified width", () => {
    const text = "Something longer than the width.";
    expect(Box.render(Box.para(text, Box.left, 4))).toBe(
      String.stripMargin(
        `|Some
         |long
         |than
         |the
         |widt
         |`
      )
    );
  });
});

describe("Spacing", () => {
  it("hcatWithSpace concatenates boxes horizontally with space", () => {
    const result = Box.hcatWithSpace(Box.text("left"), Box.text("right"));
    expect(Box.render(result)).toBe("left right\n");
  });

  it("hcatWithSpace with multi-line boxes", () => {
    const result = Box.hcatWithSpace(Box.text("A\nB"), Box.text("X\nY"));
    expect(Box.render(result)).toBe(
      String.stripMargin(
        `|A X
         |B Y
         |`
      )
    );
  });

  it("vcatWithSpace concatenates boxes vertically with space", () => {
    const result = Box.vcatWithSpace(Box.text("top"), Box.text("bottom"));
    expect(Box.render(result)).toBe(
      String.stripMargin(
        `|top
         |
         |bottom
         |`
      )
    );
  });

  it("vcatWithSpace with different widths", () => {
    const result = Box.vcatWithSpace(
      Box.text("short"),
      Box.text("much longer text")
    );
    expect(Box.render(result)).toBe(
      String.stripMargin(
        `|short
         |
         |much longer text
         |`
      )
    );
  });
});

describe("Punctuation Functions", () => {
  it("punctuateH intersperse with comma", () => {
    const boxes = [Box.text("a"), Box.text("b"), Box.text("c")];
    const result = Box.punctuateH(boxes, Box.left, Box.text(","));
    expect(Box.render(result)).toBe(
      String.stripMargin(
        `|a,b,c
         |`
      )
    );
  });

  it("punctuateH with single box", () => {
    const boxes = [Box.text("solo")];
    const result = Box.punctuateH(boxes, Box.left, Box.text("|"));
    expect(Box.render(result)).toBe(
      String.stripMargin(
        `|solo
         |`
      )
    );
  });

  it("punctuateH with different alignments", () => {
    const result = Box.punctuateH(
      [Box.text("A\nB"), Box.text("X")],
      Box.bottom,
      Box.text("|")
    );
    expect(Box.renderWithSpaces(result)).toBe(
      String.stripMargin(
        `|A  
         |B|X
         |`
      )
    );
  });

  it("punctuateV intersperse with separator", () => {
    const result = Box.punctuateV(
      [Box.text("line1"), Box.text("line2"), Box.text("line3")],
      Box.left,
      Box.text("---")
    );
    expect(Box.render(result)).toBe(
      String.stripMargin(
        `|line1
         |---
         |line2
         |---
         |line3
         |`
      )
    );
  });

  it("punctuateV with single box", () => {
    const result = Box.punctuateV(
      [Box.text("only")],
      Box.left,
      Box.text("***")
    );
    expect(Box.render(result)).toBe(
      String.stripMargin(
        `|only
         |`
      )
    );
  });

  it("punctuateV with different alignments", () => {
    expect(
      Box.render(
        Box.punctuateV(
          [Box.text("A"), Box.text("WIDE")],
          Box.right,
          Box.text("--")
        )
      )
    ).toBe(
      String.stripMargin(
        `|   A
         |  --
         |WIDE
         |`
      )
    );
  });
});

describe("Separation", () => {
  it("hsep with zero separation", () => {
    const result = Box.hsep(
      [Box.text("a"), Box.text("b"), Box.text("c")],
      0,
      Box.left
    );
    expect(Box.render(result)).toBe(
      String.stripMargin(
        `|abc
         |`
      )
    );
  });

  it("hsep with spacing", () => {
    const result = Box.hsep([Box.text("x"), Box.text("y")], 3, Box.left);
    expect(Box.render(result)).toBe("x   y\n");
  });

  it("hsep with different alignments", () => {
    const result = Box.hsep(
      [Box.text("A\nB\nC"), Box.text("X")],
      1,
      Box.center1
    );
    expect(Box.renderWithSpaces(result)).toBe(
      String.stripMargin(
        `|A  
         |B X
         |C  
         |`
      )
    );
  });

  it("vsep with spacing", () => {
    const result = Box.vsep([Box.text("top"), Box.text("bottom")], 2, Box.left);
    expect(Box.render(result)).toBe(
      String.stripMargin(
        `|top
         |
         |
         |bottom
         |`
      )
    );
  });

  it("vsep with different alignments", () => {
    const result = Box.vsep([Box.text("A"), Box.text("WIDE")], 1, Box.center1);
    expect(Box.renderWithSpaces(result)).toBe(
      String.stripMargin(
        `| A  
         |    
         |WIDE
         |`
      )
    );
  });
});

describe("Movement", () => {
  const centerBox = Box.align(Box.text("x"), Box.center1, Box.center1, 3, 3);

  it("moveUp adds rows below the box", () => {
    const result = Box.moveUp(centerBox, 2);
    expect(Box.renderWith(result, ".")).toBe(
      String.stripMargin(
        `|...
         |.x.
         |...
         |...
         |...
         |`
      )
    );
  });

  it("moveUp with single row movement", () => {
    const result = Box.moveUp(centerBox, 1);
    expect(Box.renderWith(result, ".")).toBe(
      String.stripMargin(
        `|...
         |.x.
         |...
         |...
         |`
      )
    );
  });

  it("moveDown adds rows above the box", () => {
    const result = Box.moveDown(centerBox, 2);
    expect(Box.renderWith(result, ".")).toBe(
      String.stripMargin(
        `|...
         |...
         |...
         |.x.
         |...
         |`
      )
    );
  });

  it("moveDown with single row movement", () => {
    const result = Box.moveDown(centerBox, 1);
    expect(Box.renderWith(result, ".")).toBe(
      String.stripMargin(
        `|...
         |...
         |.x.
         |...
         |`
      )
    );
  });

  it("moveLeft adds columns to the right", () => {
    const result = Box.moveLeft(centerBox, 2);
    expect(Box.renderWith(result, ".")).toBe(
      String.stripMargin(
        `|.....
         |.x...
         |.....
         |`
      )
    );
  });

  it("moveLeft with single column movement", () => {
    const result = Box.moveLeft(centerBox, 1);
    expect(Box.renderWith(result, ".")).toBe(
      String.stripMargin(
        `|....
         |.x..
         |....
         |`
      )
    );
  });

  it("moveRight adds columns to the left", () => {
    const result = Box.moveRight(centerBox, 2);
    expect(Box.renderWith(result, ".")).toBe(
      String.stripMargin(
        `|.....
         |...x.
         |.....
         |`
      )
    );
  });

  it("moveRight with single column movement", () => {
    const result = Box.moveRight(centerBox, 1);
    expect(Box.renderWith(result, ".")).toBe(
      String.stripMargin(
        `|....
         |..x.
         |....
         |`
      )
    );
  });
});

describe("Pipeable", () => {
  it("supports basic pipe with single transformation", () => {
    const result = Box.text("test").pipe(Box.alignHoriz(Box.center1, 10));
    expect(result.rows).toBe(Box.text("test").rows);
    expect(Box.render(result)).toContain("test");
  });

  it("supports pipe chaining with multiple transformations", (): void => {
    const result = Box.text("hello").pipe(
      Box.alignHoriz(Box.center1, 15),
      Box.alignVert(Box.center1, 5),
      Box.moveRight(2),
      Box.moveDown(1)
    );
    expect(result.cols).toBe(17);
    expect(result.rows).toBe(6);
    expect(Box.render(result)).toContain("hello");
  });

  it("allows pipe without any arguments to return the same box", () => {
    const box = Box.text("unchanged");
    const result = box.pipe();
    expect(Equal.equals(box, result)).toBe(true);
    expect(Hash.hash(box)).toBe(Hash.hash(result));
  });

  it("works with complex combinations including vcat and hcat in pipe chains", () => {
    const final = Box.vcat(
      [
        Box.text("A").pipe(Box.alignHoriz(Box.center1, 5)),
        Box.text("B").pipe(Box.alignHoriz(Box.center1, 5)),
        Box.text("C").pipe(Box.alignHoriz(Box.center1, 5)),
      ],
      Box.left
    ).pipe(Box.alignVert(Box.center1, 10), Box.moveRight(3));
    expect(final.cols).toBe(8);
    expect(final.rows).toBe(10);
    expect(Box.render(final)).toContain("A");
    expect(Box.render(final)).toContain("B");
    expect(Box.render(final)).toContain("C");
  });
});

describe("Equal", () => {
  it("compares identical boxes as equal", () => {
    const box1 = Box.text("hello");
    const box2 = Box.text("hello");
    expect(Equal.equals(box1, box2)).toBe(true);
  });

  it("compares boxes with different content as not equal", () => {
    const box1 = Box.text("hello");
    const box2 = Box.text("world");
    expect(Equal.equals(box1, box2)).toBe(false);
  });

  it("compares boxes with same content but different dimensions as not equal", () => {
    const box1 = Box.emptyBox(2, 3);
    const box2 = Box.emptyBox(3, 2);
    expect(Equal.equals(box1, box2)).toBe(false);
  });

  it("compares complex boxes with same structure as equal", () => {
    const box1 = Box.hcat([Box.text("a"), Box.text("b")], Box.top);
    const box2 = Box.hcat([Box.text("a"), Box.text("b")], Box.top);
    expect(Equal.equals(box1, box2)).toBe(true);
  });

  it("compares with non-Box objects as not equal", () => {
    const box = Box.text("test");
    const notBox = {
      rows: 1,
      cols: 4,
      content: { _tag: "Text", text: "test" },
    };
    expect(Equal.equals(box, notBox)).toBe(false);
  });
});

describe("Hash", () => {
  it("generates same hash for identical boxes", () => {
    const box1 = Box.text("hello");
    const box2 = Box.text("hello");
    expect(Hash.hash(box1)).toBe(Hash.hash(box2));
  });

  it("generates different hashes for boxes with different content", () => {
    const box1 = Box.text("hello");
    const box2 = Box.text("world");
    expect(Hash.hash(box1)).not.toBe(Hash.hash(box2));
  });

  it("generates different hashes for boxes with different dimensions", () => {
    const box1 = Box.emptyBox(2, 3);
    const box2 = Box.emptyBox(3, 2);
    expect(Hash.hash(box1)).not.toBe(Hash.hash(box2));
  });

  it("generates same hash for complex boxes with identical structure", () => {
    const box1 = Box.vcat([Box.text("line1"), Box.text("line2")], Box.left);
    const box2 = Box.vcat([Box.text("line1"), Box.text("line2")], Box.left);
    expect(Hash.hash(box1)).toBe(Hash.hash(box2));
  });

  it("uses cached hash implementation for performance", () => {
    const hash1 = Hash.hash(Box.text("cached"));
    const hash2 = Hash.hash(Box.text("cached"));
    expect(hash1).toBe(hash2);
  });
});
