import { Effect, pipe } from "effect";
import { describe, expect, it } from "vitest";
import * as Box from "../src/Box";
import * as Html from "../src/Html";
import * as Renderer from "../src/Renderer";

describe("Html Integration", () => {
  describe("complex layouts", () => {
    it("renders document structure", async () => {
      const header = Box.text("My Blog").pipe(Box.annotate(Html.h1()));
      const nav = Box.text("Home | About | Contact").pipe(
        Box.annotate(Html.nav())
      );
      const content = Box.text("This is the main content.").pipe(
        Box.annotate(Html.p())
      );
      const footer = Box.text("© 2024").pipe(Box.annotate(Html.footer()));

      const page = Box.vcat([header, nav, content, footer], Box.left).pipe(
        Box.annotate(Html.div({ class: "container" }))
      );

      const result = await pipe(
        page,
        Renderer.render(),
        Effect.provide(Renderer.HtmlRendererLive),
        Effect.runPromise
      );

      expect(result).toContain('<div class="container">');
      expect(result).toContain("<h1>");
      expect(result).toContain("My Blog");
      expect(result).toContain("</h1>");
      expect(result).toContain("<nav>");
      expect(result).toContain("<p>");
      expect(result).toContain("<footer>");
      expect(result).toContain("</div>");
    });

    it("renders list structure", async () => {
      const item1 = Box.text("First item").pipe(Box.annotate(Html.li()));
      const item2 = Box.text("Second item").pipe(Box.annotate(Html.li()));
      const item3 = Box.text("Third item").pipe(Box.annotate(Html.li()));

      const list = Box.vcat([item1, item2, item3], Box.left).pipe(
        Box.annotate(Html.ul({ class: "list" }))
      );

      const result = await pipe(
        list,
        Renderer.render(),
        Effect.provide(Renderer.HtmlRendererLive),
        Effect.runPromise
      );

      expect(result).toContain('<ul class="list">');
      expect(result).toContain("<li>");
      expect(result).toContain("First item");
      expect(result).toContain("Second item");
      expect(result).toContain("Third item");
      expect(result).toContain("</ul>");
    });

    it("renders article with multiple paragraphs", async () => {
      const title = Box.text("Article Title").pipe(Box.annotate(Html.h2()));
      const p1 = Box.text("First paragraph of the article.").pipe(
        Box.annotate(Html.p())
      );
      const p2 = Box.text("Second paragraph continues.").pipe(
        Box.annotate(Html.p())
      );

      const article = Box.vcat([title, p1, p2], Box.left).pipe(
        Box.annotate(Html.article())
      );

      const result = await pipe(
        article,
        Renderer.render(),
        Effect.provide(Renderer.HtmlRendererLive),
        Effect.runPromise
      );

      expect(result).toContain("<article>");
      expect(result).toContain("<h2>");
      expect(result).toContain("Article Title");
      expect(result).toContain("First paragraph");
      expect(result).toContain("Second paragraph");
      expect(result).toContain("</article>");
    });

    it("renders inline elements in a paragraph", async () => {
      const normal = Box.text("This is ");
      const bold = Box.text("bold").pipe(Box.annotate(Html.strong()));
      const more = Box.text(" and this is ");
      const italic = Box.text("italic").pipe(Box.annotate(Html.em()));
      const end = Box.text(".");

      const paragraph = Box.hcat(
        [normal, bold, more, italic, end],
        Box.top
      ).pipe(Box.annotate(Html.p()));

      const result = await pipe(
        paragraph,
        Renderer.render(),
        Effect.provide(Renderer.HtmlRendererLive),
        Effect.runPromise
      );

      expect(result).toContain("<p>");
      expect(result).toContain("This is");
      expect(result).toContain("<strong>");
      expect(result).toContain("bold");
      expect(result).toContain("</strong>");
      expect(result).toContain("<em>");
      expect(result).toContain("italic");
      expect(result).toContain("</em>");
      expect(result).toContain("</p>");
    });

    it("renders code block", async () => {
      const code = Box.text("const x = 42;").pipe(Box.annotate(Html.code()));
      const pre = Box.vcat([code], Box.left).pipe(Box.annotate(Html.pre()));

      const result = await pipe(
        pre,
        Renderer.render(),
        Effect.provide(Renderer.HtmlRendererLive),
        Effect.runPromise
      );

      expect(result).toContain("<pre>");
      expect(result).toContain("<code>");
      expect(result).toContain("const x = 42;");
      expect(result).toContain("</code>");
      expect(result).toContain("</pre>");
    });

    it("renders deeply nested structure", async () => {
      const text = Box.text("Deep").pipe(Box.annotate(Html.span()));
      const level3 = Box.vcat([text], Box.left).pipe(Box.annotate(Html.div()));
      const level2 = Box.vcat([level3], Box.left).pipe(
        Box.annotate(Html.div())
      );
      const level1 = Box.vcat([level2], Box.left).pipe(
        Box.annotate(Html.div())
      );

      const result = await pipe(
        level1,
        Renderer.render(),
        Effect.provide(Renderer.HtmlRendererLive),
        Effect.runPromise
      );

      expect(result).toContain("<div>");
      expect(result).toContain("</div>");
      expect(result).toContain("<span>");
      expect(result).toContain("Deep");
    });

    it("renders mixed content with sections", async () => {
      const section1Content = Box.text("Section 1 content").pipe(
        Box.annotate(Html.p())
      );
      const section1 = Box.vcat([section1Content], Box.left).pipe(
        Box.annotate(Html.section({ id: "s1" }))
      );

      const section2Content = Box.text("Section 2 content").pipe(
        Box.annotate(Html.p())
      );
      const section2 = Box.vcat([section2Content], Box.left).pipe(
        Box.annotate(Html.section({ id: "s2" }))
      );

      const main = Box.vcat([section1, section2], Box.left).pipe(
        Box.annotate(Html.main())
      );

      const result = await pipe(
        main,
        Renderer.render(),
        Effect.provide(Renderer.HtmlRendererLive),
        Effect.runPromise
      );

      expect(result).toContain("<main>");
      expect(result).toContain('<section id="s1">');
      expect(result).toContain("Section 1 content");
      expect(result).toContain('<section id="s2">');
      expect(result).toContain("Section 2 content");
      expect(result).toContain("</main>");
    });
  });

  describe("edge cases", () => {
    it("handles empty boxes in layout", async () => {
      const text = Box.text("Content");
      const empty = Box.emptyBox(0, 0);
      const combined = Box.vcat([text, empty], Box.left).pipe(
        Box.annotate(Html.div())
      );

      const result = await pipe(
        combined,
        Renderer.render(),
        Effect.provide(Renderer.HtmlRendererLive),
        Effect.runPromise
      );

      expect(result).toContain("<div>");
      expect(result).toContain("Content");
      expect(result).toContain("</div>");
    });

    it("handles special characters throughout layout", async () => {
      const t1 = Box.text("<tag>").pipe(Box.annotate(Html.span()));
      const t2 = Box.text("&entity;").pipe(Box.annotate(Html.span()));
      const combined = Box.vcat([t1, t2], Box.left).pipe(
        Box.annotate(Html.div())
      );

      const result = await pipe(
        combined,
        Renderer.render(),
        Effect.provide(Renderer.HtmlRendererLive),
        Effect.runPromise
      );

      expect(result).toContain("&lt;tag&gt;");
      expect(result).toContain("&amp;entity;");
    });

    it("preserves box alignment in HTML", async () => {
      const left = Box.text("L");
      const right = Box.text("R");
      const aligned = Box.hcat([left, right], Box.top).pipe(
        Box.annotate(Html.div())
      );

      const result = await pipe(
        aligned,
        Renderer.render(),
        Effect.provide(Renderer.HtmlRendererLive),
        Effect.runPromise
      );

      expect(result).toContain("<div>");
      expect(result).toContain("L");
      expect(result).toContain("R");
      expect(result).toContain("</div>");
    });
  });

  describe("real-world scenarios", () => {
    it("renders a simple card component", async () => {
      const cardTitle = Box.text("Card Title").pipe(
        Box.annotate(Html.h3({ class: "card-title" }))
      );
      const cardBody = Box.text("This is the card body text.").pipe(
        Box.annotate(Html.p({ class: "card-body" }))
      );
      const cardFooter = Box.text("Read more").pipe(
        Box.annotate(Html.a({ href: "#", class: "card-link" }))
      );

      const card = Box.vcat([cardTitle, cardBody, cardFooter], Box.left).pipe(
        Box.annotate(Html.div({ class: "card" }))
      );

      const result = await pipe(
        card,
        Renderer.render(),
        Effect.provide(Renderer.HtmlRendererLive),
        Effect.runPromise
      );

      expect(result).toContain('<div class="card">');
      expect(result).toContain('<h3 class="card-title">');
      expect(result).toContain("Card Title");
      expect(result).toContain('<p class="card-body">');
      expect(result).toContain('<a href="#" class="card-link">');
      expect(result).toContain("Read more");
    });

    it("renders a navigation menu", async () => {
      const home = Box.text("Home").pipe(Box.annotate(Html.a({ href: "/" })));
      const about = Box.text("About").pipe(
        Box.annotate(Html.a({ href: "/about" }))
      );
      const contact = Box.text("Contact").pipe(
        Box.annotate(Html.a({ href: "/contact" }))
      );

      const homeItem = Box.vcat([home], Box.left).pipe(Box.annotate(Html.li()));
      const aboutItem = Box.vcat([about], Box.left).pipe(
        Box.annotate(Html.li())
      );
      const contactItem = Box.vcat([contact], Box.left).pipe(
        Box.annotate(Html.li())
      );

      const menu = Box.vcat([homeItem, aboutItem, contactItem], Box.left).pipe(
        Box.annotate(Html.ul({ class: "menu" }))
      );

      const result = await pipe(
        menu,
        Renderer.render(),
        Effect.provide(Renderer.HtmlRendererLive),
        Effect.runPromise
      );

      expect(result).toContain('<ul class="menu">');
      expect(result).toContain('<a href="/">');
      expect(result).toContain("Home");
      expect(result).toContain('<a href="/about">');
      expect(result).toContain("About");
      expect(result).toContain('<a href="/contact">');
      expect(result).toContain("Contact");
    });
  });
});
