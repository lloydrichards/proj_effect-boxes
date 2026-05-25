export type NavItem = {
  label: string;
  href: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navigation: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Getting Started", href: "/getting-started" }],
  },
  {
    title: "Guides",
    items: [
      { label: "Using Box", href: "/guides/using-box" },
      { label: "Using Annotation", href: "/guides/using-annotation" },
      { label: "Using Ansi", href: "/guides/using-ansi" },
      { label: "Using Layout", href: "/guides/using-layout" },
      { label: "Common Patterns", href: "/guides/common-patterns" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { label: "Box", href: "/api/box" },
      { label: "Annotation", href: "/api/annotation" },
      { label: "Ansi", href: "/api/ansi" },
      { label: "Cmd", href: "/api/cmd" },
      { label: "Html", href: "/api/html" },
      { label: "Layout", href: "/api/layout" },
      { label: "Reactive", href: "/api/reactive" },
      { label: "Renderer", href: "/api/renderer" },
    ],
  },
];
