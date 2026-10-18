# Angular portfolio

Production: https://sarvech.is-a.dev

Node.js 22 is required. Run `npm ci`, `npm start`, `npm test`, or `npm run build` from this folder.

The app connects directly to the existing Supabase project. `public/config.json` holds public client configuration only. Server credentials and mail settings remain in Supabase; no separate Spring Boot backend is deployed.

`src/` and `public/` contain the Angular application. `scripts/` prepares PDF assets and the production output. `netlify/` provides sharing metadata. `tests/` and `supabase/` retain the integration tests and matching service source; the existing database and functions do not need to be recreated to deploy the frontend.

Only `dist/portfolio/browser` is published by the root Netlify configuration. Local backups, verification documents, screenshots, archives, dependencies and credentials are excluded from Git.

The original portfolio remains unchanged at the repository root. See the root README for preservation and rollback information, and DEPLOYMENT.md for production setup.
