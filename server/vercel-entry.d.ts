declare module "*.mjs" {
  import type { Express } from "express";

  export function configureApplication(app: Express): Express;
  export function configureVercelSpaFallback(app: Express): Express;
}
