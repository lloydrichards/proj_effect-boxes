import {
  index,
  prefix,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  index("content/index.mdx"),
  route("getting-started", "content/getting-started.mdx"),
  ...prefix("guides", [
    route("using-box", "content/guides/using-box.mdx"),
    route("using-annotation", "content/guides/using-annotation.mdx"),
    route("using-ansi", "content/guides/using-ansi.mdx"),
    route("using-layout", "content/guides/using-layout.mdx"),
    route("common-patterns", "content/guides/common-patterns.mdx"),
  ]),
  ...prefix("api", [
    route("box", "content/api/box.mdx"),
    route("annotation", "content/api/annotation.mdx"),
    route("ansi", "content/api/ansi.mdx"),
  ]),
] satisfies RouteConfig;
