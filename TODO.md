# TODO

## Ideas / future enhancements

- [x] **Natural-language date parsing for `due::` / `defer::`** — wire in [chrono-node](https://github.com/wanasit/chrono) so values like `today 1pm`, `tomorrow 9am`, `fri 3pm`, `next monday`, `in 3 days` are accepted. Currently only ISO `YYYY-MM-DD` and `YYYY-MM-DD HH:MM` are recognized. Bundle size impact: ~8KB → ~100KB.
- [x] **OmniAutomation send mode** — macOS-only optional setting to send via `omnifocus://x-callback-url/omnijs-run?script=…` instead of `omnifocus:///add`. Would unlock `plannedDate` (OF 4), repeats, and other fields the `add` URL scheme doesn't expose. iOS/iPadOS would remain on basic URL scheme.
- [x] **Inbox zero shortcuts** — Added "Send task at cursor", "Send selected tasks", and "Mark all tasks complete (without sending)" commands alongside the existing send-all command. Each is individually bindable via Obsidian's hotkey settings.
- [ ] **Smart templates** — Save task templates with pre-filled tags, projects, estimates, and other metadata. Users could quickly apply templates to new tasks.
- [x] **Preserve task relationships** — Added a "Preserve task hierarchy" setting; when on, nested checkboxes become subtasks in OmniFocus (via OmniAutomation or Plug-in send mode on macOS). URL scheme falls back to today's body-folding behavior with a Notice.
- [ ] **Metadata preservation** — Keep custom YAML frontmatter fields intact when syncing tasks. Allows users to store additional metadata without data loss.
- [x] ~~**Share extension (iOS/iPadOS)**~~ — Won't do. A "Send to OmniFocus" entry in the iOS share sheet would require a native iOS app target (Swift + Xcode + App Store distribution), which is out of scope for an Obsidian community plugin. Users wanting share-sheet capture should use OmniFocus's built-in Share extension or an Apple Shortcut.
