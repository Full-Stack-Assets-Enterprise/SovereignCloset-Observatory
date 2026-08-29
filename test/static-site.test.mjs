import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname,"..");

test("builds a GitHub Pages-ready autonomous Observatory", async () => {
  const packageJson = JSON.parse(await readFile(resolve(root,"package.json"),"utf8"));
  assert.equal(packageJson.scripts["build:site"],"node scripts/build-static-site.mjs");

  const result = spawnSync(process.execPath,["scripts/build-static-site.mjs"],{
    cwd:root,
    encoding:"utf8"
  });
  assert.equal(result.status,0,result.stderr);

  const html = await readFile(resolve(root,"dist/site/index.html"),"utf8");
  const app = await readFile(resolve(root,"dist/site/app.js"),"utf8");
  const workflow = await readFile(resolve(root,".github/workflows/pages.yml"),"utf8");
  assert.match(html,/href="\.\/styles\.css"/);
  assert.match(html,/src="\.\/app\.js"/);
  assert.match(app,/createStaticApi/);
  assert.match(workflow,/actions\/deploy-pages/);

  for (const path of [
    "dist/site/static-runtime.js",
    "dist/site/data/catalog-seed.json",
    "dist/site/data/outfit-prompts.json",
    "dist/site/data/identity-progression.json",
    "dist/site/.nojekyll"
  ]) assert.ok((await stat(resolve(root,path))).isFile(),`missing ${path}`);
});
