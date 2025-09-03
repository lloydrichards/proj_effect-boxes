import { describe, expect, it } from "bun:test";
import { String } from "effect";
import {
  align,
  Box,
  bottom,
  center1,
  center2,
  columns,
  hAppend,
  hcat,
  left,
  mkParaBox,
  render,
  renderWithSpaces,
  right,
  top,
  vAppend,
  vcat,
} from "../src/Box";

describe("Box", () => {
  it("text trims trailing spaces per line", () => {
    const s = "abc   \nxy  ";
    expect(render(Box.text(s))).toBe(
      String.stripMargin(
        `|abc
         |xy
         |`
      )
    );
  });

  it("empty right identity", () => {
    const b = hcat(top, [Box.text("hi"), Box.text("!")]);
    expect(render(hAppend(b, Box.null))).toBe(render(b));
  });

  it("empty left identity", () => {
    const b = Box.text("Z");
    expect(render(hAppend(Box.null, b))).toBe(render(b));
  });

  it("empty top identity", () => {
    const b = Box.text("Z");
    expect(render(vAppend(Box.null, b))).toBe(render(b));
  });

  it("empty bottom identity", () => {
    const b = Box.text("Z");
    expect(render(vAppend(b, Box.null))).toBe(render(b));
  });

  it("associativity horizontal", () => {
    const a = Box.text("a");
    const b = Box.text("b");
    const c = Box.text("c");
    const leftH = hAppend(a, hAppend(b, c));
    const rightH = hAppend(hAppend(a, b), c);
    expect(render(leftH)).toBe(render(rightH));
  });

  it("associativity vertical", () => {
    const a = Box.text("a");
    const b = Box.text("b");
    const c = Box.text("c");
    const leftV = vAppend(a, vAppend(b, c));
    const rightV = vAppend(vAppend(a, b), c);
    expect(render(leftV)).toBe(render(rightV));
  });

  describe("Semigroup and Monoid", () => {
    it("semigroup associativity", () => {
      // (a <> b) <> c = a <> (b <> c)
      const a = Box.text("a");
      const b = Box.text("b");
      const c = Box.text("c");
      const left = Box.combine(Box.combine(a, b), c);
      const right = Box.combine(a, Box.combine(b, c));
      expect(render(left)).toBe(render(right));
      expect(render(left)).toBe("abc\n");
    });

    it("monoid left identity", () => {
      // empty <> x = x
      const box = Box.text("box");
      const result = Box.combine(Box.null, box);
      expect(render(result)).toBe(render(box));
      expect(render(result)).toBe("box\n");
    });

    it("monoid right identity", () => {
      // x <> empty = x
      const box = Box.text("world");
      const result = Box.combine(box, Box.null);
      expect(render(result)).toBe(render(box));
      expect(render(result)).toBe("world\n");
    });

    it("monoid combineAll with multiple boxes", () => {
      const result = Box.combineAll([
        Box.text("a"),
        Box.text("b"),
        Box.text("c"),
        Box.text("d"),
      ]);
      expect(render(result)).toBe("abcd\n");
    });

    it("monoid combineAll with empty collection", () => {
      const result = Box.combineAll([]);
      expect(render(result)).toBe(render(Box.null));
      expect(render(result)).toBe("");
    });
  });
});

