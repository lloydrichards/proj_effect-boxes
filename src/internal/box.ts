import {
  Array,
  Console,
  Effect,
  Equal,
  Hash,
  Inspectable,
  Match,
  pipe,
  String,
} from "effect";
import { dual } from "effect/Function";
import { pipeArguments } from "effect/Pipeable";
import type * as Box from "../Box";
import * as Renderer from "../Renderer";
import * as Width from "./width";

/** @internal */
const BoxSymbolKey = "@effect/boxes/Box";

/** @internal */
export const BoxTypeId: Box.BoxTypeId = Symbol.for(
  BoxSymbolKey
) as Box.BoxTypeId;

const contentEquals = <A>(self: Box.Box<A>, that: Box.Box<A>): boolean => {
  if (self.content._tag !== that.content._tag) {
    return false;
  }

  return match(self, {
    blank: () => true,
    text: (text: string) => text === (that.content as Box.Text).text,
    row: (boxes: Box.Box<A>[]) =>
      boxes.length === (that.content as Box.Row<A>).boxes.length &&
      boxes.every((box: Box.Box<A>, i: number) =>
        Equal.equals(box, (that.content as Box.Row<A>).boxes[i])
      ),
    col: (boxes: Box.Box<A>[]) =>
      boxes.length === (that.content as Box.Col<A>).boxes.length &&
      boxes.every((box: Box.Box<A>, i: number) =>
        Equal.equals(box, (that.content as Box.Col<A>).boxes[i])
      ),
    subBox: (box: Box.Box<A>, xAlign: Box.Alignment, yAlign: Box.Alignment) =>
      xAlign === (that.content as Box.SubBox<A>).xAlign &&
      yAlign === (that.content as Box.SubBox<A>).yAlign &&
      Equal.equals(box, (that.content as Box.SubBox<A>).box),
  });
};

const contentHash = <A>(box: Box.Box<A>): number =>
  match(box, {
    blank: () => Hash.hash("Blank"),
    text: (text: string) => Hash.combine(Hash.hash("Text"))(Hash.hash(text)),
    row: (boxes: Box.Box<A>[]) =>
      boxes.reduce(
        (acc: number, box: Box.Box<A>) => Hash.combine(acc)(Hash.hash(box)),
        Hash.hash("Row")
      ),
    col: (boxes: Box.Box<A>[]) =>
      boxes.reduce(
        (acc: number, box: Box.Box<A>) => Hash.combine(acc)(Hash.hash(box)),
        Hash.hash("Col")
      ),
    subBox: (box: Box.Box<A>, xAlign: Box.Alignment, yAlign: Box.Alignment) =>
      pipe(
        Hash.hash("SubBox"),
        Hash.combine(Hash.hash(xAlign)),
        Hash.combine(Hash.hash(yAlign)),
        Hash.combine(Hash.hash(box))
      ),
  });

const proto: Omit<Box.Box, "rows" | "content" | "cols" | "annotation"> = {
  [BoxTypeId]: BoxTypeId,
  [Equal.symbol]<A>(this: Box.Box<A>, that: unknown): boolean {
    return (
      isBox<A>(that) &&
      this.rows === that.rows &&
      this.cols === that.cols &&
      contentEquals(this, that) &&
      Equal.equals(this.annotation, that.annotation)
    );
  },
  [Hash.symbol]<A>(this: Box.Box<A>) {
    return Hash.cached(
      this,
      pipe(
        Hash.hash(this.rows),
        Hash.combine(Hash.hash(this.cols)),
        Hash.combine(contentHash(this)),
        Hash.combine(Hash.hash(this.annotation))
      )
    );
  },
  [Inspectable.NodeInspectSymbol]<A>(this: Box.Box<A>): unknown {
    return {
      _tag: "Box",
      rows: this.rows,
      cols: this.cols,
      content: this.content,
    };
  },
  toString<A>(this: Box.Box<A>) {
    const dimension = `${this.rows}x${this.cols}`;
    const tag = this.content._tag;
    const contentInfo = (<A>(box: Box.Box<A>): string =>
      match(box, {
        blank: () => " [empty]",
        text: (text) =>
          text.length > 20 ? ` "${text.slice(0, 17)}..."` : ` "${text}"`,
        row: (boxes) => ` [${boxes.length} boxes horizontal]`,
        col: (boxes) => ` [${boxes.length} boxes vertical]`,
        subBox: (_, xAlign, yAlign) => ` [aligned ${xAlign}/${yAlign}]`,
      }))(this);
    const annotationInfo = this.annotation ? " annotated" : "";

    return `Box(${dimension} ${tag}${contentInfo}${annotationInfo})`;
  },
  toJSON<A>(this: Box.Box<A>) {
    return {
      _tag: "Box",
      rows: this.rows,
      cols: this.cols,
      content: this.content,
    };
  },
  pipe() {
    // biome-ignore lint/correctness/noUndeclaredVariables: typescript does not recognize that this is a method on Box
    return pipeArguments(this, arguments);
  },
};

