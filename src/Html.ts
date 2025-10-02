import type * as Annotation from "./Annotation";
import * as internal from "./internal/html";
import type * as Renderer from "./Renderer";

export interface HtmlAnnotationData {
  readonly _tag: "Html";
  readonly element: string;
  readonly attributes?: Record<string, string>;
}

export interface HtmlRenderConfig extends Renderer.RenderConfig {
  readonly indent?: boolean;
  readonly indentSize?: number;
}

export const isHtml: (data: unknown) => data is HtmlAnnotationData =
  internal.isHtml;

export const escapeHtml: (text: string) => string = internal.escapeHtml;

export const div: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.div;

export const span: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.span;

export const p: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.p;

export const h1: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.h1;

export const h2: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.h2;

export const h3: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.h3;

export const h4: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.h4;

export const h5: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.h5;

export const h6: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.h6;

export const section: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.section;

export const article: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.article;

export const header: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.header;

export const footer: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.footer;

export const main: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.main;

export const nav: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.nav;

export const aside: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.aside;

export const ul: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.ul;

export const ol: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.ol;

export const li: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.li;

export const a: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.a;

export const strong: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.strong;

export const em: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.em;

export const code: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.code;

export const pre: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.pre;

export const br: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.br;

export const hr: (
  attributes?: Record<string, string>
) => Annotation.Annotation<HtmlAnnotationData> = internal.hr;
