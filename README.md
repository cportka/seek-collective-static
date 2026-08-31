# Seek Collective — coming soon

Static, dependency-free landing page built from the
[Figma file](https://www.figma.com/design/ux1PO4TFjKtTo15nsaVMXD/Untitled?node-id=0-1),
deployed to GitHub Pages by GitHub Actions.

```
index.html                     markup for the whole page
assets/css/styles.css          all styling; mobile-first, desktop at >= 900px
assets/js/newsletter.js        progressive enhancement for the signup form
assets/img/hero.jpg            the hero photograph
assets/img/favicon.svg         SEEK mark as a favicon
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

The form posts the same payload to the same Shopify endpoint as the footer
signup on seekcollective.com:

```
POST https://seekcollective.com/contact#footer-newsletter
  form_type      = customer
  utf8           = ✓
  contact[tags]  = newsletter
  contact[email] = <address>
```

With JavaScript disabled the form submits normally and the browser follows
Shopify's redirect — identical to the live site. `assets/js/newsletter.js`
retargets that same submit at a hidden iframe so a visitor stays on the
coming-soon page and gets an inline confirmation instead. The response is
cross-origin, so the page cannot read whether Shopify accepted the address; it
confirms once the request has been dispatched, as any cross-origin form post
would.

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

- **`Consulting` and `Contact`** point at `https://seekcollective.com/pages/consulting`
  and `https://seekcollective.com/pages/contact`. Those are assumed Shopify page
  paths; correct them in `index.html` if the live URLs differ.
- **Social links** are in the `.social` list at the bottom of `index.html`.
- **The hero photograph at `assets/img/hero.jpg` is a placeholder.** It is a
  labelled grey JPEG at the correct 1056 x 1568 so the layout and the deploy
  hold. Overwrite that one file with the real photograph — nothing else needs
  to change. It is `object-fit: cover` in both layouts, so any portrait crop
  works, and the intrinsic `width`/`height` on the `<img>` in `index.html`
  should be updated to match if the replacement is a different size.
