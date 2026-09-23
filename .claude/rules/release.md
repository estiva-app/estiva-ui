---
paths:
  - "CHANGELOG.md"
  - "package.json"
  - "package-lock.json"
---

# Changelog, versions and the lockfile

Loads when you read the changelog, `package.json` or the lockfile.

- `CHANGELOG.md` gets an entry per change: the trigger (which app needed it, which finding, which ruling), and for a breaking change **every caller it affects, by file, read from the apps**.
- `0.x` semver: a minor carries a breaking change; a patch never does.
- A lockfile `npm install` rewrote on Windows drops Linux-only optional entries, and CI dies at `npm ci`. Never commit it: restore it, and bump only the package's own entry (the `estiva-ui` skill, Gotcha 22).
