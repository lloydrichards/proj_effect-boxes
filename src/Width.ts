import { Array, pipe } from "effect";

const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)"; // Valid string terminator sequences are BEL, ESC\, and 0x9c
const osc = `(?:\\u001B\\][\\s\\S]*?${ST})`; // ESC ] ... ST (non-greedy until first ST)
const csi =
  "[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]"; //  ESC[, intermediates (optional), params (optional), final byte

/**
 * Strips ANSI escape sequences from a string
 * Matches:
 * - CSI sequences: ESC [ ... letter (colors, cursor movement, etc.)
 * - OSC sequences: ESC ] ... (BEL|ESC\|0x9C) (operating system commands)
 * - Simple sequences: ESC letter (save/restore cursor, etc.)
 */
const stripAnsi = (str: string): string =>
  str.replace(new RegExp(`${osc}|${csi}`, "g"), "");

const segmenter = new Intl.Segmenter();

export const segments = (str: string) =>
  pipe(
    segmenter.segment(str),
    Array.fromIterable,
    Array.map((d) => d.segment)
  );

const zeroWidthClusterRegex =
  /^(?:\p{Default_Ignorable_Code_Point}|\p{Control}|\p{Mark}|\p{Surrogate})+$/v; // zero-width clusters (control chars, marks, surrogates, etc.)
const leadingNonPrintingRegex =
  /^[\p{Default_Ignorable_Code_Point}\p{Control}\p{Format}\p{Mark}\p{Surrogate}]+/v; // leading non-printing characters in a cluster
const rgiEmojiRegex = /^\p{RGI_Emoji}$/v; // RGI (Recommended for General Interchange) emoji sequences

const WIDE_CHAR_RANGES = [
  // Hangul Jamo
  [0x11_00, 0x11_5f],
  // CJK symbols and punctuation
  [0x2e_80, 0x2e_ff],
  [0x2f_00, 0x2f_df],
  [0x30_00, 0x30_3f],
  // Hiragana and Katakana
  [0x30_40, 0x30_9f],
  [0x30_a0, 0x30_ff],
  // Bopomofo
  [0x31_00, 0x31_2f],
  // Hangul compatibility
  [0x31_30, 0x31_8f],
  [0x31_90, 0x31_bf],
  [0x31_c0, 0x31_ef],
  // CJK compatibility
  [0x32_00, 0x32_ff],
  [0x33_00, 0x33_ff],
  // CJK extension A
  [0x34_00, 0x4d_bf],
  // CJK unified ideographs
  [0x4e_00, 0x9f_ff],
  // Yi syllables
  [0xa0_00, 0xa4_8f],
  [0xa4_90, 0xa4_cf],
  // Hangul syllables
  [0xac_00, 0xd7_af],
  // CJK compatibility ideographs
  [0xf9_00, 0xfa_ff],
  // Halfwidth and fullwidth forms
  [0xfe_30, 0xfe_6f], // Adjusted to include full-width parens
  // Common emoji ranges
  [0x01_f3_00, 0x01_f5_ff],
  [0x01_f6_00, 0x01_f6_4f],
  [0x01_f6_80, 0x01_f6_ff],
  [0x01_f7_00, 0x01_f7_7f],
  [0x01_f7_80, 0x01_f7_ff],
  [0x01_f8_00, 0x01_f8_ff],
  [0x01_f9_00, 0x01_f9_ff],
  [0x01_fa_00, 0x01_fa_6f],
  [0x01_fa_70, 0x01_fa_ff],
] as const;

const isFullWidth = (codePoint: number): boolean =>
  codePoint === 0x30_00 || // Ideographic space
  (codePoint >= 0xff_01 && codePoint <= 0xff_60) || // Fullwidth ASCII
  (codePoint >= 0xff_e0 && codePoint <= 0xff_e6); // Fullwidth symbols

const isWide = (codePoint: number): boolean => {
  for (const [start, end] of WIDE_CHAR_RANGES) {
    if (codePoint >= start && codePoint <= end) {
      return true;
    }
  }
  return false;
};

const eastAsianWidth = (codePoint: number): number => {
  if (isFullWidth(codePoint) || isWide(codePoint)) {
    return 2;
  }
  return 1;
};

const isZeroWidthCluster = (segment: string): boolean =>
  zeroWidthClusterRegex.test(segment);

/**
 * Calculate the visual width of a string, accounting for:
 * - ANSI escape sequences (stripped by default)
 * - Multi-character emojis (width 2)
 * - East Asian wide characters (width 2)
 * - Zero-width characters (width 0)
 * - Control characters (width 0)
 *
 * @param input - The input string to measure
 * @param options - Configuration options for width calculation
 * @returns The visual width of the string in terminal columns
 *
 * @example
 * ```typescript
 * import { getStringWidth } from "./StringWidth"
 * import { pipe } from "effect"
 *
 * // Basic usage
 * getStringWidth("hello") // => 5
 * getStringWidth("👩‍💻") // => 2 (multi-char emoji)
 * getStringWidth("你好") // => 4 (2 wide chars)
 *
 * // With pipe
 * pipe("hello world", getStringWidth()) // => 11
 *
 * // With ANSI codes (stripped by default)
 * getStringWidth("\x1b[31mred\x1b[0m") // => 3
 * ```
 */
export const ofString = (input: string): number => {
  const string = stripAnsi(input);

  if (string.length === 0) {
    return 0;
  }

  return pipe(
    segments(string),
    Array.reduce(0, (acc, segment) => {
      // Skip zero-width clusters (control chars, pure marks, etc.)
      if (isZeroWidthCluster(segment)) {
        return acc;
      }
      // RGI emoji sequences are always double-width
      if (rgiEmojiRegex.test(segment)) {
        return acc + 2;
      }
      // For other clusters, use East Asian Width of the first visible code point
      const baseVisible = segment.replace(leadingNonPrintingRegex, "");
      if (baseVisible.length > 0) {
        const codePoint = baseVisible.codePointAt(0);
        if (codePoint !== undefined) {
          return acc + eastAsianWidth(codePoint);
        }
      }

      return acc;
    })
  );
};
