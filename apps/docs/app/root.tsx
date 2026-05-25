import { MDXProvider } from "@mdx-js/react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "react-router";
import { AppSidebar } from "~/components/app-sidebar";
import { TableOfContents } from "~/components/table-of-contents";
import { ThemeToggle } from "~/components/theme-toggle";
import { proseComponents } from "~/components/tokens/prose-components";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import type { TOCItem } from "~/lib/remark-toc-export";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400;500;700&display=swap",
  },
];

const themeScript = `
(function() {
  var theme = localStorage.getItem('theme');
  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: theme script must be inline to prevent FOUC */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        <SidebarProvider>
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="flex items-center gap-2 px-8 py-4">
              <SidebarTrigger />
              <div className="flex-1" />
              <ThemeToggle />
            </header>
            <main className="flex-1 w-full max-w-4xl xl:max-w-6xl mx-auto px-8 py-8">
              {children}
            </main>
          </div>
        </SidebarProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const toc: TOCItem[] = (lastMatch?.handle as any)?.toc ?? [];
  const hasToc = toc.length > 0;

  return (
    <MDXProvider components={proseComponents}>
      {hasToc && <TableOfContents toc={toc} />}
      <div className={hasToc ? "xl:flex xl:items-start xl:gap-8" : undefined}>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
        {hasToc && <TableOfContents toc={toc} desktopOnly />}
      </div>
    </MDXProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
