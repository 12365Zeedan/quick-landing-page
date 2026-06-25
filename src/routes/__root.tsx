import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AppProvider } from "@/lib/app-context";
import { OrgProvider } from "@/lib/org-context";
import { Toaster } from "sonner";
import { useDesktopLocalStorageHydration } from "@/lib/desktop-storage";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PharmLedger — Pharmacy Financial Management" },
      { name: "description", content: "Modern financial management SaaS for pharmacies. Revenue, expenses, VAT, payroll and statements in Arabic and English." },
      { name: "author", content: "PharmLedger" },
      { property: "og:title", content: "PharmLedger — Pharmacy Financial Management" },
      { property: "og:description", content: "Modern financial management SaaS for pharmacies. Revenue, expenses, VAT, payroll and statements in Arabic and English." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PharmLedger — Pharmacy Financial Management" },
      { name: "twitter:description", content: "Modern financial management SaaS for pharmacies. Revenue, expenses, VAT, payroll and statements in Arabic and English." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9a824082-3af1-4a37-930f-7121a7b1b8ef/id-preview-7706532b--b86e98e1-f29f-4c7f-b9ef-00000e8b1101.lovable.app-1779971350541.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9a824082-3af1-4a37-930f-7121a7b1b8ef/id-preview-7706532b--b86e98e1-f29f-4c7f-b9ef-00000e8b1101.lovable.app-1779971350541.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const hydrated = useDesktopLocalStorageHydration();

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <OrgProvider>
          {!hydrated ? (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
              <div className="text-center text-muted-foreground">Loading saved data...</div>
            </div>
          ) : (
            <>
              <Outlet />
              <Toaster richColors position="top-center" />
            </>
          )}
        </OrgProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