// -----------------------------------------------------------------------------
// Refinements
// -----------------------------------------------------------------------------

/** @internal */

export const isBox = <A>(u: unknown): u is Box.Box<A> =>
  typeof u === "object" && u != null && BoxTypeId in u;

// -----------------------------------------------------------------------------
// Primitives
// -----------------------------------------------------------------------------

/** @internal */

export const top: Box.Alignment = "AlignFirst";

/** @internal */

export const bottom: Box.Alignment = "AlignLast";

/** @internal */

export const left: Box.Alignment = "AlignFirst";

/** @internal */

export const right: Box.Alignment = "AlignLast";

/** @internal */

export const center1: Box.Alignment = "AlignCenter1";

/** @internal */

export const center2: Box.Alignment = "AlignCenter2";

// -----------------------------------------------------------------------------
// Constructors
// -----------------------------------------------------------------------------

/** @internal */

export const make = <A>(b: {
  rows: number;
  cols: number;
  content: Box.Content<A>;
  annotation?: import("../Annotation").Annotation<A>;
}): Box.Box<A> => {
  const box = Object.create(proto);
  box.rows = Math.max(0, b.rows);
  box.cols = Math.max(0, b.cols);
  box.content = b.content;
  if (b.annotation) {
    box.annotation = b.annotation;
  }

  return box;
};

/** @internal */

export const nullBox: Box.Box<never> = make({
  rows: 0,
  cols: 0,
  content: { _tag: "Blank" },
});

/** @internal */

export const emptyBox = (rows = 0, cols = 0): Box.Box<never> =>
  make({
    rows,
    cols,
    content: { _tag: "Blank" },
  });

/** @internal */

export const char = (c: string): Box.Box<never> =>
  make({
    rows: 1,
    cols: 1,
    content: { _tag: "Text", text: c[0] ?? " " },
  });

const unsafeLine = (t: string): Box.Box<never> =>
  make({
    rows: 1,
    cols: Width.ofString(t),
    content: { _tag: "Text", text: t.replace(/\u200d/g, "") },
  });

/** @internal */

export const text = (s: string): Box.Box<never> =>
  pipe(s, String.split("\n"), Array.map(unsafeLine), vcat(left));

/** @internal */

export const line = (s: string): Box.Box<never> =>
  unsafeLine(String.replace(/\n|\r/g, "")(s));

/** @internal */

export const para = dual<
  (a: Box.Alignment, w: number) => (self: string) => Box.Box<never>,
  (self: string, a: Box.Alignment, w: number) => Box.Box<never>
>(3, (self, a, w) => {
  const lines = flow(self, w);
  return mkParaBox(lines, a, lines.length);
});

/** @internal */

export const combine = dual<
  <B>(l: Box.Box<B>) => <A>(self: Box.Box<A>) => Box.Box<A | B>,
  <A, B>(self: Box.Box<A>, l: Box.Box<B>) => Box.Box<A | B>
>(
  2,
  <A, B>(self: Box.Box<A>, l: Box.Box<B>): Box.Box<A | B> =>
    hcat([self, l], top)
);

/** @internal */
export const combineMany = dual<
  <A>(start: Box.Box<A>) => <B>(self: Iterable<Box.Box<B>>) => Box.Box<A | B>,
  <A, B>(self: Iterable<Box.Box<B>>, start: Box.Box<A>) => Box.Box<A | B>
