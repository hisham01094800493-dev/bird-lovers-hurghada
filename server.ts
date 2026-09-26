import express from "express";
import { configureApplication, configureVercelSpaFallback } from "./server/_core/app";

const app = configureApplication(express());
configureVercelSpaFallback(app);

export default app;
