# DOMestic Violence — No Escape from Callback Hell!

A DOOM-inspired browser game that turns a website's HTML DOM into a level. Read the [story and world-building](STORY.md).

## Getting started

This is a pnpm and Turborepo monorepo.

```sh
corepack enable
pnpm install
pnpm --filter @domageddon/site-crawler exec playwright install chromium
pnpm dev
```

Run a single app with a workspace filter, for example:

```sh
pnpm --filter @domageddon/game dev
pnpm --filter @domageddon/level-generator dev
pnpm website:dev
```

## Repository layout

- `apps/game` — PixiJS game and level renderer
- `apps/level-generator` — Nitro API that turns a URL into level data
- `apps/website` — Astro project website
- `packages/dom-extractor` — browser script that extracts structure from a DOM
- `packages/site-crawler` — Playwright crawler that injects the DOM extractor
- `tooling` — shared TypeScript and Vitest configuration

## Checks

```sh
pnpm build
pnpm typecheck
pnpm test
pnpm format
```