>(
  2,
  <A, B>(self: Iterable<Box.Box<B>>, start: Box.Box<A>): Box.Box<A | B> =>
    hcat([start, ...Array.fromIterable(self)], top)
);

/** @internal */
export const combineAll = <T extends readonly Box.Box<unknown>[]>(
  collection: T
): Box.Box<Box.BoxAnnotations<T>> => {
  const boxes = Array.fromIterable(collection);
  return boxes.length === 0 ? nullBox : hcat(boxes, top);
};

/** @internal */
export const rows = <A>(b: Box.Box<A>): number => b.rows;

/** @internal */
export const cols = <A>(b: Box.Box<A>): number => b.cols;

const sumMax = <A>(
  f: (a: A) => number,
  defaultMax: number,
  g: (a: A) => number,
  as: readonly A[]
): [number, number] => {
  let sum = 0;
  let max = defaultMax;
  for (const a of as) {
    sum += f(a);
    max = Math.max(max, g(a));
  }
  return [sum, max];
};

/** @internal */
export const hcat = dual<
  <T extends readonly Box.Box<unknown>[]>(
    a: Box.Alignment
  ) => (self: T) => Box.Box<Box.BoxAnnotations<T>>,
  <T extends readonly Box.Box<unknown>[]>(
    self: T,
    a: Box.Alignment
  ) => Box.Box<Box.BoxAnnotations<T>>
>(
  2,
  <T extends readonly Box.Box<unknown>[]>(
    self: T,
    a: Box.Alignment
  ): Box.Box<Box.BoxAnnotations<T>> => {
    const [w, h] = sumMax(cols, 0, rows, self);
    return make({
      rows: h,
      cols: w,
      content: {
        _tag: "Row",
        // Safe cast: alignVert preserves annotation types, so Box.Box<unknown>[] becomes Box.Box<Box.BoxAnnotations<T>>[]
        boxes: self.map(alignVert(a, h)) as Box.Box<Box.BoxAnnotations<T>>[],
      } as Box.Content<Box.BoxAnnotations<T>>, // Safe cast: matches the Box.Box<Box.BoxAnnotations<T>> return type
    });
  }
);

/** @internal */
export const vcat = dual<
  <T extends readonly Box.Box<unknown>[]>(
    a: Box.Alignment
  ) => (self: T) => Box.Box<Box.BoxAnnotations<T>>,
  <T extends readonly Box.Box<unknown>[]>(
    self: T,
    a: Box.Alignment
  ) => Box.Box<Box.BoxAnnotations<T>>
>(
  2,
  <T extends readonly Box.Box<unknown>[]>(
    self: T,
    a: Box.Alignment
  ): Box.Box<Box.BoxAnnotations<T>> => {
    const [h, w] = sumMax(rows, 0, cols, self);
    return make({
      rows: h,
      cols: w,
      content: {
        _tag: "Col",
        // Safe cast: alignHoriz preserves annotation types, so Box.Box<unknown>[] becomes Box.Box<Box.BoxAnnotations<T>>[]
        boxes: self.map(alignHoriz(a, w)) as Box.Box<Box.BoxAnnotations<T>>[],
      } as Box.Content<Box.BoxAnnotations<T>>, // Safe cast: matches the Box.Box<Box.BoxAnnotations<T>> return type
    });
  }
);

/** @internal */
export const hAppend = dual<
  <A>(l: Box.Box<A>) => (self: Box.Box<A>) => Box.Box<A>,
  <A>(self: Box.Box<A>, l: Box.Box<A>) => Box.Box<A>
>(2, <A>(self: Box.Box<A>, l: Box.Box<A>): Box.Box<A> => hcat([self, l], top));

/** @internal */
export const hcatWithSpace = dual<
  <A>(l: Box.Box<A>) => (self: Box.Box<A>) => Box.Box<A>,
  <A>(self: Box.Box<A>, l: Box.Box<A>) => Box.Box<A>
>(
  2,
  <A>(self: Box.Box<A>, l: Box.Box<A>): Box.Box<A> =>
    hcat([self, emptyBox(0, 1), l], top)
);

/** @internal */
export const vAppend = dual<
  <A>(t: Box.Box<A>) => (self: Box.Box<A>) => Box.Box<A>,
  <A>(self: Box.Box<A>, t: Box.Box<A>) => Box.Box<A>
