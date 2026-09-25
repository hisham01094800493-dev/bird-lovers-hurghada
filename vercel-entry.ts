import express from "express";
import path from "path";
import { createApp } from "./server/app";

const app = createApp();
const publicDir = path.join(process.cwd(), "dist", "public");
app.use(express.static(publicDir));
app.use((_req, res) => res.sendFile(path.join(publicDir, "index.html")));

export default app;
