# Changelog

All notable changes to this project are documented here. This project adheres to [Semantic Versioning](https://semver.org/).

## 0.7.0

- Settings are now declared with Obsidian 1.13's declarative settings API (`getSettingDefinitions()`), so every setting appears in the settings search box. Search aliases were added so terms like "subtasks", "autosave", "x-callback", and "yaml" find the right setting.
- Settings are grouped under four headings: Defaults, Frontmatter keys, Sending, and Support.
- **Skip OmniFocus Quick Entry** is now greyed out on macOS when Send mode is OmniAutomation or Plug-in, where Quick Entry is never opened. It stays available on iOS, which always uses the URL scheme.
- The frontmatter key fields now show an inline error when left empty instead of silently reverting to the default. An empty stored value still falls back to `omnifocus_tags` / `omnifocus_project` when read.
- `minAppVersion` is unchanged at 1.5.0. Obsidian versions below 1.13 keep the previous settings UI, which is now rendered from the same definitions so the two cannot drift.

## 0.6.3

- Release workflow now attests build provenance for `main.js` via `actions/attest-build-provenance`, so the published asset can be cryptographically verified against this repository.
- Replaced the `builtin-modules` dev dependency with the native `node:module` `builtinModules` export in the esbuild config.
- Tightened types in `src/main.ts` to remove unsafe `any` assignments around `loadData()` and frontmatter access.
- Added `"type": "module"` to `package.json` for parity with the official Obsidian sample plugin.

## 0.6.2

- Renamed the plugin id to `omnifocus-task-sync` (user-facing name "OmniFocus Task Sync") to resolve an id collision in the community-plugins directory.
- Tightened README install and troubleshooting sections.

## 0.6.1

- Version bump for the community-plugins directory submission.

## 0.6.0

- Preserve task hierarchy as OmniFocus subtasks (OmniAutomation / Plug-in send modes on macOS).
- Hardened the release workflow for community-plugins submission.
- README prepared for the directory submission.
