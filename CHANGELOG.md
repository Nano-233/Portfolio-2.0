# Changelog / debugging log

## 2026-11-14
- Evidence section renamed **Take a look**. It is now a plain native horizontal strip (drag, arrows, scrollbar thumb). The old sticky scroll-jacking is removed, so vertical wheel over the strip scrolls the page normally.
- Hero name: "Wang" descender (g) was clipped by the masked line reveal; added bottom padding.
- Palette dimmed: ink `#ece7db` -> `#d6d0c2`, grain overlay 0.32 -> 0.12, project row hover is a dark lift (not a bone-white fill), modal backdrops are near-black instead of an ink wash. Palette stays warm charcoal; no blue/violet.
- Cursor hover previews on index rows confirmed (video/image snapshot follows the pointer).
- Staggered plates in the strip for a bit more character.
- Git: repo already initialised; progress committed.
- Gotcha: edit files as UTF-8 (PowerShell 5 `Set-Content` mangles non-ASCII).

Open: video plates show a blank frame until hovered/loaded.
