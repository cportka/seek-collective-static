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

Posts the same payload to the same Shopify endpoint as the footer signup on
seekcollective.com. Verified byte-for-byte against that page's
server-rendered HTML (from a HAR capture of the live site):

```
POST https://seekcollective.com/contact#footer-newsletter
  form_type      = customer
  utf8           = ✓
  contact[tags]  = newsletter
  contact[email] = <address>
```

With JavaScript disabled the form submits natively and the browser follows
Shopify's redirect — identical to the live site.

`assets/js/newsletter.js` is progressive enhancement: it sends the same body
with `fetch` in `no-cors` mode so the visitor stays on the coming-soon page.
An earlier version targeted a hidden iframe, which cannot work here: the
storefront serves `X-Frame-Options: DENY` and `frame-ancestors 'none'`, so
the response can never render in a frame and the confirmation only ever
appeared after a timeout. `fetch` settles as soon as the response lands
(~65ms in test, against ~6s before).

`URLSearchParams` makes fetch send `application/x-www-form-urlencoded`, which
is CORS-safelisted, so the request goes out with no preflight. The response is
opaque, so the page can confirm the request was delivered but not what Shopify
decided about the address; a network failure is reported and the form stays
retryable.

Note: the Klaviyo forms on the live site (`company_id=Jk4WSL`, lists `WMcyLw`
and `XFCaWi`) are all "Enter to Win" giveaway forms co-branded with other
labels — they are not the newsletter, so this form deliberately does not use
the Klaviyo API.

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
