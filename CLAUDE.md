# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project

Obsidian plugin that sends uncompleted markdown tasks from the active note to OmniFocus, then marks them complete in the editor. Tasks support tags, project, due/defer dates, flag, and time estimate via Dataview-style inline fields (`[key:: value]`). Targets OmniFocus 3 and 4 on macOS, iOS, and iPadOS.

## Architecture

Four source files, each with a single responsibility:

- [src/main.ts](src/main.ts) — plugin entry. Registers the `send-uncompleted-tasks-to-omnifocus` command, orchestrates the send pipeline, and rewrites checkboxes via `editor.transaction`.
- [src/parser.ts](src/parser.ts) — extracts checkbox tasks from markdown. Handles indented body blocks, Dataview field extraction (`[due:: …]` etc.), inline `#tag` collection, and the 🚩 flag emoji. Reports invalid field values via `skippedFields`.
- [src/omnifocus.ts](src/omnifocus.ts) — pure URL builders. `buildOmnifocusUrl` produces the `omnifocus:///add?…` x-callback URL; `buildObsidianUrl` produces an `obsidian://open?…` link embedded in task notes.
- [src/settings.ts](src/settings.ts) — `PluginSettings` interface, defaults, and the settings tab UI.

[manifest.json](manifest.json) declares the plugin id (`obsidian-to-omnifocus`), `minAppVersion: 1.5.0`, and `isDesktopOnly: false` (the plugin works on iOS via the URL scheme).

## Send pipeline

`editorCallback` → `parseUncompletedTasks(content)` → resolve tags/project from frontmatter (with defaults fallback) → `buildOmnifocusUrl({ task, tags, project, obsidianUrl, autosave })` per task → `window.open(url)` → `markTasksComplete` rewrites `[ ]` → `[x]` in one editor transaction. Skipped fields are accumulated and shown in a single Notice at the end.

## Build & dev

- `npm run dev` — esbuild watch mode, writes [main.js](main.js) at repo root.
- `npm run build` — runs `tsc -noEmit -skipLibCheck` then a production esbuild bundle. Use this to verify type-checking before committing.

There are no automated tests. Verification is manual: load the plugin into a real Obsidian vault (see README sideload instructions) and exercise the command with a scratch note.

## Conventions

- TypeScript strict; tabs for indentation (match existing files).
- Obsidian APIs imported from `"obsidian"`. Settings persisted via `loadData` / `saveData`.
- Keep `omnifocus.ts` pure (no Obsidian imports) — it's the easy unit to reason about and test by hand.
- New parser fields: extend `TaskFields` in [src/parser.ts](src/parser.ts), add a `case` to `parseTaskLine`'s switch, and push to `skippedFields` for invalid values rather than throwing.
- Settings UI: follow the `new Setting(containerEl).setName(…).setDesc(…).addToggle(…|.addText(…)|.addDropdown(…))` pattern already established in [src/settings.ts](src/settings.ts).

## Pointers

- [TODO.md](TODO.md) — deferred enhancement ideas (not a planning doc; user-curated).
- [README.md](README.md) — user-facing setup, sideload instructions, and field reference.
- [versions.json](versions.json) / [manifest.json](manifest.json) — version metadata for the Obsidian community plugin marketplace; `version-bump.mjs` keeps them in sync.
