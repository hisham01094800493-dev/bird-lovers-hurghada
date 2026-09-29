import { trpc } from "@/lib/trpc";
import { COOKIE_NAME } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

// Remove older app shells that can otherwise keep serving a broken bundle after deploys.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
      .then(() => "caches" in window ? caches.keys() : [])
      .then(keys => Promise.all(keys.filter(key => key.startsWith("bird-lovers-shell")).map(key => caches.delete(key))))
      .catch(() => undefined);
  });
}
if (typeof window !== "undefined") {
  try {
    sessionStorage.removeItem("bird-lovers-boot-retries");
  } catch {
    // sessionStorage unavailable
  }
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    (window as Window & { __birdLoversInstallPrompt?: Event }).__birdLoversInstallPrompt = event;
    localStorage.setItem("bird-lovers-install-available", new Date().toISOString());
  });
  window.addEventListener("appinstalled", () => {
    delete (window as Window & { __birdLoversInstallPrompt?: Event }).__birdLoversInstallPrompt;
    localStorage.setItem("bird-lovers-installed", new Date().toISOString());
  });
}

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Preview auto-login fallback: when the browser blocks iframe cookies
        // (Safari ITP / private browsing / WebView), the runtime mirrors the
        // session into sessionStorage so we can forward it as a Bearer token.
        // The regular OAuth cookie flow keeps working and takes priority server-side.
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
