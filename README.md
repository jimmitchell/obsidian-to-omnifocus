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
| Skip OmniFocus Quick Entry | off | When on, tasks are saved straight to their destination via `autosave=true` instead of opening the Quick Entry window. |

## Send modes

Three modes are available in settings. The default (URL scheme) works everywhere with no security prompts but cannot set `plannedDate` or repeating rules. Tasks that need those fields are routed through OmniAutomation per-task; plain tasks always use the URL scheme.

| Mode | Platform | Prompts | `plannedDate` / `repeat` |
|---|---|---|---|
| URL scheme (default) | macOS, iOS, iPadOS | Never | Skipped (Notice lists what was dropped) |
| OmniAutomation | macOS only | Every send of a task with `planned`/`repeat` | Supported |
| OmniFocus plug-in | macOS only | Once per script approval | Supported |

### OmniFocus plug-in mode

The plug-in mode ships a small companion plug-in that lives inside OmniFocus. Approval is keyed to a fixed bootstrap script, so you approve it once and subsequent sends run silently.

**One-time setup:**

1. In OmniFocus → **Settings → General → Automation**, enable external script execution if it isn't already.
2. Copy `omnifocus-plugin/Obsidian to OmniFocus.omnifocusjs` (the entire folder) into your OmniFocus plug-ins folder. The easiest way:
   - In OmniFocus, **Automation → Plug-Ins…** and click **Reveal Plug-Ins Folder** to open it in Finder.
   - Drop the `.omnifocusjs` folder there. (If you use the iCloud-synced folder, the plug-in is available on iOS too — though plug-in send mode itself is macOS-only.)
3. Switch the plugin's **Send mode** setting to **OmniFocus plug-in**.
4. Send a task with a `planned::` or `repeat::` field. OmniFocus will show its security prompt for the bootstrap script. Scroll to the bottom and click **Approve**. Future sends do not prompt.

If you ever change the bootstrap script (plug-in updates), OmniFocus will prompt for re-approval the next time it runs.

## Bad input

If a Dataview field on a task can't be parsed (for example, `[due:: tomorrow]` instead of an ISO date), the field is dropped and the task is sent without it. A Notice lists what was skipped so you can fix it.

## Installation

This plugin is not (yet) in the Obsidian Community Plugins directory, so install it manually using one of the methods below.

### Sideload from source (recommended for now)

This builds the plugin from the latest commit on `main` and symlinks it into your vault, so a `git pull` + `npm run build` is all it takes to update.

```bash
# 1. Clone the repo wherever you keep code
git clone https://github.com/jimmitchell/obsidian-to-omnifocus.git
cd obsidian-to-omnifocus

# 2. Install deps and build
npm install
npm run build

# 3. Symlink into your vault's plugins folder
#    Replace the path with your actual vault path.
ln -s "$(pwd)" "/path/to/YourVault/.obsidian/plugins/obsidian-to-omnifocus"
```

Then in Obsidian:

1. **Settings → Community plugins** — if it says "Community plugins are currently off", click **Turn on community plugins**.
2. Scroll down to **Installed plugins** (below the "Browse" button); the refresh icon there forces a rescan if needed.
3. Toggle **Obsidian to OmniFocus** on.

To update later: `git pull && npm run build`, then in Obsidian disable and re-enable the plugin (or run "Reload app without saving" from the command palette).

### Manual install from a release

Once tagged releases are available on the [Releases](https://github.com/jimmitchell/obsidian-to-omnifocus/releases) page:

1. Download `main.js`, `manifest.json`, and `versions.json` from the release.
2. Create the folder `<vault>/.obsidian/plugins/obsidian-to-omnifocus/` and drop the three files inside.
3. Enable the plugin in Settings → Community plugins → Installed plugins.

### Troubleshooting

- **Plugin doesn't appear in Installed plugins** — confirm `<vault>/.obsidian/plugins/obsidian-to-omnifocus/manifest.json` exists (follow the symlink with `ls -la`), then quit and relaunch Obsidian (⌘Q on macOS — closing the window isn't enough).
- **Toggle is on but the command does nothing** — open **View → Toggle Developer Tools → Console** and look for a load error.
- **Tasks arrive in OmniFocus with `+` instead of spaces** — make sure you're on a build from commit `cbcaea4` or later (`npm run build` after pulling).

## Development

```bash
npm install
npm run dev    # esbuild watch mode — rebuilds on save
npm run build  # type-check + production build
```

If you sideloaded via the symlink above, `npm run dev` will keep `main.js` fresh; just disable + re-enable the plugin in Obsidian to load the new build.

## License

MIT
