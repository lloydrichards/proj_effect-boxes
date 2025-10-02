/**
 * @fileoverview HTML Rendering Demo - Simple Blog
 *
 * This example demonstrates how to use the HtmlRenderer and HtmlAnnotation
 * to create a prerendered HTML document for a simple blog.
 */

import { Console, Effect, pipe } from "effect";
import * as Box from "../src/Box";
import * as Html from "../src/Html";
import * as Renderer from "../src/Renderer";

const main = Effect.gen(function* () {
  // Create blog header
  const blogTitle = Box.text("My Awesome Blog").pipe(
    Box.annotate(Html.h1({ class: "blog-title" }))
  );

  const navigation = Box.text("Home | About | Blog | Contact").pipe(
    Box.annotate(Html.nav())
  );

  // Create blog post
  const postTitle = Box.text("Getting Started with Effect-Boxes").pipe(
    Box.annotate(Html.h2())
  );

  const postMeta = Box.text("Published on October 2, 2025 by John Doe").pipe(
    Box.annotate(Html.p({ class: "meta" }))
  );

  const intro = Box.text(
    "Effect-boxes is a powerful library for creating layouts with functional composition."
  ).pipe(Box.annotate(Html.p()));

  const featuresIntro = Box.text("Here are some key features:").pipe(
    Box.annotate(Html.p())
  );

  // Create feature list items
  const feature1 = Box.text("Pure functional design").pipe(
    Box.annotate(Html.li())
  );
  const feature2 = Box.text("Type-safe rendering").pipe(
    Box.annotate(Html.li())
  );
  const feature3 = Box.text("Multiple output formats").pipe(
    Box.annotate(Html.li())
  );

  // Combine features into a list
  const featureList = Box.vcat([feature1, feature2, feature3], Box.left).pipe(
    Box.annotate(Html.ul())
  );

  const conclusion = Box.text("Start building amazing layouts today!").pipe(
    Box.annotate(Html.p())
  );

  // Create sidebar
  const sidebarTitle = Box.text("Recent Posts").pipe(Box.annotate(Html.h3()));

  const recentPost1 = Box.text("Introduction to Functional Programming").pipe(
    Box.annotate(Html.a({ href: "/post1" }))
  );
  const recentPost2 = Box.text("Advanced TypeScript Patterns").pipe(
    Box.annotate(Html.a({ href: "/post2" }))
  );
  const recentPost3 = Box.text("Building CLI Tools with Effect").pipe(
    Box.annotate(Html.a({ href: "/post3" }))
  );

  const recentPosts = Box.vcat(
    [recentPost1, recentPost2, recentPost3],
    Box.left
  );

  const sidebar = Box.vcat([sidebarTitle, recentPosts], Box.left).pipe(
    Box.annotate(Html.aside({ class: "sidebar" }))
  );

  // Combine post content
  const postContent = Box.vcat(
    [postTitle, postMeta, intro, featuresIntro, featureList, conclusion],
    Box.left
  ).pipe(Box.annotate(Html.article({ class: "post" })));

  // Create main content area with post and sidebar side by side
  const mainContent = Box.hcat([postContent, sidebar], Box.top).pipe(
    Box.annotate(Html.main())
  );

  // Create footer
  const footer = Box.text(
    "© 2025 My Awesome Blog. Built with Effect-Boxes."
  ).pipe(Box.annotate(Html.footer()));

  // Combine everything into a complete page
  const completePage = Box.vcat(
    [blogTitle, navigation, mainContent, footer],
    Box.left
  ).pipe(Box.annotate(Html.div({ class: "container" })));

  // Render the HTML
  const html = yield* pipe(
    completePage,
    Renderer.render(),
    Effect.provide(Renderer.HtmlPrettyRendererLive)
  );

  // Print to console
  yield* Console.log("=== Generated HTML Blog ===\n");
  yield* Console.log(html);
  yield* Console.log("\n=== End of HTML ===");
});

Effect.runPromise(main);
