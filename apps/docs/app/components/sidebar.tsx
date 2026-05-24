import { Link, useLocation } from "react-router";
import { navigation } from "~/nav.config";

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 shrink-0 border-r border-border min-h-screen sticky top-0 overflow-y-auto p-6">
      <Link to="/" className="block mb-8">
        <h1 className="text-lg font-bold text-foreground">effect-boxes</h1>
      </Link>

      <nav className="space-y-6">
        {navigation.map((section) => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {section.title}
            </h2>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={`block px-3 py-1.5 rounded text-sm transition-colors ${
                        isActive
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
