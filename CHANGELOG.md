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

## 2026-11-14 (populate pass)
Every project now has media except EchoForge and st-tg-bridge (nothing visual exists to show).
- **Playable:** The Appraiser (embedded in the detail view, `play/appraiser.html`, copied from Gallery-puzzle; needs Google Fonts online). Rogue Run was already an itch.io embed.
- **Video clips (ffmpeg, silent, <1MB each):** Wuxia trailer, TRLP demo, Football Kaleidoscope demo.
- **Screenshots (captured from the real local apps):** Ture Aid (empty state, no client data), Broadcast studio (chat history removed before capture), Huddle web preview (demo data), Spotting Sheet (also openable as `play/spotting-sheet.html`), Alignment Vote grid, Travel-CV and ELEGY card sheet, Scouting lineup boards, Rogue Run menu, TETR.IO bot calibration overlay, CAPTCHA sample.
- Strip grew from 8 to 14 plates.
- Deliberately not used: raw match footage from Brighton-Bilibili (broadcast rights).
- Raw captures live in git-ignored `_raw/`.

## 2026-11-14 (fixes)
- **TRLP removed.** The code is `tylo-git/auto-trip-planner-xiaohongshu` (not in Nano-233, local copy has no git history), so it is not Harbour's work. Entry, strip plate and media deleted.
- **Cursor:** the system cursor is hidden on the whole page (fine pointers only, not reduced-motion) and the custom dot is the only cursor. It swells over links/rows and more over the strip. Raised above modals so it never disappears.
- **Take a look:** the wheel scrolls the strip sideways again; at either end it hands the wheel back to the page, so leaving the strip never gets stuck.

## 2026-11-14 (dynamic pass)
- BioCore ARG live link -> `https://biocore-inky.vercel.app/leak`.
- Research (Awwwards, Hoverstate): the strongest portfolios win on micro-interactions (Rauno, Emil) or being playable (Bruno Simon). Added, with no libraries:
  - hero name letters shy away from the cursor
  - index titles scramble then resolve on hover
  - strip skews with its scroll/drag velocity
  - live Singapore clock in the hero facts
- **Cursor jitter fixed:** the dot used to ride the same lagging container as the preview, so it trailed the pointer and snapped when the preview flipped at a screen edge. The dot now sits exactly on the pointer; only the preview eases.

## exp-wheel (branch, experiment; branched from main, replaces the split-stage idea)
The Index list is now a **3D wheel**: a CSS-3D cylinder of project cards that the page scroll spins (section pins for ~0.4 screen per project). Front card is bright and, if it has a video, plays it; the title, tagline and Open button sit below. Click a side card to spin to it, click the front card to open it. Filters still work (the wheel rebuilds). No libraries, plain CSS 3D transforms. Page scrolling is never trapped: it is ordinary scrolling mapped to rotation.
Revert: `git switch main`. The earlier split idea lives on `exp-stage`.

## exp-wheel, second pass
- The detail panel now **grows out of the front wheel card** (Web Animations API, from the card's rect), instead of fading in.
- The hero name **recedes** (drifts down, shrinks, fades) as you scroll toward the wheel.
- **Arrow keys** step the wheel one project at a time while it is on screen.
- Dev gotcha: the browser caches `app.js`; hard reload after edits.

## exp-wheel, third pass (current layout)
- **Index is the plain table again** (rows, filters, hover preview, scramble), same as `main`.
- **The 3D wheel now lives in "Take a look"** and replaces the sideways strip: it spins from page scroll, the front card is pushed toward you (about a third bigger), neighbours sit almost touching so there is far less empty space, and title + caption stay below. Video plates play when in front. Click a side card to spin to it; arrow keys step.
- Removed: the wheel-over-index, detail zoom-from-card, strip skew/drag code.
