# Contributing

Thanks for your interest in OmniFocus Task Sync! Bug reports, feature ideas, and pull requests are all welcome.

## Reporting bugs and requesting features

Open an [issue](https://github.com/jimmitchell/tasks-to-omnifocus/issues) and include:

- What you did, what you expected, and what actually happened.
- Obsidian version, OmniFocus version, and OS (macOS / iOS / iPadOS).
- For parsing or send issues, a minimal markdown snippet that reproduces the problem.

For feature requests, describe the workflow you're trying to support — concrete examples help a lot more than abstract asks.

## Development setup

```bash
git clone https://github.com/jimmitchell/tasks-to-omnifocus.git
cd tasks-to-omnifocus
npm install
npm run dev    # esbuild watch mode — rebuilds main.js on save
```

To test your changes against a real vault, symlink the repo into your vault's plugins folder (see [README.md](README.md#sideload-from-source) for the exact command), then enable the plugin in Obsidian.

## Verifying changes

There are no automated tests. Before opening a PR:

1. Run `npm run build` — this does a `tsc -noEmit` typecheck plus the production esbuild bundle. It must succeed cleanly.
2. Manually exercise your change in a real vault against a scratch note. Cover the happy path and at least one edge case (e.g. invalid Dataview field, missing frontmatter, nested checkboxes).
3. If your change affects parsing or URL building, try it in both URL-scheme and OmniAutomation send modes where applicable.

## Pull requests

- Keep each PR focused on one logical change.
- Match the existing code style: TypeScript strict, tabs for indentation, Obsidian APIs imported from `"obsidian"`.
- Keep [src/omnifocus.ts](src/omnifocus.ts) free of Obsidian imports — it's the pure URL-builder layer and is easier to reason about that way.
- If you add a new parser field, extend `TaskFields` in [src/parser.ts](src/parser.ts), add a `case` to `parseTaskLine`'s switch, and push to `skippedFields` for invalid values rather than throwing.
- Update [README.md](README.md) if your change affects user-facing behavior or settings.
- Add a brief entry to [CHANGELOG.md](CHANGELOG.md) under an `## [Unreleased]` heading — the maintainer will roll it into the next release.

## Architecture

The codebase is small and lives in four files under [src/](src/). See [CLAUDE.md](CLAUDE.md) for a short tour of each file's responsibility and the end-to-end send pipeline.

## Releases

Releases are handled by the maintainer. The process is documented in [CLAUDE.md](CLAUDE.md#release).
