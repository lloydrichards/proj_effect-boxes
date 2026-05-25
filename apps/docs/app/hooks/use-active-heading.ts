import { useEffect, useState } from "react";

/**
 * Tracks which heading is currently active using IntersectionObserver.
 * Returns the `id` of the heading currently in view.
 */
export function useActiveHeading(ids: string[]): string {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (ids.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        // Top offset accounts for sticky header; bottom margin ensures
        // the heading near the top of the viewport is considered active
        rootMargin: "-80px 0px -80% 0px",
      }
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}
