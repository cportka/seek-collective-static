# Seek Collective — coming soon

Static, dependency-free landing page built from the
[Figma file](https://www.figma.com/design/ux1PO4TFjKtTo15nsaVMXD/Untitled?node-id=0-1),
deployed to GitHub Pages by GitHub Actions.

```
index.html                     markup for the whole page
assets/css/styles.css          all styling; mobile-first, desktop at >= 900px
assets/js/newsletter.js        progressive enhancement for the signup form
assets/img/hero.jpg            the hero photograph
assets/img/favicon-*.png       favicons (32 / 180 / 512), SEEK mark only
.github/workflows/deploy.yml   build + deploy to GitHub Pages
```

There is one page, not two. The Figma file has a desktop artboard and a mobile
artboard; both are reproduced by the same document, switching layout at a
900px breakpoint:

| | Desktop (>= 900px) | Mobile (< 900px) |
|---|---|---|
| Photo | left column, ~31% of the frame, full height | full width, under the logo |
| Logo | top of the right column | centred at the top |
| Copy + signup | vertically centred, right-aligned column | below the photo |
| Footer | links left, social right, pinned to the bottom | same |

## Design tokens

Read straight out of the Figma nodes rather than sampled from the screenshot:

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#f8f4f1` | page background |
| `--ink` | `#0a0742` | body copy |
| `--navy` | `#0f0c4f` | input rule, social squares |
| type | Inria Serif (Google Fonts) | everything |

## Newsletter signup

Subscribes through **Klaviyo's client subscription endpoint**, which is
CORS-enabled and designed for a static page on a different origin. `company_id`
is Klaviyo's public key, so it is safe in client source.

```
POST https://a.klaviyo.com/client/subscriptions/?company_id=Jk4WSL
revision: 2024-10-15
{ data: { type: "subscription",
          attributes: { profile: { data: { type: "profile",
            attributes: { email, subscriptions: { email: { marketing: { consent: "SUBSCRIBED" }}}}}}},
          relationships: { list: { data: { type: "list", id: "Laz5ER" }}}}}
```

Klaviyo answers `202 Accepted`, so unlike an opaque cross-origin post the page
reports real outcomes: 400 and 429 get their own messages and leave the form
retryable.

### Why not Shopify's `/contact`

The live seekcollective.com footer posts to Shopify, and this page did too at
first. A HAR of a real signup there shows the submission also carries an
`h-captcha-response` token and a session-bound `form_key` alongside the store's
cookies — Shopify's spam protection mints that token on the storefront itself,
so it cannot be produced from this origin, and Shopify varies its response on
`Sec-Fetch-Site`. A cross-origin post from here would be dropped silently with
no way for the page to tell.

The `<form>` still carries Shopify's action and hidden fields, so with
JavaScript off it submits natively and the visitor lands on the real store —
the best available no-JS outcome.

To change the list, edit `LIST_ID` at the top of `assets/js/newsletter.js`.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main` (and on manual
dispatch). It copies `index.html`, `assets/` and `.nojekyll` into `_site/`,
uploads that as a Pages artifact and deploys it with `actions/deploy-pages`.

Repository setting required: **Settings → Pages → Source: GitHub Actions**.

The workflow only fires on `main`, so the site publishes when this branch is
merged.

## Local preview

No build step — serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Notes

- **Footer links** are `mailto:` addresses: Contact -> info@seekcollective.com,
  Consulting -> consulting@seekcollective.com, in that order.
- **Social links** are in the `.social` list at the bottom of `index.html`.
- **The hero photograph** is `assets/img/hero.jpg` (1074 x 1620). It is never
  cropped at any viewport: on desktop the column is sized from the height
  available (`min(46%, availableHeight * ratio)`) so the box equals the
  photograph exactly, and on mobile it is full width at `height: auto`.
  To swap it, replace the file and update `--hero-ratio` in
  `assets/css/styles.css` plus the intrinsic `width`/`height` on the `<img>`
  in `index.html` if the new file has different dimensions.
- **The wordmark** is `assets/img/seek-collective-logo.avif` (180x243, real
  alpha), served through a `<picture>` with `seek-collective-logo.png` as the
  fallback for Safari below 16.4, which cannot decode AVIF. The PNG is
  generated from the AVIF, so colour and alpha match exactly. The logo is
  deliberately **not a link**; size it with the `.logo` width rules.
- **Frame:** desktop is a uniform 10% of the viewport width on all four sides
  (`--frame: 10vw`, so the frame is square in real pixels rather than
  10%-of-width beside 10%-of-height). Mobile keeps a 14px gutter with a
  minimum 50px below the footer.
- **Favicons** are generated from the logo's SEEK mark only. COLLECTIVE is an
  illegible smudge below about 64px and shrinks the letters, so it is cropped
  out; the crop box is `[26, 0, 128, 191]` of the 180x243 source. Sizes 32,
  180 (apple-touch) and 512, all on the `#f8f4f1` page ground.
- **Photo/copy separation:** the desktop row carries `gap: max(40px, 2.6vw)`,
  which guarantees at least 40px between the photograph and the copy column.
  The footer nav is the leftmost element in that column, so this is what keeps
  "Consulting // Contact" clear of the photo at narrow desktop widths.
