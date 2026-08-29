import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "sources/deepseek/outfit-prompts-053-252.md");
const outputPath = resolve(root, "data/outfit-prompts.json");
const source = await readFile(sourcePath, "utf8");

const heading = /^(\d{1,3})\.\s+(.+?)\s+\((\d{3})\)\s*$/gm;
const matches = [...source.matchAll(heading)];
const prompts = matches.map((match, index) => {
  const promptNumber = Number(match[1]);
  const outfitId = Number(match[3]);
  const start = match.index + match[0].length;
  const end = matches[index + 1]?.index ?? source.indexOf("End of 200 prompts.");
  const rawPrompt = source.slice(start, end).trim();
  return {
    id: `prompt-${String(promptNumber).padStart(3, "0")}`,
    promptNumber,
    outfitId,
    title: match[2].trim(),
    source: "DeepSeek shared conversation",
    sourceRange: "Outfits 053-252",
    defaultProgressionLevel: "north-star",
    rawPrompt
  };
});

const ids = new Set(prompts.map((prompt) => prompt.outfitId));
if (prompts.length !== 200 || ids.size !== 200 || Math.min(...ids) !== 53 || Math.max(...ids) !== 252) {
  throw new Error(`Prompt import failed: count=${prompts.length}, uniqueOutfits=${ids.size}`);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(prompts, null, 2)}\n`, "utf8");
console.log(`Imported ${prompts.length} prompts covering outfits 053-252.`);
