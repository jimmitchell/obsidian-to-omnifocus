# Changelog

All notable changes to this project are documented here. This project adheres to [Semantic Versioning](https://semver.org/).

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
