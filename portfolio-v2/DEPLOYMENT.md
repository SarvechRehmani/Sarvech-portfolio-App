# Existing Netlify deployment

Live site: https://sarvech.is-a.dev
Repository: https://github.com/SarvechRehmani/Sarvech-portfolio-App

The original static portfolio remains unchanged at the repository root. The current Angular project is in `portfolio-v2/`; the root `netlify.toml` selects that base directory, Node.js 22 and `dist/portfolio/browser` as the publish directory.

For future releases, edit this Angular project, run `npm ci`, `npm test` and `npm run build`, then commit and push to `main`. The existing Netlify project `sarvech` automatically builds and publishes the update on the same domain.

Only the Angular build output is hosted. Local archives, ZIPs, verification documents and credentials are excluded. The `supabase/` source and tests document the matching integration and are not deployed to Netlify.

The existing Supabase database, Storage and Edge Functions stay in place. Do not rerun migrations just to deploy the frontend. `public/config.json` contains public client settings only; SMTP credentials, signing secrets and service-role keys must stay in Supabase.

Supabase Authentication should use Site URL `https://sarvech.is-a.dev` and the exact redirect `https://sarvech.is-a.dev/admin/login`. Keep public sign-ups disabled. Password login uses the existing owner account and configured MFA.

Verify `/`, `/recruiter`, `/admin/login`, a published project, image/PDF assets and the contact form after deployment. A new live browser visit can count in analytics; localhost and browsers marked as the administrator are intentionally excluded.

Rollback: republish the previous successful Netlify deployment. The original source is also preserved under Git tag `portfolio-v1-before-v2`; do not force-push or erase repository history.
