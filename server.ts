import express from "express";
import { configureApplication, configureVercelSpaFallback } from "./dist/vercel-app.mjs";

const app = configureApplication(express());
configureVercelSpaFallback(app);

export default app;
