# SMC Commercial Properties website (V9)

Public site for McHenry Village (Modesto, CA), Northgate Plaza (Carson City, NV), and
Lakeside Shopping Center (Burbank, CA). The layout follows federalrealty.com's structure
(portfolio home, leasing hub, a page per property, news, "Stay in the know" signup) in the
SAMI brand system: navy `#051D35`, gold `#E69F49`, body text `#333333`, Geist + Playfair
Display (IvyPresto Headline is used automatically if SAMI's Adobe Fonts kit is added).

## Pages

| Page | File |
|---|---|
| Home | `index.html` |
| Leasing (availability + inquiry form) | `leasing.html` |
| Property pages | `mchenry-village.html`, `northgate-plaza.html`, `lakeside-shopping-center.html` |
| Directory (all tenants, searchable) | `directory.html` |
| News | `news.html` |
| About | `about.html` |
| Contact (+ accessibility statement) | `contact.html` |

## Editing content

All content lives in `/data`. Edit a file, commit, and Netlify rebuilds the site.

- `data/properties.js` – property facts, descriptions, hours, **available space**
- `data/tenants.js` – tenant directory
- `data/news.js` – news items
- `data/site.js` – brand name, phone numbers, emails
- `data/photos.js` – licensed stock photos used until real property photos are added

Photos go in `src/img/` and brochures in `src/docs/` (see the README in each folder).
A real photo in `src/img/` always replaces the stock photo for that slot.

### Stock photos

Stock photos come from Unsplash (free for commercial use under the Unsplash License).
The build downloads them and serves them from this site, tags each one "Representative
photo", and lists credits on `/photo-credits.html`. Only add photos whose license allows
commercial use, and record the photographer, page, and license in `data/photos.js`.

**This repository is public.** Only add information that is meant for the public
website. No rents, lease terms, NOI, tenant contacts, or internal reports.

## Preview vs. live

On preview links (deploy previews, branch deploys, localhost) the site shows:
- the file name and size for each empty photo slot, and
- amber **Verify** chips next to content that still needs confirmation.

Neither appears on the production site. The build log also prints the list of items flagged
for verification.

## Forms

The contact, leasing inquiry, and "Stay in the know" forms use Netlify Forms. They need
**Forms → Enable form detection** turned on in Netlify (then redeploy), and a notification
email set up under Forms → Submission notifications. Submissions are stored by Netlify.
If a form can't be sent, visitors see an email address to use instead.

## Build

```bash
npm install        # installs the self-hosted font files
npm run build      # writes the site to dist/
npm run serve      # build + preview at http://localhost:8080
```

Netlify settings come from `netlify.toml` (build `node build.js`, publish `dist`).
The previous single-page version (V8) is in the git history on `main`.
