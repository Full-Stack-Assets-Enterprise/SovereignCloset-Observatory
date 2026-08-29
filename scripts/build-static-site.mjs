import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname,"..");
const output = resolve(root,"dist/site");

await rm(output,{recursive:true,force:true});
await mkdir(resolve(output,"data"),{recursive:true});
await cp(resolve(root,"public"),output,{recursive:true});

for (const filename of ["catalog-seed.json","outfit-prompts.json","identity-progression.json"]) {
  await cp(resolve(root,"data",filename),resolve(output,"data",filename));
}

await cp(resolve(output,"index.html"),resolve(output,"404.html"));
await writeFile(resolve(output,".nojekyll"),"","utf8");
console.log(`Built static Observatory at ${output}`);
