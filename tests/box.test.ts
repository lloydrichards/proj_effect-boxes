import { describe, expect, it } from "bun:test";
import { String } from "effect";
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
    const b = Box.hcat(Box.top, [Box.text("hi"), Box.text("!")]);
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

  describe("Semigroup and Monoid", () => {
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
  });
});

describe("issue38 parity tests", () => {
  it("char constructs 1x1 and Box.renders the character", () => {
    const b = Box.char("A");
    expect(b.rows).toBe(1);
    expect(b.cols).toBe(1);
    expect(Box.renderWithSpaces(b)).toBe("A\n");
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
    const c = Box.hcat(Box.top, [a, b]);
    expect(c.rows).toBe(R1);
    expect(c.cols).toBe(C1 + C2);
  });

  it("emptyBox Box.renders exact spaces grid", () => {
    const R = 2;
    const C = 3;
    const b = Box.emptyBox(R, C);
    expect(Box.renderWithSpaces(b).replaceAll(" ", ".")).toBe(
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
    const beside = (l: any, r: any) => Box.hcat(Box.top, [l, r]);
    const above = (t: any, bot: any) => Box.vcat(Box.left, [t, bot]);
    expect(Box.renderWithSpaces(beside(a, b))).toBe(
      Box.renderWithSpaces(Box.hcat(Box.top, [a, b]))
    );
    expect(Box.renderWithSpaces(above(b, a))).toBe(
      Box.renderWithSpaces(Box.vcat(Box.left, [b, a]))
    );
  });

  it("Box.hcat vertical alignment center2 vs center1 biases differ on odd free space", () => {
    const tall = Box.text("x\ny"); // height 2
    const short = Box.text("Z"); // height 1
    const c1 = Box.hcat(Box.center1, [tall, short]);
    const c2 = Box.hcat(Box.center2, [tall, short]);

    // Under center1 (ceil), Z should be on the bottom row
    expect(Box.renderWithSpaces(c1).replaceAll(" ", ".")).toBe(
      String.stripMargin(
        `|xZ
         |y.
         |`
      )
    );

    // Under center2 (floor), Z should be on the top row
    expect(Box.renderWithSpaces(c2).replaceAll(" ", ".")).toBe(
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
    expect(
      Box.renderWithSpaces(Box.hcat(Box.bottom, [tall, short])).replaceAll(
        " ",
        "."
      )
    ).toBe(
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
    expect(
      Box.renderWithSpaces(Box.vcat(Box.right, [a, b])).replaceAll(" ", ".")
    ).toBe(
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
      Box.renderWithSpaces(
        Box.align(Box.center1, Box.center1, H, W, Box.text("x"))
      ).replaceAll(" ", ".")
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
      Box.renderWithSpaces(
        Box.align(Box.center1, Box.center1, H, W, Box.text("x\ny"))
      ).replaceAll(" ", ".")
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
      Box.renderWithSpaces(
        Box.align(Box.center1, Box.center1, H, W, Box.line("x\ny"))
      ).replaceAll(" ", ".")
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
    const cols = Box.columns(Box.left, 20, 5, text);
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
    const cols = Box.columns(Box.left, 10, 3, text);
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
    const cols = Box.columns(Box.left, 6, 3, text);
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
    const cols = Box.columns(Box.right, 8, 2, text);
    expect(cols.length).toBeGreaterThanOrEqual(1);
    if (cols[0]) {
      expect(cols[0].rows).toBe(2);
      const lines = Box.renderWithSpaces(cols[0]).split("\n").slice(0, -1);
      const hasRightAlignment = lines.some(
        (line) => line.startsWith(" ") && line.trim().length > 0
      );
      expect(hasRightAlignment).toBe(true);
    }
  });

  it("handles empty text", () => {
    const cols = Box.columns(Box.left, 10, 5, "");
    expect(cols).toHaveLength(1);
    expect(cols[0]?.rows).toBe(5);
    expect(Box.render(cols[0] as any)).toBe("");
  });

  it("handles single word", () => {
    const cols = Box.columns(Box.left, 10, 3, "word");
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
    const cols = Box.columns(Box.left, 5, 2, longText);
    expect(cols.length).toBeGreaterThan(10);
    for (const col of cols) {
      expect(col.rows).toBe(2);
    }
  });
});

describe("para", () => {
  it("creates paragraph box with left alignment", () => {
    const text = "This is a test paragraph that should flow nicely.";
    const box = Box.para(Box.left, 10, text);
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
    const box = Box.para(Box.right, 10, text);
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
    const box = Box.para(Box.center1, 10, text);
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
    expect(Box.render(Box.para(Box.left, 4, text))).toBe(
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
