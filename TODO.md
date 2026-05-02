# TODO

## Ideas / future enhancements

- **Natural-language date parsing for `due::` / `defer::`** — wire in [chrono-node](https://github.com/wanasit/chrono) so values like `today 1pm`, `tomorrow 9am`, `fri 3pm`, `next monday`, `in 3 days` are accepted. Currently only ISO `YYYY-MM-DD` and `YYYY-MM-DD HH:MM` are recognized. Bundle size impact: ~8KB → ~100KB.
- **OmniAutomation send mode** — macOS-only optional setting to send via `omnifocus://x-callback-url/omnijs-run?script=…` instead of `omnifocus:///add`. Would unlock `plannedDate` (OF 4), repeats, and other fields the `add` URL scheme doesn't expose. iOS/iPadOS would remain on basic URL scheme.
- **Inbox zero shortcuts** — Keyboard shortcuts to send active note to OmniFocus and mark all tasks complete in one action. macOS-focused workflow enhancement.
- **Smart templates** — Save task templates with pre-filled tags, projects, estimates, and other metadata. Users could quickly apply templates to new tasks.
- **Preserve task relationships** — When a task has nested subtasks, recreate that hierarchy in OmniFocus instead of flattening all tasks to top-level.
- **Metadata preservation** — Keep custom YAML frontmatter fields intact when syncing tasks. Allows users to store additional metadata without data loss.
- **Share extension (iOS/iPadOS)** — Add "Send to OmniFocus" to iOS share menu when viewing Obsidian notes. Mobile-focused workflow improvement.
