const forbiddenTransformations = [
  /\bage[ -]?progression\b/gi,
  /\baging\b/gi,
  /\bmake (?:him|the subject) (?:look )?(?:older|younger)\b/gi,
  /\b3\.5(?:\s*(?:to|–|—|-)\s*4\.5)?[ -]?inch(?:es)?\b/gi,
  /\b4\.5[ -]?inch(?:es)?\b/gi
];

export function sanitizeOutfitPrompt(rawPrompt) {
  let sanitized = rawPrompt
    .replace(/^Master Identity Lock\s*[–—-]\s*Ultimate Identity Specification\s*[–—-]\s*/i, "")
    .replace(/(?:at his final 36[‑-]month stage with )?dramatic V[‑-]taper, full black[‑-]grey[‑-]crimson tattoos, 5[‑-]inch glossy black tunnels, sculpted narrow beard and short crimson[‑-]accented hair,?\s*/gi, "")
    .replace(/\bshort crimson[‑-]accented hair\b/gi, "short black 360 waves")
    .trim();

  for (const pattern of forbiddenTransformations) sanitized = sanitized.replace(pattern, "");
  return sanitized.replace(/\s{2,}/g, " ").trim();
}

export function composeGenerationPrompt({ outfitPrompt, progression }) {
  if (!outfitPrompt || !progression) throw new Error("An outfit prompt and progression level are required.");
  const wardrobe = sanitizeOutfitPrompt(outfitPrompt.rawPrompt);
  const compiled = [
    "MASTER IDENTITY LOCK",
    "Create the same real adult subject represented by the approved identity-reference set. Preserve facial geometry, ethnicity, skin undertone, eye shape, nose, mouth, jaw, stretched-ear anatomy, and recognizable identity. Styling references may influence wardrobe, physique destination, tattoo language, grooming, jewelry, lighting, and environment only; never recast, blend, average, or substitute the person.",
    "",
    `IDENTITY PROGRESSION LEVEL — ${progression.label.toUpperCase()} (MONTH ${progression.month})`,
    `Physique: ${progression.physique}.`,
    `Hair: ${progression.hair}.`,
    `Facial grooming: ${progression.facialHair}.`,
    `Ear jewelry: ${progression.gauges}. The approved terminal goal is exactly 5 inches.`,
    `Tattoos: ${progression.tattoos}.`,
    `Presence: ${progression.presence}.`,
    "Signature details: rectangular black eyeglasses, small nose piercing, and the signature chain and pendant remain part of the identity unless physically hidden by the exact camera angle.",
    "",
    `OUTFIT ${String(outfitPrompt.outfitId).padStart(3, "0")} — ${outfitPrompt.title}`,
    wardrobe,
    "",
    "OUTPUT CONTRACT",
    "Produce exactly one standalone, portrait-oriented, photorealistic fashion-editorial image with one subject, one scene, one outfit, and one pose. Never create a collage, grid, contact sheet, diptych, triptych, montage, split panel, before-and-after composite, or multiple versions in one frame. Show realistic fabric behavior, jewelry weight, anatomy, stretched lobes, skin texture, tattoo placement, and lighting. Do not depict aging or age progression. Do not add required blonde, red, or other colored hair detailing. Identity preservation outranks every styling instruction."
  ].join("\n");

  return {
    compiledPrompt: compiled,
    policy: {
      identityLocked: true,
      terminalGaugeInches: 5,
      agingProhibited: true,
      coloredHairRequired: false,
      standaloneImageOnly: true
    }
  };
}

export function validateCompiledPrompt(compiledPrompt) {
  const lower = compiledPrompt.toLowerCase();
  const checks = {
    includesIdentityLock: lower.includes("master identity lock"),
    includesFiveInchGoal: /exactly 5 inches/.test(lower),
    excludesOldGaugeRange: !/3\.5\s*(?:to|–|—|-)\s*4\.5/.test(lower),
    prohibitsAging: lower.includes("do not depict aging or age progression"),
    removesColoredHairRequirement: lower.includes("do not add required blonde, red, or other colored hair detailing"),
    standaloneOnly: lower.includes("exactly one standalone") && lower.includes("never create a collage")
  };
  return { passed: Object.values(checks).every(Boolean), checks };
}
