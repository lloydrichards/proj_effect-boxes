import { describe, expect, it } from "bun:test";
import {
  align,
  hAppend,
  center1,
  center2,
  hcat,
  vAppend,
  top,
  bottom,
  vcat,
  left,
  right,
  render,
  renderWithSpaces,
  Box,
} from "../src/Box";
import { String } from "effect";

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
    it("semigroup associativity: (a <> b) <> c = a <> (b <> c)", () => {
      const a = Box.text("a");
      const b = Box.text("b");
      const c = Box.text("c");
      const left = Box.combine(Box.combine(a, b), c);
      const right = Box.combine(a, Box.combine(b, c));
      expect(render(left)).toBe(render(right));
      expect(render(left)).toBe("abc\n");
    });

    it("monoid left identity: empty <> x = x", () => {
      const box = Box.text("box");
      const result = Box.combine(Box.null, box);
      expect(render(result)).toBe(render(box));
      expect(render(result)).toBe("box\n");
    });

    it("monoid right identity: x <> empty = x", () => {
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
    expect(renderWithSpaces(b)).toBe(["   ", "   ", ""].join("\n"));
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
    const lines1 = renderWithSpaces(c1).split("\n").slice(0, -1);
    const lines2 = renderWithSpaces(c2).split("\n").slice(0, -1);
    // Under center1 (ceil), Z should be on the bottom row
    if (lines1.length >= 2) {
      const l10 = lines1[0] as string;
      const l11 = lines1[1] as string;
      expect(l10.endsWith(" ")).toBe(true);
      expect(l11.endsWith("Z")).toBe(true);
    } else {
      throw new Error("Unexpected lines1 length");
    }
    // Under center2 (floor), Z should be on the top row
    if (lines2.length >= 2) {
      const l20 = lines2[0] as string;
      const l21 = lines2[1] as string;
      expect(l20.endsWith("Z")).toBe(true);
      expect(l21.endsWith(" ")).toBe(true);
    } else {
      throw new Error("Unexpected lines2 length");
    }
  });

  it("hcat bottom alignment places shorter box at bottom", () => {
    const tall = Box.text("x\ny\nz");
    const short = Box.text("Q");
    const out = renderWithSpaces(hcat(bottom, [tall, short])).split("\n");
    expect(out[0]?.endsWith(" ")).toBe(true);
    expect(out[1]?.endsWith(" ")).toBe(true);
    expect(out[2]?.endsWith("Q")).toBe(true);
  });

  it("vcat bottom (right align) pads shorter lines to the right", () => {
    const a = Box.text("a"); // width 1
    const b = Box.text("bb"); // width 2
    const out = renderWithSpaces(vcat(right, [a, b])).split("\n");
    expect(out[0]).toBe(" a");
    expect(out[1]).toBe("bb");
  });
  it("A: align center1 center1 5x5 with text 'x'", () => {
    const H = 5;
    const W = 5;
    const out = renderWithSpaces(
      align(center1, center1, H, W, Box.text("x"))
    ).replaceAll(" ", ".");
    console.log(out);
    expect(out).toBe(
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
    const out = renderWithSpaces(
      align(center1, center1, H, W, Box.text("x\ny"))
    ).replaceAll(" ", ".");
    expect(out).toBe(
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