>(2, <A>(self: Box.Box<A>, t: Box.Box<A>): Box.Box<A> => vcat([self, t], left));

/** @internal */
export const vcatWithSpace = dual<
  <A>(t: Box.Box<A>) => (self: Box.Box<A>) => Box.Box<A>,
  <A>(self: Box.Box<A>, t: Box.Box<A>) => Box.Box<A>
>(
  2,
  <A>(self: Box.Box<A>, t: Box.Box<A>): Box.Box<A> =>
    vcat([self, emptyBox(1, 0), t], left)
);

/** @internal */
export const punctuateH = dual<
  <A, T extends readonly Box.Box<unknown>[]>(
    a: Box.Alignment,
    p: Box.Box<A>
  ) => (self: T) => Box.Box<A | Box.BoxAnnotations<T>>,
  <A, T extends readonly Box.Box<unknown>[]>(
    self: T,
    a: Box.Alignment,
    p: Box.Box<A>
  ) => Box.Box<A | Box.BoxAnnotations<T>>
>(
  3,
  <A, T extends readonly Box.Box<unknown>[]>(
    self: T,
    a: Box.Alignment,
    p: Box.Box<A>
  ): Box.Box<A | Box.BoxAnnotations<T>> => {
    if (self.length === 0) {
      return nullBox;
    }
    return hcat(Array.intersperse(self, p), a);
  }
);

/** @internal */
export const punctuateV = dual<
  <A, T extends readonly Box.Box<unknown>[]>(
    a: Box.Alignment,
    p: Box.Box<A>
  ) => (self: T) => Box.Box<A | Box.BoxAnnotations<T>>,
  <A, T extends readonly Box.Box<unknown>[]>(
    self: T,
    a: Box.Alignment,
    p: Box.Box<A>
  ) => Box.Box<A | Box.BoxAnnotations<T>>
>(
  3,
  <A, T extends readonly Box.Box<unknown>[]>(
    self: T,
    a: Box.Alignment,
    p: Box.Box<A>
  ): Box.Box<A | Box.BoxAnnotations<T>> => {
    if (self.length === 0) {
      return nullBox;
    }
    return vcat(Array.intersperse(self, p), a);
  }
);

/** @internal */
export const hsep = dual<
  (
    sep: number,
    a: Box.Alignment
  ) => <A>(self: readonly Box.Box<A>[]) => Box.Box<A>,
  <A>(self: readonly Box.Box<A>[], sep: number, a: Box.Alignment) => Box.Box<A>
>(
  3,
  <A>(self: readonly Box.Box<A>[], sep: number, a: Box.Alignment): Box.Box<A> =>
    punctuateH(self, a, emptyBox(0, sep))
);

/** @internal */
export const vsep = dual<
  (
    sep: number,
    a: Box.Alignment
  ) => <A>(self: readonly Box.Box<A>[]) => Box.Box<A>,
  <A>(self: readonly Box.Box<A>[], sep: number, a: Box.Alignment) => Box.Box<A>
>(
  3,
  <A>(self: readonly Box.Box<A>[], sep: number, a: Box.Alignment): Box.Box<A> =>
    punctuateV(self, a, emptyBox(sep, 0))
);

/*
 *  --------------------------------------------------------------------------------
 *  --  Paragraph flowing  ---------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

interface ParaContent {
  readonly fullLines: readonly (readonly string[])[];
  readonly lastLine: readonly string[];
}

interface Para {
  readonly width: number;
  readonly content: ParaContent;
}

const emptyPara = (paraWidth: number): Para => ({
  width: paraWidth,
  content: {
    fullLines: [],
    lastLine: [],
  },
});

/** @internal */
export const columns = dual<
  (a: Box.Alignment, w: number, h: number) => (self: string) => Box.Box[],
  (self: string, a: Box.Alignment, w: number, h: number) => Box.Box[]
>(4, (self, a, w, h) =>
  pipe(self, flow(w), Array.chunksOf(h), Array.map(mkParaBox(a, h)))
);