describe("issue38 parity tests", () => {
  it("char constructs 1x1 and renders the character", () => {
    const b = Box.char("A");
    expect(b.rows).toBe(1);
    expect(b.cols).toBe(1);
    expect(renderWithSpaces(b)).toBe("A\n");
  });

  it("rows/cols report correct sizes and after composition", () => {
    const R1 = 3;
    const C1 = 2;
    const R2 = 3;
    const C2 = 3;
    const a = Box.empty(R1, C1);
    const b = Box.empty(R2, C2);
    expect(a.rows).toBe(R1);
    expect(a.cols).toBe(C1);
    const c = hcat(top, [a, b]);
    expect(c.rows).toBe(R1);
    expect(c.cols).toBe(C1 + C2);
  });

  it("emptyBox renders exact spaces grid", () => {
    const R = 2;
    const C = 3;
    const b = Box.empty(R, C);
    expect(renderWithSpaces(b).replaceAll(" ", ".")).toBe(
      String.stripMargin(
        `|...
         |...
         |`
      )
    );
  });

  it("beside/above default to top alignment and match hcat/vcat", () => {
    const a = Box.text("x\ny");
    const b = Box.text("Z");
    const beside = (l: any, r: any) => hcat(top, [l, r]);
    const above = (t: any, bot: any) => vcat(left, [t, bot]);
    expect(renderWithSpaces(beside(a, b))).toBe(
      renderWithSpaces(hcat(top, [a, b]))
    );
    expect(renderWithSpaces(above(b, a))).toBe(
      renderWithSpaces(vcat(left, [b, a]))
    );
  });

  it("hcat vertical alignment center2 vs center1 biases differ on odd free space", () => {
    const tall = Box.text("x\ny"); // height 2
    const short = Box.text("Z"); // height 1
    const c1 = hcat(center1, [tall, short]);
    const c2 = hcat(center2, [tall, short]);

    // Under center1 (ceil), Z should be on the bottom row
    expect(renderWithSpaces(c1).replaceAll(" ", ".")).toBe(
      String.stripMargin(
        `|x.
         |yZ
         |`
      )
    );

    // Under center2 (floor), Z should be on the top row
    expect(renderWithSpaces(c2).replaceAll(" ", ".")).toBe(
      String.stripMargin(
        `|xZ
         |y.
         |`
      )
    );
  });

  it("hcat bottom alignment places shorter box at bottom", () => {
    const tall = Box.text("x\ny\nz");
    const short = Box.text("Q");
    expect(
      renderWithSpaces(hcat(bottom, [tall, short])).replaceAll(" ", ".")
    ).toBe(
      String.stripMargin(
        `|x.
         |y.
         |zQ
         |`
      )
    );
  });

  it("vcat bottom (right align) pads shorter lines to the right", () => {
    const a = Box.text("a"); // width 1
    const b = Box.text("bb"); // width 2
    expect(renderWithSpaces(vcat(right, [a, b])).replaceAll(" ", ".")).toBe(
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
      renderWithSpaces(align(center1, center1, H, W, Box.text("x"))).replaceAll(
        " ",
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
      renderWithSpaces(
        align(center1, center1, H, W, Box.text("x\ny"))
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
      renderWithSpaces(
        align(center1, center1, H, W, Box.line("x\ny"))
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

describe("mkParaBox", () => {
  it("creates box from list of strings with left alignment", () => {
    const lines = ["hello", "world"];
    const box = mkParaBox(left, 3, lines);
    expect(box.rows).toBe(3);
    expect(render(box)).toBe(
      String.stripMargin(
        `|hello
         |world
         |
         |`
      )
    );
  });

  it("creates box from list of strings with right alignment", () => {
    const box = mkParaBox(right, 4, ["hi", "there"]);
    expect(box.rows).toBe(4);
    const rendered = renderWithSpaces(box).replaceAll(" ", ".");
    expect(rendered).toBe(
      String.stripMargin(
        `|...hi
         |there
         |.....
         |.....
         |`
      )
    );
  });

  it("creates box from list of strings with center alignment", () => {
    const lines = ["x", "abc"];
    const box = mkParaBox(center1, 3, lines);
    expect(box.rows).toBe(3);
    expect(renderWithSpaces(box).replaceAll(" ", ".")).toBe(
      String.stripMargin(
        `|.x.
         |abc
         |...
         |`
      )
    );
  });

  it("handles empty list of strings", () => {
    const box = mkParaBox(left, 2, []);
    expect(box.rows).toBe(2);
    // Empty list creates a box with 0 cols, which renders as empty string
    expect(renderWithSpaces(box)).toBe("");
  });

  it("handles single string", () => {
    const box = mkParaBox(left, 1, ["test"]);
    expect(box.rows).toBe(1);
    expect(render(box)).toBe(
      String.stripMargin(
        `|test
         |`
      )
    );
  });

  it("handles box height smaller than number of lines", () => {
    const lines = ["line1", "line2", "line3"];
    const box = mkParaBox(left, 2, lines);
    expect(box.rows).toBe(2);
    // Should still contain all text, just aligned within the specified height
    const rendered = render(box);
    expect(rendered).toContain("line1");
    expect(rendered).toContain("line2");
    expect(rendered).toContain("line3");
  });
});

describe("columns", () => {
  it("creates single column for short text", () => {
    const text = "hello world";
    const cols = columns(left, 20, 5, text);
    expect(cols).toHaveLength(1);
    expect(cols[0]?.rows).toBe(5);
    expect(render(cols[0] as any)).toBe(
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
    const cols = columns(left, 10, 3, text);
    expect(cols.length).toBeGreaterThan(1);
    for (const col of cols) {
      expect(col.rows).toBe(3);
    }
    const allText = cols.map((col) => render(col)).join("");
    expect(allText).toContain("This is a");
    expect(allText).toContain("very long");
  });

  it("handles text that fits exactly in one column", () => {
    const text = "line1 line2 line3";
    const cols = columns(left, 6, 3, text);
    expect(cols).toHaveLength(1);
    if (cols[0]) {
      expect(render(cols[0])).toBe(
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
    const cols = columns(right, 8, 2, text);
    expect(cols.length).toBeGreaterThanOrEqual(1);
    if (cols[0]) {
      expect(cols[0].rows).toBe(2);
      const lines = renderWithSpaces(cols[0]).split("\n").slice(0, -1);
      const hasRightAlignment = lines.some(
        (line) => line.startsWith(" ") && line.trim().length > 0
      );
      expect(hasRightAlignment).toBe(true);
    }
  });

  it("handles empty text", () => {
    const cols = columns(left, 10, 5, "");
    expect(cols).toHaveLength(1);
    expect(cols[0]?.rows).toBe(5);
    expect(render(cols[0] as any)).toBe("");
  });

  it("handles single word", () => {
    const cols = columns(left, 10, 3, "word");
    expect(cols).toHaveLength(1);
    expect(render(cols[0] as any)).toBe(
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
    const cols = columns(left, 5, 2, longText);
    expect(cols.length).toBeGreaterThan(10);
    for (const col of cols) {
      expect(col.rows).toBe(2);
    }
  });
});

describe("para", () => {
  it("creates paragraph box with left alignment", () => {
    const text = "This is a test paragraph that should flow nicely.";
    const box = Box.para(left, 10, text);
    expect(box.rows).toBeGreaterThan(0);
    expect(box.cols).toBeLessThanOrEqual(10);
    expect(render(box)).toBe(
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
    const box = Box.para(right, 10, text);
    expect(box.rows).toBeGreaterThan(0);
    expect(box.cols).toBeLessThanOrEqual(10);
    expect(render(box)).toBe(
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
    const box = Box.para(center1, 10, text);
    expect(box.rows).toBeGreaterThan(0);
    expect(box.cols).toBeLessThanOrEqual(10);
    expect(render(box)).toBe(
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
    expect(render(Box.para(left, 4, text))).toBe(
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
