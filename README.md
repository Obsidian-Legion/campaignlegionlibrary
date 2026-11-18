# Gronlid Library — Legion Campaign

The Obsidian Legion campaign to keep Gronlid Public Library open, built with **Unison** and hosted on GitHub Pages.

The supplied eight-second crest video opens on black, then settles into the left-hand logo area of the full-width Gronlid Library campaign header. Obsidian Princess, the hosting sponsor, appears in the center beneath the banner alongside the supplied video. That video starts when the intro finishes, uses inline playback controls, and is muted by default. After the banner has been visible for 45 seconds, the page automatically advances to `sponsors.html`: the 24.912-second hosting video plus 20 seconds for loading, rounded up. The countdown starts after the intro, pauses while the tab is hidden, and restarts when the intro is replayed. There is no Next Chapter button. The supplied library artwork is preserved unchanged. Red embers, a restrained light sweep, and glows accompany the footage. Sound is opt-in. Visitors can skip or replay the intro and pause all motion. Reduced-motion preferences show the header immediately and retain the 45-second automatic advance.

The sponsors page, `sponsors.html`, explains that a campaign needs at least three sponsors and recognizes the eight campaign sponsors: Eaglescrest, AviatorsBane, DarkSummit, ZeroHour, Dradean, ObsidianFlame, FiniteDestruction, and GreyWolf. Their original badges are presented in a responsive gallery and can be opened at full size. After 20 visible seconds, the page automatically advances to `campaign.html`.

The explanation page, `campaign.html`, presents six sections one at a time: Overview, The issue, Why it matters, Legion support, Take part, and Corporate sponsorship. Reflective gold navigation buttons switch between them, with matching petition and form actions. Section URLs support direct links and browser Back/Forward; the old local-access and request anchors still work. It uses the same black background and animated Legion crest, links to the original openPetition page and 980 CJME's 12 November report, and remains open for reading. The crest pauses while its overview section is hidden. Gold reflections respect the motion toggle and reduced-motion preferences. Sources were reviewed on 17 November 2026; changing signature counts are omitted. Without JavaScript, the complete content and ordinary section links remain available.

The corporate sponsorship section prepares an inquiry to `wapiti@wapitilibrary.ca`, the Wapiti Regional Library regional-office contact listed by [211 Saskatchewan](https://sk.211.ca/services/9734738/agency/wapiti-regional-library/), checked on 17 November 2026. It specifically requests support for the Gronlid branch. Visitors enter their company and contact details, proposed support, optional value, and message. The form is replaced by a reviewable email with an `mailto:` link, a copy option, and an Edit details button; users send it from their own email app. Switching sections preserves the unsent form. No form data is transmitted to a server or saved by this site. Sponsorship terms are discussed directly with the library. Without JavaScript, the contact address and instructions remain available.

## Development

Install [Unison 1.3.0](https://github.com/unisonweb/unison/releases/tag/release%2F1.3.0) and Node.js 22 or later. No npm dependencies are needed.

```sh
npm run build
npm run check
npm run preview
```

Open http://127.0.0.1:4196. The build installs the pinned Unison base library 7.20.0 into the project's isolated, ignored `.ucm` codebase. It typechecks and compiles the entry points in `scripts/pages.mjs`, then runs the resulting Unison executables to generate `dist/index.html`, `dist/sponsors.html`, and `dist/campaign.html`.

- `src/site.u`: documents, metadata, sponsor roster, semantic page composition, accessible controls, and executable entry points.
- `public/styles.css`: responsive black, silver, and red presentation.
- `public/site.js`: video playback, synchronized visual effects, motion preferences, and graceful fallbacks.
- `public/sponsorship.js`: corporate inquiry validation, email draft generation, and clipboard fallback.
- `public/campaign-panels.js`: section navigation, URL history, and keyboard focus management.
- `public/assets/`: user-supplied brand assets. The M4V was losslessly remuxed to MP4; the hosting video is an H.264/AAC web encode. Both posters are frames from their corresponding supplied videos. Original PNG badges are preserved.
- `scripts/`: dependency-free build, output checks, and preview server.

## Publication

Repository: https://github.com/Obsidian-Legion/campaignlegionlibrary

Website: https://obsidian-legion.github.io/campaignlegionlibrary/

The GitHub Actions workflow compiles the Unison program and deploys `dist/` on pushes to `main`. Pages uses the **GitHub Actions** publishing source. The site contains the campaign opening with its hosting sponsor, Legion Sponsors, and campaign explanation pages.