const mkParaBox = dual<
  (a: Box.Alignment, n: number) => (self: string[]) => Box.Box,
  (self: string[], a: Box.Alignment, n: number) => Box.Box
>(3, (self, a, n) => {
  if (self.length === 0) {
    return emptyBox(n, 0);
  }
  return pipe(self, Array.map(text), vcat(a), alignVert(top, n));
});

const whitespaceRegex = /\s+/;

const flow = dual<
  (width: number) => (self: string) => string[],
  (self: string, width: number) => string[]
>(2, (self, width) => {
  if (self.trim() === "") {
    return [""];
  }

  return pipe(
    self,
    String.split(whitespaceRegex),
    Array.filter((word) => word.length > 0),
    Array.reduce(emptyPara(width), addWordP),
    getLines,
    Array.map((line) => line.slice(0, width))
  );
});

const getLines = ({ content: { fullLines, lastLine } }: Para): string[] => {
  const process = (lines: readonly (readonly string[])[]): string[] =>
    pipe(
      Array.fromIterable(lines),
      Array.reverse,
      Array.map((line) => pipe(line, Array.reverse, Array.join(" ")))
    );

  return process(lastLine.length === 0 ? fullLines : [lastLine, ...fullLines]);
};

const addWordP = (para: Para, word: string): Para => ({
  width: para.width,
  content: wordFits(para, word)
    ? {
        fullLines: para.content.fullLines,
        lastLine: [word, ...para.content.lastLine] as readonly string[],
      }
    : {
        fullLines:
          para.content.lastLine.length === 0
            ? para.content.fullLines
            : ([
                para.content.lastLine,
                ...para.content.fullLines,
              ] as readonly (readonly string[])[]),
        lastLine: [word] as readonly string[],
      },
});

const wordFits = (
  { content: paraContent, width: paraWidth }: Para,
  word: string
): boolean => {
  if (paraContent.lastLine.length === 0) {
    return word.length <= paraWidth;
  }
  const currentLength = paraContent.lastLine.reduce(
    (acc: number, w: string) => acc + w.length,
    paraContent.lastLine.length - 1
  );
  return currentLength + 1 + word.length <= paraWidth;
};

/*
 *  --------------------------------------------------------------------------------
 *  --  Box.Alignment  -----------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/** @internal */
export const alignHoriz = dual<
  (a: Box.Alignment, c: number) => <A>(self: Box.Box<A>) => Box.Box<A>,
  <A>(self: Box.Box<A>, a: Box.Alignment, c: number) => Box.Box<A>
>(
  3,
  <A>(self: Box.Box<A>, a: Box.Alignment, c: number): Box.Box<A> =>
    align(self, a, left, self.rows, c)
);

/** @internal */
export const alignVert = dual<
  (a: Box.Alignment, r: number) => <A>(self: Box.Box<A>) => Box.Box<A>,
  <A>(self: Box.Box<A>, a: Box.Alignment, r: number) => Box.Box<A>
>(
  3,
  <A>(self: Box.Box<A>, a: Box.Alignment, r: number): Box.Box<A> =>
    align(self, top, a, r, self.cols)
);

/** @internal */
export const align = dual<
  (
    ah: Box.Alignment,
    av: Box.Alignment,
    r: number,
    c: number
  ) => <A>(self: Box.Box<A>) => Box.Box<A>,
  <A>(
    self: Box.Box<A>,
    ah: Box.Alignment,
    av: Box.Alignment,
    r: number,
    c: number
  ) => Box.Box<A>
>(
  5,
  <A>(
    self: Box.Box<A>,
    ah: Box.Alignment,
    av: Box.Alignment,
    r: number,
    c: number
  ): Box.Box<A> =>
    make({
      rows: r,
      cols: c,
      content: {
        _tag: "SubBox",
        xAlign: ah,
        yAlign: av,
        box: self,
      },
      annotation: self.annotation,
    })
);

/** @internal */
export const alignLeft = <A>(self: Box.Box<A>): Box.Box<A> =>
  alignHoriz(self, left, self.cols);

/** @internal */
export const moveUp = dual<
  (n: number) => <A>(self: Box.Box<A>) => Box.Box<A>,
  <A>(self: Box.Box<A>, n: number) => Box.Box<A>
