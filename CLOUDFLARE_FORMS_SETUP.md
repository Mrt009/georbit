# Cloudflare form storage and inbox

The site stays static. Pages Functions save submissions in D1 and send notifications to **matrika@georbit.org**. No Node server is needed.

The current demo keeps form collection disabled. Its forms show a simple “Submitted” confirmation in the browser and do not send or store any values. The Pages Function also returns disabled unless the `FORMS_ENABLED` Pages variable is set to `true`.

## D1 setup
1. In Cloudflare **Workers & Pages → D1**, create a database named `georbit-submissions`.
2. Run `migrations/0001_create_form_submissions.sql` in its SQL console.
3. In the Pages project, open **Settings → Functions → D1 database bindings** and bind it as **GEORBIT_DB** for production (and preview if used).

## Private inbox
Add **INBOX_ACCESS_TOKEN** as an encrypted Pages secret. Use a random token of at least 32 characters. Visit `https://your-domain/inbox.html`, enter that token, and review the latest 100 submissions.

## Email notifications
Cloudflare Email Sending requires an onboarded sender domain. Configure these Pages values:
- `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID
- `FORMS_FROM_EMAIL`: a sender address on the onboarded domain
- `CLOUDFLARE_EMAIL_API_TOKEN`: encrypted API token with Email Sending permission

Notifications go only to `matrika@georbit.org`. A notification failure does not discard a D1 submission. On the free plan, verify the destination address with Email Service if required.

## React and Pages deployment
The frontend uses React with Vite. In the Pages project, keep the project root at the workspace root, set the build command to `npm run build`, and use `dist` as the output directory. Pages automatically discovers the root `functions/` directory. Install dependencies locally with `npm install` before building or running the local preview.

When real collection is ready, configure the D1 binding, apply the migration, add the required secrets, and set `FORMS_ENABLED=true` for the intended environment. Until then, leave that variable unset.
