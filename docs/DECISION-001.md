# ADR-001: Separate catalog authority from image generation

Status: accepted for MVP proof  
Date: 2026-08-29

## Decision

Build the catalog as Layer 1 and the image-generation orchestrator as Layer 2. Store source outfit prompts unchanged, then compile them with a separately versioned identity-progression record at job creation time.

## Why

Embedding identity evolution directly inside every outfit record creates drift and makes corrections expensive. Separation lets a single correction—such as the 5-inch terminal gauge goal or removal of colored hair requirements—apply to all 200 outfits without rewriting source history.

## Consequences

- Source prompts retain provenance and can be compared with compiled prompts.
- Identity canon changes are versionable and testable.
- A live provider can be replaced without rewriting the catalog.
- The system needs explicit composition and QA gates, which the MVP implements.
