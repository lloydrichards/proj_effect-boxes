import type { ReactNode } from "react";

export function CodeExample({
  children,
  layout = "stacked",
}: {
  children: ReactNode;
  layout?: "stacked" | "side-by-side";
}) {
  return (
    <div
      className={
        layout === "side-by-side"
          ? "grid grid-cols-1 md:grid-cols-2 gap-4 my-6 *:my-0 [&>figure]:h-full [&>figure>div]:h-full [&>figure>div>pre]:h-full"
          : "flex flex-col my-6 *:my-0 [&>*+*]:mt-0 [&>pre+div]:rounded-t-none [&>pre]:rounded-b-none"
      }
    >
      {children}
    </div>
  );
}