>(
  2,
  <A>(self: Box.Box<A>, n: number): Box.Box<A> =>
    alignVert(self, top, self.rows + n)
);

/** @internal */
export const moveDown = dual<
  (n: number) => <A>(self: Box.Box<A>) => Box.Box<A>,
  <A>(self: Box.Box<A>, n: number) => Box.Box<A>
>(
  2,
  <A>(self: Box.Box<A>, n: number): Box.Box<A> =>
    alignVert(self, bottom, self.rows + n)
);

/** @internal */
export const moveLeft = dual<
  (n: number) => <A>(self: Box.Box<A>) => Box.Box<A>,
  <A>(self: Box.Box<A>, n: number) => Box.Box<A>
>(
  2,
  <A>(self: Box.Box<A>, n: number): Box.Box<A> =>
    alignHoriz(self, left, self.cols + n)
);

/** @internal */
export const moveRight = dual<
  (n: number) => <A>(self: Box.Box<A>) => Box.Box<A>,
  <A>(self: Box.Box<A>, n: number) => Box.Box<A>
>(
  2,
  <A>(self: Box.Box<A>, n: number): Box.Box<A> =>
    alignHoriz(self, right, self.cols + n)
);

/** @internal */
export const defaultRenderConfig: Renderer.RenderStyle = {
  _tag: "Plain",
};

/** @internal */
export const merge = (renderedBoxes: string[][]): string[] => {
  if (renderedBoxes.length === 0) {
    return [];
  }
  return pipe(
    Array.makeBy(
      Math.max(...renderedBoxes.map((lines) => lines.length)),
      (i) => i
    ),
    Array.map((rowIndex) =>
      pipe(
        renderedBoxes,
        Array.reduce("", (acc, lines) => acc + (lines[rowIndex] ?? ""))
      )
    )
  );
};

/** @internal */
const renderBox = <A>(box: Box.Box<A>): string[] => {
  if (box.rows === 0 || box.cols === 0) {
    return [];
  }

  return match(box, {
    blank: () => resizeBox([""], box.rows, box.cols),
    text: (text) => resizeBox([text], box.rows, box.cols),
    row: (boxes) =>
      pipe(Array.map(boxes, renderBox), merge, resizeBox(box.rows, box.cols)),
    col: (boxes) =>
      pipe(Array.flatMap(boxes, renderBox), resizeBox(box.rows, box.cols)),
    subBox: (subBox, xAlign, yAlign) =>
      pipe(
        renderBox(subBox),
        resizeBoxAligned(box.rows, box.cols, xAlign, yAlign)
      ),
  });
};

/** @internal */
export const takeP = dual<
  <A>(a: A, n: number) => (self: readonly A[]) => A[],
  <A>(self: readonly A[], a: A, n: number) => A[]
>(3, (self, a, n) => {
  if (n <= 0) {
    return [];
  }
  if (self.length === 0) {
    return Array.makeBy(n, () => a);
  }
  if (n <= self.length) {
    return self.slice(0, n);
  }
  return [...self, ...Array.makeBy(n - self.length, () => a)];
});

/** @internal */
export const takePA = dual<
  <A>(alignment: Box.Alignment, a: A, n: number) => (self: readonly A[]) => A[],
  <A>(self: readonly A[], alignment: Box.Alignment, a: A, n: number) => A[]
>(4, <A>(self: readonly A[], alignment: Box.Alignment, a: A, n: number) => {
  if (n <= 0) {
    return [];
  }

  const numRev = (align: Box.Alignment, size: number): number =>
    Match.value(align).pipe(
      Match.when("AlignFirst", () => 0),
      Match.when("AlignLast", () => size),
      Match.when("AlignCenter1", () => Math.ceil(size / 2)),
      Match.when("AlignCenter2", () => Math.floor(size / 2)),
      Match.exhaustive
    );

  const numFwd = (align: Box.Alignment, size: number): number =>
    Match.value(align).pipe(
      Match.when("AlignFirst", () => size),
      Match.when("AlignLast", () => 0),
      Match.when("AlignCenter1", () => Math.floor(size / 2)),
      Match.when("AlignCenter2", () => Math.ceil(size / 2)),
      Match.exhaustive
    );

  const splitPos = numRev(alignment, self.length);
  const prefix = [...self.slice(0, splitPos)].reverse();
  const suffix = self.slice(splitPos);

  return [
    ...takeP(prefix, a, numRev(alignment, n)).reverse(),
    ...takeP(suffix, a, numFwd(alignment, n)),
  ];
});

