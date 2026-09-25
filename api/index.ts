import express from "express";
import { createApp } from "../server/app";
import { serveStatic } from "../server/_core/vite";

void express;
const app = createApp();
serveStatic(app);

export default app;
