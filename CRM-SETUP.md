# Render callback form and private CRM

Public website: https://render-studio-creates.netlify.app/
Private CRM: https://render-studio-creates.netlify.app/admin/
The existing GitHub Pages callback form also submits to this backend.

The customer form collects name, brand, phone/email, preferred contact method, selected services, and project brief. A contact consent checkbox is required for submitting a callback request. Continuing to WhatsApp prepares the brief for the visitor to review and send. It does not submit a CRM request.

New leads start as Unlisted. The CRM supports Hot, Cold, and Unlisted status, searchable requests, pagination, internal notes, and safe concurrent updates. Both interfaces support English and Georgian. No customer information is embedded in public files.

## Backend and access

Netlify Functions use Netlify Database with parameterized queries. Schema is deployed from `netlify/database/migrations`; never edit an applied migration. Do not enable direct production writes for personal access tokens.

Configure these two variables as secrets on Netlify, with values only in the production context. The Free plan uses the supported secret scopes Builds, Functions, and Runtime; Post processing is excluded. Scope customization to Functions alone requires a paid plan. The build does not read or expose these secrets:

- `RENDER_ADMIN_PASSWORD_HASH`: a `scrypt$<base64 salt>$<base64 64-byte hash>` string. Derive with Node scrypt using N=32768, r=8, p=1, maxmem=67108864. Use a 16-byte random salt. Never put the raw password in source, builds, or GitHub.
- `RENDER_SESSION_SECRET`: at least 32 characters of cryptographic randomness. Rotating it invalidates all existing sessions.

The admin password is verified only on the server. Session cookies are HttpOnly, Secure, SameSite=Strict and expire after eight hours. Logout revokes the session. Requests are rate limited; changes require same-origin requests and a session CSRF token. Notes are rendered as text, never HTML. Static admin UI may be publicly downloadable; all lead data and mutations require server authentication.

The Netlify publish directory is `dist`; the build allowlists the public assets and admin UI, excluding server code, migrations, tests, deployment state, and secrets. `.netlify` and `dist` are ignored in Git.

## Development and deployment

`npm ci`, `npm test`, `npm run build`.

Tests use a disposable local Postgres engine and a dummy test password, never the live database. For a local Netlify environment, use `netlify dev` and apply migrations locally with `netlify database migrations apply`.

Netlify is connected to `Vornato/Render` with continuous deployment from `main`, build command `npm run build`, publish directory `dist`, and the functions directory in `netlify.toml`. Production is public; previews require Netlify team login. Preview contexts have no production admin secrets. Add separate test secrets if previews need authenticated CRM testing.

The project uses the existing Netlify Free plan, including its usage limits. No paid plan or add-on is required for this implementation.

Existing website contact links and all portfolio films are preserved. No automatic customer messages or email notifications are configured.