/** @internal */
export const blanks = (n: number): string =>
  pipe(" ", String.repeat(Math.max(0, n)));

/** @internal */
export const resizeBox = dual<
  (r: number, c: number) => (self: string[]) => string[],
  (self: string[], r: number, c: number) => string[]
>(3, (self, r, c) =>
  pipe(
    self.map((line) => takeP(Width.segments(line), " ", c).join("")),
    takeP(blanks(c), r)
  )
);

/** @internal */
export const resizeBoxAligned =
  (r: number, c: number, ha: Box.Alignment, va: Box.Alignment) =>
  (self: string[]) =>
    takePA(
      self.map((line) => takePA(Width.segments(line), ha, " ", c).join("")),
      va,
      blanks(c),
      r
    );

/** @internal */
export const render = Renderer.render;

export const pretty: Renderer.RenderStyle = {
  _tag: "Pretty",
  preserveWhitespace: false,
};

export const plain: Renderer.RenderStyle = {
  _tag: "Plain",
};

/** @internal */
export const renderSync = dual<
  (config?: Renderer.RenderStyle) => <A>(self: Box.Box<A>) => string,
  <A>(self: Box.Box<A>, config?: Renderer.RenderStyle) => string
>(2, (self, config) =>
  Effect.runSync(
    Match.value(config ?? defaultRenderConfig).pipe(
      Match.tag("Plain", () =>
        pipe(
          Renderer.render(self, undefined),
          Effect.provide(Renderer.PlainRendererLive)
        )
      ),
      Match.tag("Pretty", ({ preserveWhitespace }) =>
        pipe(
          Renderer.render(self, { preserveWhitespace }),
          Effect.provide(Renderer.AnsiRendererLive)
        )
      ),
      Match.exhaustive
    )
  )
);

/** @internal */
export const renderWithSpaces = <A>(self: Box.Box<A>): string =>
  pipe(renderBox(self), Array.join("\n"));

/** @internal */
export const renderWith = dual<
  (sep?: string) => <A>(self: Box.Box<A>) => string,
  <A>(self: Box.Box<A>, sep?: string) => string
>(2, <A>(self: Box.Box<A>, sep?: string): string =>
  pipe(renderWithSpaces(self), String.replace(/ /g, sep ?? " "))
);

/** @internal */
export const printBox = (box: Box.Box<unknown>) =>
  Effect.gen(function* () {
    const rendered = yield* render(box);
    yield* Console.log(rendered);
  });

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

/** @internal */
export const match = dual<
  <A, R>(patterns: {
    readonly blank: () => R;
    readonly text: (text: string) => R;
    readonly row: (boxes: Box.Box<A>[]) => R;
    readonly col: (boxes: Box.Box<A>[]) => R;
    readonly subBox: (
      box: Box.Box<A>,
      xAlign: Box.Alignment,
      yAlign: Box.Alignment
    ) => R;
  }) => (self: Box.Box<A>) => R,
  <A, R>(
    self: Box.Box<A>,
    patterns: {
      readonly blank: () => R;
      readonly text: (text: string) => R;
      readonly row: (boxes: Box.Box<A>[]) => R;
      readonly col: (boxes: Box.Box<A>[]) => R;
      readonly subBox: (
        box: Box.Box<A>,
        xAlign: Box.Alignment,
        yAlign: Box.Alignment
      ) => R;
    }
  ) => R
>(
  2,
  <A, R>(
    self: Box.Box<A>,
    patterns: {
      readonly blank: () => R;
      readonly text: (text: string) => R;
      readonly row: (boxes: Box.Box<A>[]) => R;
      readonly col: (boxes: Box.Box<A>[]) => R;
      readonly subBox: (
        box: Box.Box<A>,
        xAlign: Box.Alignment,
        yAlign: Box.Alignment
      ) => R;
    }
  ): R => {
    switch (self.content._tag) {
      case "Blank": {
        return patterns.blank();
      }
      case "Text": {
        return patterns.text(self.content.text);
      }
      case "Row": {
        return patterns.row(self.content.boxes);
      }
      case "Col": {
        return patterns.col(self.content.boxes);
      }
      case "SubBox": {
        return patterns.subBox(
          self.content.box,
          self.content.xAlign,
          self.content.yAlign
        );
      }
    }
  }
);

