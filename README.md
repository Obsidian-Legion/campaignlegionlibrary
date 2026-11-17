# Gronlid Library — Legion Campaign

The opening page for the Obsidian Legion campaign to keep Gronlid Public Library open, built with **Unison** and hosted on GitHub Pages.

The supplied eight-second crest video opens on black, then settles into the left-hand logo area of the full-width Gronlid Library campaign header. The supplied library artwork is preserved unchanged. Red embers, a restrained light sweep, and glows accompany the footage. Sound is opt-in. Visitors can skip or replay the intro and pause all motion. Reduced-motion preferences show the header immediately; the banner also works without JavaScript. A petition link has not been added.

The next chapter, `sponsors.html`, explains that a campaign needs at least three sponsors and recognizes the six sponsors of this campaign: Eaglescrest, AviatorsBane, DarkSummit, ZeroHour, Dradean, and ObsidianFlame. Their original badges are presented in a responsive gallery and can be opened at full size. Both pages have ordinary links and remain readable without JavaScript.

## Development

Install [Unison 1.3.0](https://github.com/unisonweb/unison/releases/tag/release%2F1.3.0) and Node.js 22 or later. No npm dependencies are needed.

```sh
npm run build
npm run check
npm run preview
```

Open http://127.0.0.1:4196. The build installs the pinned Unison base library 7.20.0 into the project's isolated, ignored `.ucm` codebase. It typechecks and compiles the entry points in `scripts/pages.mjs`, then runs the resulting Unison executables to generate `dist/index.html` and `dist/sponsors.html`.

- `src/site.u`: documents, metadata, sponsor roster, semantic page composition, accessible controls, and executable entry points.
- `public/styles.css`: responsive black, silver, and red presentation.
- `public/site.js`: video playback, synchronized visual effects, motion preferences, and graceful fallbacks.
- `public/assets/`: user-supplied brand assets; the M4V was losslessly remuxed to a browser-friendly MP4, and the poster is a frame from the supplied video.
- `scripts/`: dependency-free build, output checks, and preview server.

## Publication

Repository: https://github.com/Obsidian-Legion/campaignlegionlibrary

Website: https://obsidian-legion.github.io/campaignlegionlibrary/

The GitHub Actions workflow compiles the Unison program and deploys `dist/` on pushes to `main`. Pages uses the **GitHub Actions** publishing source. The site currently contains the campaign opening and Legion Sponsors pages.
