# Gronlid pledge service

Shared D1 storage for the Unison-generated GitHub Pages pledge form and public board. The campaign remains at https://obsidian-legion.github.io/campaignlegionlibrary/.

The backend is a small Worker API hosted with Sites at https://gronlid-library-pledges.littlecrowsbe.chatgpt.site. Its source is also mirrored into the campaign GitHub repository under `services/pledges/`. Keep that copy and the Sites source checkout synchronized when changing the service. The `.openai/hosting.json` project ID is permanent; reuse it for future deployments.

## Behaviour

- Anonymous visitors can submit a cash amount in CAD, an in-kind description, or both. Company, amount, donation description, public message and date appear immediately. Contact name/email are private to the administrator.
- Public totals include cash amounts only; in-kind pledges are counted separately. Pledges are self-reported offers, not received or verified donations.
- HMAC form challenges, origin checks, payload limits, a honeypot, and per-IP submission limits protect the public endpoint. IP addresses are hashed with a secret before use in short-lived rate-limit rows. Repeating the same form challenge returns the same receipt rather than inserting a duplicate.
- Each receipt contains a private withdrawal link. Withdrawal removes the record from public results and totals; the private record remains available to the administrator.
- `/manage` requires ChatGPT sign-in and the email configured in `ADMIN_EMAIL`. It shows the latest 200 records and permits removing a public pledge. Any other signed-in visitor is denied. No automatic email is sent.
- No client credentials or service secrets are stored in the GitHub Pages site. Set `PLEDGE_SIGNING_SECRET` and `ADMIN_EMAIL` as secret runtime values through Sites. Changing the signing secret invalidates existing withdrawal links.

## Development and deployment

Node 24 is used for the local SQLite adapter and tests. `npm ci` installs schema-generation tools, `npm run db:generate` creates append-only migrations, `npm test` checks validation, persistence, privacy, withdrawal, authorization and rate limits, and `npm run build` prepares the Worker. `node scripts/preview.mjs` runs a local API on port 4197 with an isolated `.preview/pledges.sqlite` database. The local adapter is never part of the Worker build.

Use the Sites skill's source workflow to push and package the exact source state, then save and deploy that version. Migrations under `drizzle/` are packaged by the Sites helper and applied before publication. Never amend an applied migration. Secrets stay in Sites, not this source tree. Public access is required for anonymous submissions and public board reads; `/manage` retains its own server-side authorization.

The frontend is `src/site.u` plus `public/pledges.js` in the campaign repository. Test against the local API using a browser route override before publishing frontend changes. Do not create sample pledges on the live public board.
