# Obsidian to OmniFocus

Send uncompleted tasks from the active Obsidian note to your [OmniFocus](https://www.omnigroup.com/omnifocus) inbox, then mark them complete in Obsidian.

Each task forwarded to OmniFocus includes a link back to its source note in Obsidian, so you can jump from OmniFocus straight to the relevant context.

## Features

- One command — **Send uncompleted tasks to OmniFocus** — scans the active note and forwards every `- [ ]` to OmniFocus.
- Nested checkboxes are folded into the parent task's note body, preserving the structure you wrote in Obsidian.
- Inline Dataview-style fields on the task line are mapped to OmniFocus fields:
  - `[due:: 2026-05-10]` → due date
  - `[defer:: 2026-05-05]` (or `start::` / `scheduled::`) → defer date
  - `[flag:: true]` (or a 🚩 on the line) → flag
  - `[estimate:: 30m]` (or `1h`, `1h30m`, `90`) → time estimate in minutes
- Tag configuration:
  - Set a default list of OmniFocus tags in settings.
  - Override per-note with a YAML frontmatter key (default: `omnifocus_tags`).
  - Optionally forward inline `#tags` written on the task line.
- Destination:
  - Sends to OmniFocus inbox by default.
  - Optional default project in settings; per-note override via frontmatter (default key: `omnifocus_project`).
- After successful send, the original task line is changed from `- [ ]` to `- [x]`.

## Requirements

- OmniFocus 3 or later, installed on the device running Obsidian (uses the `omnifocus://` URL scheme).
- Works on macOS and iOS/iPadOS where OmniFocus is available.

## Usage

1. Open a note that contains some `- [ ]` checkboxes.
2. Run **Send uncompleted tasks to OmniFocus** from the command palette (or bind a hotkey to it).
3. OmniFocus opens and creates one task per top-level uncompleted checkbox; the boxes are marked complete in Obsidian.

### Frontmatter overrides

```yaml
---
omnifocus_tags: [@work, @errand]
omnifocus_project: Apartment Hunt
---
```

### Example task line

```markdown
- [ ] Email landlord about lease renewal [due:: 2026-05-15] [flag:: true] #apartment
```

When sent, this becomes an OmniFocus task with title "Email landlord about lease renewal", a due date of 2026-05-15, the flag set, and (if "Forward inline #tags" is enabled) the tag `apartment` — plus whatever default/frontmatter tags you've configured.

### Nested tasks

```markdown
- [ ] Plan trip
  - [ ] Book flight
  - [ ] Reserve hotel
  Notes: looking at June 12–18
```

Sends a single OmniFocus task **Plan trip** with the nested lines as the OmniFocus note body. All four checkboxes in this block are marked complete in Obsidian after the send.

## Settings

| Setting | Default | Notes |
|---|---|---|
| Default tags | (empty) | Comma-separated. Applied to every task unless frontmatter overrides. |
| Default project | (empty = inbox) | Frontmatter overrides per-note. |
| Tags frontmatter key | `omnifocus_tags` | YAML key on a note that overrides the default tag list. |
| Project frontmatter key | `omnifocus_project` | YAML key on a note that overrides the default project. |
| Forward inline `#tags` | off | When on, `#tags` written on a task line are appended to the OmniFocus tag list. |

## Bad input

If a Dataview field on a task can't be parsed (for example, `[due:: tomorrow]` instead of an ISO date), the field is dropped and the task is sent without it. A Notice lists what was skipped so you can fix it.

## Manual installation

1. Download the latest `main.js`, `manifest.json`, and `styles.css` (if present) from [Releases](https://github.com/jimmitchell/obsidian-to-omnifocus/releases).
2. Place them in `<vault>/.obsidian/plugins/obsidian-to-omnifocus/`.
3. Enable the plugin in Obsidian's Community Plugins settings.

## Development

```bash
npm install
npm run dev    # esbuild watch mode
npm run build  # type-check + production build
```

To test inside a vault, symlink the project directory into `<vault>/.obsidian/plugins/obsidian-to-omnifocus`.

## License

MIT
