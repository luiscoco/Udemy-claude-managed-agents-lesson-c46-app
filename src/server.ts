import { serveStudentAsset } from "./student-assets";
import http from "node:http";
import { readFile, appendFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { lesson } from "./lesson";
import { configured, explainLive } from "./provider";
import { object } from "./core";
if (existsSync(".env")) process.loadEnvFile(".env");
const port = Number(process.env.PORT || 3000 + lesson.number);
let busy = false;
const json = (res: http.ServerResponse, code: number, value: unknown) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(value)); };
http.createServer(async (req, res) => {
  try {
    if (await serveStudentAsset(req, res)) return;
    const url = new URL(req.url || "/", "http://localhost");
    if (req.method === "GET" && url.pathname === "/api/lesson") return json(res, 200, { ...lesson, run: undefined, liveConfigured: configured() });
    if (req.method === "GET" && url.pathname === "/api/source") { res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }); res.end(await readFile(path.join(__dirname, "../src/lesson.ts"), "utf8")); return; }
    if (req.method === "POST" && ["/api/run", "/api/live"].includes(url.pathname)) {
      const origin = req.headers.origin;
      if (origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(origin)) return json(res, 403, { error: "Foreign origin" });
      if (req.headers["content-type"]?.split(";")[0] !== "application/json") return json(res, 415, { error: "JSON input required" });
      if (busy) return json(res, 409, { error: "An experiment is already running. Wait for it to finish." });
      let raw = "";
      for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 64000) return json(res, 413, { error: "Input exceeds the sample limit" }); }
      const input = object(JSON.parse(raw));
      busy = true;
      try {
        const result = await lesson.run(input);
        const id = randomUUID();
        if (url.pathname === "/api/live") return json(res, 200, await explainLive(lesson.title, result));
        await mkdir(path.join(__dirname, "../.lab-data"), { recursive: true });
        await appendFile(path.join(__dirname, "../.lab-data/runs.jsonl"), JSON.stringify({ id, at: new Date().toISOString(), lesson: lesson.number, result }) + "\n");
        return json(res, 200, { id, ...result });
      } finally { busy = false; }
    }
    const assets: Record<string, [string, string]> = { "/": ["../public/index.html", "text/html; charset=utf-8"], "/style.css": ["../public/style.css", "text/css"], "/app.js": ["client.js", "text/javascript"], "/astronaut.png": ["../public/astronaut.png", "image/png"] };
    if (req.method === "GET" && assets[url.pathname]) { const [file, mime] = assets[url.pathname]; const data = await readFile(path.join(__dirname, file)); res.writeHead(200, { "Content-Type": mime, "Cache-Control": "no-store" }); res.end(data); return; }
    json(res, 404, { error: "Not found" });
  } catch (error) { json(res, 400, { error: error instanceof Error ? error.message : "Experiment failed" }); }
}).listen(port, "127.0.0.1", () => console.log(`Lesson C${String(lesson.number).padStart(2, "0")} ready: http://127.0.0.1:${port}`));
