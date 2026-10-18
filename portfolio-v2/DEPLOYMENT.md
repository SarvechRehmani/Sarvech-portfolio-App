# Deploy Angular directly to Netlify + Supabase

No Spring Boot server, Render service, Docker deployment or API proxy is required.

1. Push this frontend folder to its own GitHub repository. `.env`, `.local`, dependencies and build output are ignored. Only public Supabase settings belong in the frontend.
2. In Netlify, import the GitHub repository. Build command: `npm ci && npm run build`. Publish directory: `dist/portfolio/browser`. Set Node.js version to 22 or newer.
3. Optionally set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in Netlify; otherwise the connected project's public settings in `public/config.json` are used. Remove old `API_URL` and `API_PROXY` settings. Never supply `SUPABASE_SECRET_KEY`, a service-role key, JWT signing secret or database password.
4. Deploy. `netlify.toml` configures SPA routes, admin noindex headers and the sharing metadata edge function. The edge function reads published Supabase data with the same public key; it does not handle CRUD/auth/uploads.
5. In Supabase Authentication URL configuration, set the Site URL to your Netlify/custom domain. Keep public sign-ups disabled. Ensure the owner's Auth user exists in `portfolio_api.admins`. Password login does not require an OAuth redirect.
6. Check home/projects/blog sharing metadata, `/admin` login, save → draft preview → publish, image upload, both resume modes, and contact inbox. Test analytics from a fresh non-owner browser on the deployed domain; localhost and the admin browser intentionally do not count.

The existing Supabase database and Storage files are already configured. No additional database import is needed for this connected project. If you later create a different Supabase project, follow the migration/admin instructions in README and move the content and Storage objects deliberately.

Admin authentication now uses Supabase's access/refresh JWT session lifecycle. A previous Spring login is not a Supabase session; sign in again once after this migration. Signing out uses Supabase Auth.

Visitor-location analytics uses the JWT-protected portfolio-mail/analytics Edge route. Keep its JWT verification enabled. public/config.json includes the connected project''s public anon gateway key. For another project, set SUPABASE_FUNCTIONS_ANON_KEY in Netlify to its PUBLIC anon JWT; never a service-role key. See docs/ANNOTATION-UPDATE.md for retention and verification details.

