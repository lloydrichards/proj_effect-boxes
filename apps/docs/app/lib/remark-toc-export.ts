import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

export interface TOCItem {
  id: string;
  value: string;
  depth: number;
}

/**
 * Remark plugin that extracts h2-h4 headings from MDX content
 * and injects `export const toc = [...]` into the module.
 */
// biome-ignore lint/suspicious/noExplicitAny: remark plugins operate on untyped AST nodes
const remarkTocExport: () => (tree: any) => void = () => {
  // biome-ignore lint/suspicious/noExplicitAny: remark plugins operate on untyped AST nodes
  return (tree: any) => {
    const headings: TOCItem[] = [];

    // biome-ignore lint/suspicious/noExplicitAny: unist visitor callback uses untyped nodes
    visit(tree, "heading", (node: any) => {
      if (node.depth >= 2 && node.depth <= 4) {
        const value = toString(node);
        // Generate slug matching rehype-slug (github-slugger style)
        const id = value
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();

        headings.push({ id, depth: node.depth, value });
      }
    });

    const tocArrayAst = {
      type: "ArrayExpression",
      elements: headings.map((h) => ({
        type: "ObjectExpression",
        properties: [
          {
            type: "Property",
            key: { type: "Identifier", name: "id" },
            value: { type: "Literal", value: h.id },
            kind: "init",
            computed: false,
            method: false,
            shorthand: false,
          },
          {
            type: "Property",
            key: { type: "Identifier", name: "value" },
            value: { type: "Literal", value: h.value },
            kind: "init",
            computed: false,
            method: false,
            shorthand: false,
          },
          {
            type: "Property",
            key: { type: "Identifier", name: "depth" },
            value: { type: "Literal", value: h.depth },
            kind: "init",
            computed: false,
            method: false,
            shorthand: false,
          },
        ],
      })),
    };

    // Inject: export const toc = [...]
    tree.children.push({
      type: "mdxjsEsm",
      value: "",
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          body: [
            {
              type: "ExportNamedDeclaration",
              specifiers: [],
              source: null,
              declaration: {
                type: "VariableDeclaration",
                kind: "const",
                declarations: [
                  {
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: "toc" },
                    init: tocArrayAst,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // Inject: export const handle = { toc: [...] }
    // React Router reads `handle` from route modules via useMatches()
    tree.children.push({
      type: "mdxjsEsm",
      value: "",
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          body: [
            {
              type: "ExportNamedDeclaration",
              specifiers: [],
              source: null,
              declaration: {
                type: "VariableDeclaration",
                kind: "const",
                declarations: [
                  {
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: "handle" },
                    init: {
                      type: "ObjectExpression",
                      properties: [
                        {
                          type: "Property",
                          key: { type: "Identifier", name: "toc" },
                          value: tocArrayAst,
                          kind: "init",
                          computed: false,
                          method: false,
                          shorthand: false,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
  };
};

export default remarkTocExport;
