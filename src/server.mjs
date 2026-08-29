import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeDatabase } from "./database.mjs";
import { FashionIdentityService } from "./services.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicRoot = resolve(root, "public");

const json = (res,status,data) => { const body=JSON.stringify(data); res.writeHead(status,{"content-type":"application/json; charset=utf-8","content-length":Buffer.byteLength(body),"cache-control":"no-store"}); res.end(body); };
const body = async (req) => {
  const chunks=[]; let size=0;
  for await (const chunk of req) { size += chunk.length; if (size > 1_000_000) throw new Error("Request body too large."); chunks.push(chunk); }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
};
const query = (url) => Object.fromEntries(url.searchParams.entries());

async function staticFile(req,res,url) {
  const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const path = resolve(publicRoot, requested);
  if (!(path === publicRoot || path.startsWith(`${publicRoot}${sep}`))) return json(res,403,{error:"Forbidden."});
  const types = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".svg":"image/svg+xml"};
  try { const data=await readFile(path); res.writeHead(200,{"content-type":types[extname(path)]||"application/octet-stream","content-length":data.length}); res.end(data); }
  catch { const data=await readFile(resolve(publicRoot,"index.html")); res.writeHead(200,{"content-type":"text/html; charset=utf-8","content-length":data.length}); res.end(data); }
}

export function createFashionServer({ databasePath = process.env.FIE_DATABASE_PATH || undefined } = {}) {
  const db = initializeDatabase(databasePath);
  const service = new FashionIdentityService(db);

  const api = async (req,res,url) => {
    if (req.method === "GET" && url.pathname === "/api/health") return json(res,200,{status:"ok",branch:"iteration/fully-autonomous",mode:"autonomous-internal",liveImageProvidersEnabled:false});
    if (req.method === "GET" && url.pathname === "/api/stats") return json(res,200,service.stats());
    if (req.method === "GET" && url.pathname === "/api/products") return json(res,200,service.listProducts(query(url)));
    if (req.method === "POST" && url.pathname === "/api/products") return json(res,201,service.createProduct(await body(req)));
    if (req.method === "GET" && url.pathname === "/api/progression-levels") return json(res,200,service.listProgressionLevels());
    if (req.method === "GET" && url.pathname === "/api/outfit-prompts") return json(res,200,service.listPrompts(query(url)));
    if (req.method === "POST" && url.pathname === "/api/compose") { const input=await body(req); return json(res,200,service.compose(input.outfitPromptId,input.progressionLevelId)); }
    if (req.method === "GET" && url.pathname === "/api/generation-jobs") return json(res,200,service.listJobs());
    if (req.method === "POST" && url.pathname === "/api/generation-jobs") return json(res,201,service.createJob(await body(req)));
    if (req.method === "GET" && url.pathname === "/api/autonomy/overview") return json(res,200,service.autonomyOverview());
    if (req.method === "GET" && url.pathname === "/api/autonomy/cycles") return json(res,200,service.listAutonomyCycles(query(url).limit));
    if (req.method === "POST" && url.pathname === "/api/autonomy/cycles/run") return json(res,201,service.runAutonomyCycle(await body(req)));
    const run = url.pathname.match(/^\/api\/generation-jobs\/([^/]+)\/run$/);
    if (req.method === "POST" && run) return json(res,200,service.runProofJob(run[1]));
    return json(res,404,{error:"API route not found."});
  };

  return createServer(async (req,res) => {
    const url = new URL(req.url,`http://${req.headers.host||"localhost"}`);
    try { if (url.pathname.startsWith("/api/")) await api(req,res,url); else await staticFile(req,res,url); }
    catch (error) { json(res,400,{error:error.message}); }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  const server = createFashionServer();
  server.listen(port,"127.0.0.1",()=>console.log(`Rare One Autonomy Observatory running at http://127.0.0.1:${port}`));
}
