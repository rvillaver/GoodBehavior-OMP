---
name: update-goodbehavior
description: Pull the latest GoodBehavior bundle from its source repo and reconcile it into THIS project's local copy without losing local adaptations. For each tracked file, do a git 3-way merge (base = the commit recorded in the manifest, ours = the local file, theirs = the new upstream) via `git merge-file`. Untouched files fast-forward, adapted files merge, real conflicts get markers. Then rewrite the manifest. Human-in-the-loop on conflicts.
---

Update the local GoodBehavior copy from its source, preserving whatever this project adapted. The install is a copy (not
a symlink) precisely so a project can diverge; this skill is how divergence and upstream improvement are reconciled.
**Never overwrite a locally-adapted file blindly — merge it.**

## Pre-flight
1. Read `<project>/.omp/goodbehavior/manifest.json`. Missing → the project hasn't adopted GoodBehavior; tell the user
   to run `/skill:adopt-goodbehavior` and stop.
2. Resolve `source`. If a local path, confirm it's a git repo. If a git URL, use the cached clone or clone it somewhere
   temporary. The source **must be a committed git repo** — the merge needs commit objects.
3. If `manifest.sourceCommit` is `null` (source had no commits at adopt time): there's no merge base. Offer the user
   either *overwrite-from-upstream* (back up each local file to `*.bak` first, then copy in fresh) or *abort*. Do not
   silently overwrite.
4. `git -C <source> fetch` if it has a remote. Determine the target commit `NEW` (default `git -C <source> rev-parse
   HEAD`; if tracking a remote, `origin/<branch>`). If `NEW == sourceCommit` → **"already up to date"**, stop.
5. If the source working tree has uncommitted changes, note it: base/theirs come from commits, so uncommitted source
   edits won't be included. Suggest committing the source first for a complete update.

## Reconcile — run the script; keep the judgment
The merge mechanics are deterministic and live in the source repo — run them, don't re-improvise them:
```sh
bun <source>/scripts/update.ts --target <project>     # add --dry-run first to preview
```
Per tracked file it does exactly: **theirs** = `NEW:<from>`, **base** = `<sourceCommit>:<from>`, **ours** = the local
file; sha256-match → fast-forward (**updated**); otherwise `git merge-file` 3-way → **merged** or **conflict** (markers
written, manifest sha left stale so a post-resolution re-run reconciles); upstream-removed files are **kept** locally
and reported; locally-missing tracked files are **restored**. It refreshes the manifest (sha256s, `sourceCommit=NEW`,
`updatedAt`) and prints a JSON report; exit 2 means conflicts need the human. It touches only tracked bundle files.

Your judgment on top of the report:
- **Conflicts** — walk the user through each marked file; don't resolve silently.
- **Upstream additions** (files in `NEW` under the bundle paths but absent from the manifest — e.g. a new skill or
  profile): the script doesn't auto-add; decide with the user, then copy + add a manifest entry (or re-run
  `install.ts` with just the additions in the plan).
- **Upstream removals** — the script kept them; deleting is the user's call.
- **Script missing** (an old source): fall back to performing the same steps by hand with `git show` + `git merge-file`,
  preserving the exact statuses above.

**The done-gate needs no wiring in OMP.** The extension lives at `.omp/extensions/done-gate.ts` and OMP auto-discovers
it — there is no hook config to preserve or repair. Update only the extension file itself, and treat local edits to it
as a normal tracked-file merge (conflict markers over silent overwrite).

**`AGENTS.md` principles** are tracked only if `adopt-goodbehavior` recorded them in the manifest. If not (they were
appended as prose into a project-owned AGENTS.md), don't touch AGENTS.md — just report that upstream principles changed
and let the user reconcile the wording.

## Finalize
- For each **updated**/**merged**/**added** file, refresh its `sha256` in the manifest to the new on-disk content.
- For **conflict** files, leave the old `sha256` and the markers in place — the user resolves them; a re-run then sees a
  clean file.
- Set `manifest.sourceCommit = NEW` and update `installedAt`/add `updatedAt` to now.

## Report
A table: **unchanged / updated / merged / conflict / added / removed**, with the old→new commit. If anything is in
**conflict** or **needs manual merge**, say so plainly and point at the files — do NOT report the update as complete.
Conflicts are resolved by the user, then `/skill:update-goodbehavior` (or removing the markers) closes them out.

> Requires `git` and a reachable, committed source repo. Touches only files under the project's `.omp/`. When unsure
> whether a divergence is intentional, prefer a conflict marker over a silent overwrite — same human-in-the-loop
> principle as the done-gate.
