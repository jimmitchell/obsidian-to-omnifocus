# TODO

## Ideas / future enhancements

- **Natural-language date parsing for `due::` / `defer::`** — wire in [chrono-node](https://github.com/wanasit/chrono) so values like `today 1pm`, `tomorrow 9am`, `fri 3pm`, `next monday`, `in 3 days` are accepted. Currently only ISO `YYYY-MM-DD` and `YYYY-MM-DD HH:MM` are recognized. Bundle size impact: ~8KB → ~100KB.
- **OmniAutomation send mode** — optional setting to send via `omnifocus://x-callback-url/omnijs-run?script=…` instead of `omnifocus:///add`. Would unlock `plannedDate` (OF 4), repeats, and other fields the `add` URL scheme doesn't expose.
