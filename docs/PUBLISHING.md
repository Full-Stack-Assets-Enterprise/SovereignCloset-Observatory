# Publishing the Autonomy Observatory

## Publication model

The public site is a safe observation and demonstration layer. It is deliberately separated from the private Node/SQLite control plane.

| Surface | Runtime | Persistence | Authority |
|---|---|---|---|
| Local/private Observatory | Node + SQLite | Local database | Internal policy evolution |
| Published Observatory | Static browser runtime | Visitor-local storage | Demonstration only |

The published build contains no uploaded reference photographs, database files, API keys, credentials, or private source attachments.

## Build and inspect

```bash
npm run verify
npm run build:site
```

The deployable artifact is written to `dist/site` and includes:

- the Autonomy Observatory interface;
- the ten-agent, ten-stage cycle simulation;
- the five immediate modules;
- the approved structured catalog;
- the 200 immutable outfit seed records;
- the six identity-progression records;
- `.nojekyll` and a static-route fallback.

## GitHub Pages deployment

The canonical repository is `https://github.com/Full-Stack-Assets-Enterprise/SovereignCloset`. It is configured locally as `origin`; the remote `main` branch contains its original README commit and remains untouched.

```bash
git push -u origin iteration/fully-autonomous
```

This command requires authenticated GitHub write access. Read-only access is sufficient to verify the remote but cannot publish the branch.

In the GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**. The committed `Publish Autonomy Observatory` workflow will verify and deploy the branch. Its `github-pages` environment records the final public URL.

## Required repository settings

- Actions must be allowed to run official GitHub actions.
- Pages source must be GitHub Actions.
- The workflow requires `pages: write` and `id-token: write`; both are declared in the workflow.
- Branch protection may require the workflow checks before further updates are accepted.

## Optional custom domain

After the Pages deployment is healthy, configure the desired domain through the repository Pages settings and DNS provider. Add a `CNAME` file to `public/` only after the canonical domain is selected; the static build will copy it automatically.

## Rollback

GitHub Pages deployments are derived from immutable Git commits. Roll back by reverting the publication commit on `iteration/fully-autonomous` and pushing the revert. Browser-local demo cycles do not affect the repository or private control plane.
