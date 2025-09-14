/**
 * Type guard to check if annotation data is a CMD type
 */

export const isCmdType = (data: unknown): data is CmdType => {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;
  return (
    "_tag" in obj &&
    typeof obj._tag === "string" &&
    "command" in obj &&
    typeof obj.command === "string" &&
    ["Cursor", "Screen", "Visibility", "Utility"].includes(obj._tag)
  );
};
/**
 * ANSI command types - discriminated union for all cursor/screen control commands
 */

export type CmdType = {
  readonly _tag: "Cursor" | "Screen" | "Visibility" | "Utility";
  readonly command: string;
};
