/// <reference types="@types/mdx" />

import type { TOCItem } from "~/lib/remark-toc-export";

declare module "*.mdx" {
  import type { ComponentType } from "react";

  const Component: ComponentType;
  export default Component;
  export const toc: TOCItem[];
}
