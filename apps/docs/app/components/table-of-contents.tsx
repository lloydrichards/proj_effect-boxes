import { ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { useActiveHeading } from "~/hooks/use-active-heading";
import type { TOCItem } from "~/lib/remark-toc-export";
import { cn } from "~/lib/utils";

interface TableOfContentsProps {
  toc: TOCItem[];
  /** Render only the desktop right-rail variant */
  desktopOnly?: boolean;
}

export function TableOfContents({ toc, desktopOnly }: TableOfContentsProps) {
  const ids = useMemo(() => toc.map((item) => item.id), [toc]);
  const activeId = useActiveHeading(ids);

  if (toc.length === 0) return null;

  if (desktopOnly) {
    return (
      <nav className="hidden xl:block sticky top-16 max-h-[calc(100vh-4rem)] w-48 shrink-0 overflow-y-auto scrollbar-none">
        <p className="mb-3 font-heading text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
          On this page
        </p>
        <TOCList toc={toc} activeId={activeId} />
      </nav>
    );
  }

  // Mobile-only: collapsible above content
  return <MobileTOC toc={toc} activeId={activeId} />;
}

function MobileTOC({ toc, activeId }: { toc: TOCItem[]; activeId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="xl:hidden mb-6 border rounded-md px-4 py-2"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-semibold">
        On this page
        <ChevronRight
          className={cn("h-4 w-4 transition-transform", open && "rotate-90")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <TOCList toc={toc} activeId={activeId} onClick={() => setOpen(false)} />
      </CollapsibleContent>
    </Collapsible>
  );
}

interface TOCNode {
  item: TOCItem;
  children: TOCNode[];
}

/** Convert flat TOC array into a nested tree */
function buildTree(items: TOCItem[]): TOCNode[] {
  const root: TOCNode[] = [];
  const stack: TOCNode[] = [];

  for (const item of items) {
    const node: TOCNode = { item, children: [] };

    // Pop stack until we find a parent with lower depth
    while (
      stack.length > 0 &&
      stack[stack.length - 1]!.item.depth >= item.depth
    ) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1]!.children.push(node);
    }

    stack.push(node);
  }

  return root;
}

function TOCList({
  toc,
  activeId,
  onClick,
}: {
  toc: TOCItem[];
  activeId: string;
  onClick?: () => void;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ block: "start", behavior: "smooth" });
        history.replaceState(null, "", `#${id}`);
      }
      onClick?.();
    },
    [onClick]
  );

  const tree = useMemo(() => buildTree(toc), [toc]);

  return (
    <ul className="text-sm">
      {tree.map((node) => (
        <TOCNodeItem
          key={node.item.id}
          node={node}
          activeId={activeId}
          onClickLink={handleClick}
        />
      ))}
    </ul>
  );
}

function TOCNodeItem({
  node,
  activeId,
  onClickLink,
}: {
  node: TOCNode;
  activeId: string;
  onClickLink: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
}) {
  const { item, children } = node;
  const isActive = item.id === activeId;

  return (
    <li>
      <a
        href={`#${item.id}`}
        onClick={(e) => onClickLink(e, item.id)}
        className={cn(
          "block py-1 transition-colors duration-150 hover:text-foreground",
          isActive ? "text-primary font-medium" : "text-muted-foreground"
        )}
      >
        {item.value}
      </a>
      {children.length > 0 && (
        <ul className="ml-3 border-l border-border pl-3 space-y-0.5">
          {children.map((child) => (
            <TOCNodeItem
              key={child.item.id}
              node={child}
              activeId={activeId}
              onClickLink={onClickLink}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
