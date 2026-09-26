import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve("dist/public");
const destination = resolve("public");

if (!existsSync(resolve(source, "index.html"))) {
  throw new Error("Vite build output was not found at dist/public/index.html");
}

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true, force: true });

const configuredSiteUrl =
  process.env.VITE_SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL;
if (!configuredSiteUrl) {
  throw new Error(
    "Set VITE_SITE_URL to the public HTTPS production domain before building for Vercel.",
  );
}
const siteUrl = /^https?:\/\//i.test(configuredSiteUrl)
  ? configuredSiteUrl.replace(/\/$/, "")
  : `https://${configuredSiteUrl.replace(/\/$/, "")}`;

const htmlPath = resolve(destination, "index.html");
let html = readFileSync(htmlPath, "utf8").replaceAll("%VITE_SITE_URL%", siteUrl);
const analyticsEndpoint = process.env.VITE_ANALYTICS_ENDPOINT;
const analyticsWebsiteId = process.env.VITE_ANALYTICS_WEBSITE_ID;
if (!analyticsEndpoint || !analyticsWebsiteId) {
  html = html.replace(
    /\s*<script defer src="[^\"]*umami" data-website-id="[^\"]*"><\/script>/,
    "",
  );
}
writeFileSync(htmlPath, html);
console.log("Copied Vite assets from dist/public to public for Vercel.");
