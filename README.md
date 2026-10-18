# Sarvech Portfolio — original and version 2

This repository preserves both versions of the portfolio.

- **Original portfolio:** root `index.html`, `home.html`, `project.html`, CSS, JavaScript and assets remain unchanged.
- **Current Angular + Supabase portfolio:** `portfolio-v2/`.
- **Netlify production:** root `netlify.toml` builds only `portfolio-v2/` and publishes `portfolio-v2/dist/portfolio/browser` on https://sarvech.is-a.dev.

## Develop version 2

```sh
cd portfolio-v2
npm ci
npm start
```

## Build and validate

```sh
cd portfolio-v2
npm test
npm run build
```

Only the public Supabase configuration is included. Gmail SMTP, Auth-hook signing secrets, database passwords, and service-role credentials stay in Supabase and are never frontend build variables.

The existing Supabase project already contains the database, Storage assets and email functions. Do not recreate it or rerun existing migrations merely to deploy this frontend. See `portfolio-v2/DEPLOYMENT.md` for deployment/auth redirect setup.

## Original portfolio and rollback

The original root files remain available in GitHub. The pre-version-2 commit is `44358f4a51e496d80e5e9a3e9482a2feb9faa95b`. A Netlify rollback can republish the preceding successful production deploy without deleting version 2 from this repository. For a source rollback, revert the version-2 deployment commit; do not force-push or erase repository history.

