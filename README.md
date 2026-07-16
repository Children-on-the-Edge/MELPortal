# M&E Partner Portal — Children on the Edge

A simple, branded portal where external partners can find the forms, links, and
tools they need for monitoring and evaluation. Resources are shown as a
scrollable, filterable tile grid (by Location, Project/SDG, Impact Area
Framework, and Year). Your MEL team can add, edit, or remove resources through
a password-protected admin page, no code required day-to-day.

## How it works (in plain terms)

- The site itself is just static files (HTML/CSS/JS) — free to host.
- The list of resources lives in one file: `data/resources.json`.
- When someone on the MEL team adds/edits/deletes a resource through the admin
  page, a small server-side function checks the admin password, then commits
  the updated `resources.json` straight into this GitHub repo. Netlify then
  automatically redeploys the site with the change — usually live within a
  minute.
- There's an optional second password (`VIEWER_PASSWORD`) that, if set, gates
  the whole site so only partners with the password can view it. Leave it
  blank and the site is open to anyone with the link.

## One-time setup

### 1. Create the GitHub repository

1. On GitHub, create a new **private** repository (e.g. `me-partner-portal`).
2. Upload all the files in this folder to that repo (keep the folder
   structure exactly as-is).

### 2. Create a GitHub token (lets the admin page save changes)

1. In GitHub: **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token.**
2. Give it access to only this one repository, with **Contents:
   Read and write** permission.
3. Copy the token — you'll paste it into Netlify in step 4.

### 3. Create a Netlify site from the repo

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import
   an existing project** → connect your GitHub account → pick this repo.
2. Build settings can be left as detected (no build command needed; publish
   directory is the repo root).
3. Deploy the site.

### 4. Set environment variables in Netlify

In Netlify: **Site configuration → Environment variables**, add:

| Variable | Value | Required? |
|---|---|---|
| `ADMIN_PASSWORD` | A password for your MEL team to add/edit resources | Yes |
| `VIEWER_PASSWORD` | A password partners need to view the site | Optional — leave unset for a public site |
| `GITHUB_TOKEN` | The token from step 2 | Yes |
| `GITHUB_REPO` | `your-github-username/me-partner-portal` | Yes |
| `GITHUB_BRANCH` | `main` (or whatever your default branch is called) | Optional, defaults to `main` |

After adding these, trigger a redeploy (Netlify → Deploys → Trigger deploy) so
the functions pick up the new variables.

### 5. Point your domain at it (optional)

In Netlify: **Domain management → Add a custom domain**, e.g.
`me-portal.childrenontheedge.org`, and follow the DNS instructions Netlify
gives you.

## Day-to-day use for the MEL team

- **View the portal:** open the site URL, filter tiles, click through to any
  form or resource.
- **Add a resource:** go to `/admin.html`, enter the admin password, fill in
  the form (title, description, link, an icon, and the relevant filter tags),
  and click **Save resource**.
- **Edit or delete a resource:** on the same admin page, use the **Edit** or
  **Delete** button next to any resource in the list at the bottom.
- **Add a custom logo/image instead of a preset icon:** upload the image file
  yourself into the repo (e.g. under a new `assets/logos/` folder), then in
  the admin form's "custom image" field enter its path, e.g.
  `assets/logos/partner-logo.png`.

## Notes on security

The password checks here are a light, convenience-level gate suited to an
internal/partner-facing tool — not bank-grade authentication. They're
re-checked on the server for every save/delete, so the admin password can't
be bypassed just by editing the page, but there's no per-user login or audit
trail. If you need stronger access control later (e.g. individual named
logins), that's a reasonable next upgrade and worth flagging if the number of
admins grows.

## Local preview

You can open `index.html` directly in a browser to preview the layout, though
the admin save/delete features and the viewer gate only work once deployed on
Netlify (they depend on the serverless functions and environment variables
above).
