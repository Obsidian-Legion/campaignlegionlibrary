# Gronlid Library — Legion Campaign

The Obsidian Legion campaign to keep Gronlid Public Library open, built with **Unison** and hosted on GitHub Pages.

The supplied eight-second crest video opens on black, then settles into the left-hand logo area of the full-width Gronlid Library campaign header. Obsidian Princess, the hosting sponsor, appears in the center beneath the banner alongside the supplied video. That video starts when the intro finishes, uses inline playback controls, and is muted by default. After the banner has been visible for 25 seconds, the page automatically advances to `sponsors.html`. The countdown starts after the intro, pauses while the tab is hidden, and restarts when the intro is replayed. There is no Next Chapter button. The supplied library artwork is preserved unchanged. Red embers, a restrained light sweep, and glows accompany the footage. Sound is opt-in. Visitors can skip or replay the intro and pause all motion. Reduced-motion preferences show the header immediately and retain the 25-second automatic advance.

The sponsors page, `sponsors.html`, explains that a campaign needs at least three sponsors and recognizes the eight campaign sponsors: Eaglescrest, AviatorsBane, DarkSummit, ZeroHour, Dradean, ObsidianFlame, FiniteDestruction, and GreyWolf. Their original badges are presented in a responsive gallery and can be opened at full size. After 20 visible seconds, the page automatically advances to `campaign.html`.

The explanation page, `campaign.html`, presents seven sections one at a time: Overview, The issue, Why it matters, Children & literacy, Legion support, Take part, and Corporate sponsorship. Reflective gold navigation buttons switch between them, with matching petition and form actions. Section URLs support direct links and browser Back/Forward; the old local-access and request anchors still work. It uses the same black background and animated Legion crest, links to the original openPetition page and 980 CJME's 12 November report, and remains open for reading. The crest pauses while its overview section is hidden. Gold reflections respect the motion toggle and reduced-motion preferences. Campaign sources were reviewed on 17 November 2026; changing signature counts are omitted. Without JavaScript, the complete content and ordinary section links remain available.

The Children & literacy section contains the campaign essay **Every child deserves an open door**, presented in three reader-controlled pages about children's opportunity, equal access, and preserving libraries. Each part has a direct URL and supports browser history and keyboard navigation. The essay links to UNESCO, OECD and IFLA sources beside the claims they support, reviewed on 18 November 2026. All three parts remain readable without JavaScript; there is no timed advance while reading.

The corporate sponsorship section prepares an inquiry to `wapiti@wapitilibrary.ca`, the Wapiti Regional Library regional-office contact listed by [211 Saskatchewan](https://sk.211.ca/services/9734738/agency/wapiti-regional-library/), checked on 17 November 2026. It specifically requests support for the Gronlid branch. Visitors enter their company and contact details, proposed support, optional value, and message. This inquiry form is replaced by a reviewable email with a `mailto:` link, a copy option, and an Edit details button; users send it from their own email app. Switching sections preserves the unsent inquiry. Inquiry data is not transmitted to a server or saved. Sponsorship terms are discussed directly with the library. Without JavaScript, the contact address and instructions remain available.

The separate public pledge page, `pledges.html`, accepts a cash amount in CAD, an in-kind donation description, or both. Submissions are saved in shared D1 storage by the Sites-hosted API and appear publicly immediately. Company name, amount, donation description, public message and date are public; contact name/email remain private to campaign administration. Required checkboxes confirm authority and consent to public display. Notices distinguish self-reported pledges from donations received or arrangements accepted by the library. Cash totals exclude in-kind valuations. Results are paginated, and users receive a private withdrawal link that removes their pledge from public listings and totals. No payments are collected and no email is sent automatically.

The pledge backend source is mirrored in `services/pledges/`; its README covers configuration, tests and publishing. Administration is at https://gronlid-library-pledges.littlecrowsbe.chatgpt.site/manage and requires the owner’s ChatGPT sign-in, authorized by a server-side email check. The existing site remains hosted on GitHub Pages. The public board starts empty; sample pledges are used only in local tests or withdrawn before public launch.

## Development

Install [Unison 1.3.0](https://github.com/unisonweb/unison/releases/tag/release%2F1.3.0) and Node.js 22 or later. No npm dependencies are needed.

```sh
npm run build
npm run check
npm run preview
```

Open http://127.0.0.1:4196. The build installs the pinned Unison base library 7.20.0 into the project's isolated, ignored `.ucm` codebase. It typechecks and compiles the entry points in `scripts/pages.mjs`, then runs the resulting Unison executables to generate `dist/index.html`, `dist/sponsors.html`, `dist/campaign.html`, and `dist/pledges.html`. The pledge service tests use Node 24: `node --test services/pledges/test/*.test.mjs`.

- `src/site.u`: documents, metadata, sponsor roster, semantic page composition, accessible controls, and executable entry points.
- `public/styles.css`: responsive black, silver, and red presentation.
- `public/site.js`: video playback, synchronized visual effects, motion preferences, and graceful fallbacks.
- `public/sponsorship.js`: corporate inquiry validation, email draft generation, and clipboard fallback.
- `public/campaign-panels.js`: section navigation, URL history, keyboard focus management, and cursor-responsive gold reflections. The mirror finish combines bright reflection bands, an animated light sweep, and beveled edges; motion controls and reduced-motion preferences stop the moving effects.
- `public/pledges.js`: public pledge submission, shared board, totals, pagination and private withdrawal flow.
- `services/pledges/`: backend source mirror, schema migrations and persistence/security tests. Backend publication uses Sites; the GitHub workflow publishes the Unison frontend.
- `public/assets/`: user-supplied brand assets. The M4V was losslessly remuxed to MP4; the hosting video is an H.264/AAC web encode. Both posters are frames from their corresponding supplied videos. Original PNG badges are preserved.
- `scripts/`: dependency-free build, output checks, and preview server.

## Publication

Repository: https://github.com/Obsidian-Legion/campaignlegionlibrary

Website: https://obsidian-legion.github.io/campaignlegionlibrary/

The GitHub Actions workflow compiles the Unison program and deploys `dist/` on pushes to `main`. Pages uses the **GitHub Actions** publishing source. The site contains the campaign opening with its hosting sponsor, Legion Sponsors, campaign explanation, and public pledges pages.