/*
 *  --------------------------------------------------------------------------------
 *  --  Annotation Functions  ------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/** @internal */
export const annotate = dual<
  <A>(
    annotation: import("../Annotation").Annotation<A>
  ) => <B>(self: Box.Box<B>) => Box.Box<A>,
  <B, A>(
    self: Box.Box<B>,
    annotation: import("../Annotation").Annotation<A>
  ) => Box.Box<A>
>(
  2,
  <B, A>(
    self: Box.Box<B>,
    annotation: import("../Annotation").Annotation<A>
  ): Box.Box<A> =>
    make({
      rows: self.rows,
      cols: self.cols,
      content: self.content as Box.Content<A>, // Cast is safe - content structure is preserved
      annotation,
    })
);

/** @internal */
export const unAnnotate = <A>(self: Box.Box<A>): Box.Box<never> =>
  make({
    rows: self.rows,
    cols: self.cols,
    content: self.content as Box.Content<never>, // Safe cast - removing annotations
  });

/** @internal */
export const reAnnotate = dual<
  <A, B>(transform: (annotation: A) => B) => (self: Box.Box<A>) => Box.Box<B>,
  <A, B>(self: Box.Box<A>, transform: (annotation: A) => B) => Box.Box<B>
>(2, <A, B>(self: Box.Box<A>, transform: (annotation: A) => B): Box.Box<B> => {
  if (!self.annotation) {
    throw new Error("Cannot reAnnotate: Box has no annotation to transform");
  }

  return make({
    rows: self.rows,
    cols: self.cols,
    content: self.content as Box.Content<B>, // Safe cast - content structure preserved
    annotation: {
      ...self.annotation,
      data: transform(self.annotation.data),
    } as import("../Annotation").Annotation<B>,
  });
});

/** @internal */
export const alterAnnotations = dual<
  <A, B>(alter: (annotation: A) => B[]) => (self: Box.Box<A>) => Box.Box<B>[],
  <A, B>(self: Box.Box<A>, alter: (annotation: A) => B[]) => Box.Box<B>[]
>(2, <A, B>(self: Box.Box<A>, alter: (annotation: A) => B[]): Box.Box<B>[] => {
  // Box must have an annotation to alter
  if (!self.annotation) {
    throw new Error("Cannot alter annotations on a box without annotation");
  }

  // Apply alter function to get array of new annotations
  const newAnnotations = alter(self.annotation.data);

  // Helper to recursively process content
  // We don't alter annotations in nested content - only the top-level box annotation
  const processContent = (content: Box.Content<A>): Box.Content<B> => {
    return pipe(
      content,
      Match.type<Box.Content<A>>().pipe(
        Match.tag("Blank", (blank) => blank),
        Match.tag("Text", (text) => text),
        Match.tag("Row", ({ boxes }) => ({
          _tag: "Row" as const,
          boxes: boxes as unknown as Box.Box<B>[], // Type cast - nested boxes maintain their structure
        })),
        Match.tag("Col", ({ boxes }) => ({
          _tag: "Col" as const,
          boxes: boxes as unknown as Box.Box<B>[], // Type cast - nested boxes maintain their structure
        })),
        Match.tag("SubBox", ({ box, xAlign, yAlign }) => ({
          _tag: "SubBox" as const,
          box: box as unknown as Box.Box<B>, // Type cast - nested box maintains its structure
          xAlign,
          yAlign,
        })),
        Match.exhaustive
      )
    );
  };

  // Create a box for each new annotation
  return newAnnotations.map((newAnnotation) =>
    make({
      rows: self.rows,
      cols: self.cols,
      content: processContent(self.content),
      annotation: {
        ...self.annotation,
        data: newAnnotation,
      } as import("../Annotation").Annotation<B>,
    })
  );
});

/** @internal */
export const alterAnnotate = alterAnnotations;
