# Simply Lex Marie — Website

My personal creator site. Live at **https://simplylexmarie.github.io**

When I (or Claude) save a change, it gets pushed to GitHub and the live site
updates automatically within a minute — same link every time.

---

## Folder guide (where everything lives)

```
index.html ............... The homepage (the main page people land on)
README.md ................ This guide

pages/ ................... The other pages people can click into
  try-ons.html ........... "Latest Try-Ons"
  swimsuits.html ......... "Swimsuit Reviews"
  dresses.html ........... "Dresses & Going Out"
  favorites.html ......... "Favorite Finds"

assets/images/ ........... All photos the live site uses
  main-photo/ ............ My big polaroid photo (alexia-main.jpg)
  film-photos/ ........... The rotating film-strip photos (film-01.jpg, film-02.jpg ...)
                           ADD MORE HERE to grow the strip, then ask Claude to wire them in.
  video-covers/ .......... Thumbnail images for the TikTok videos (try-on-01.jpg ...)
  accent-photos/ ......... (empty) extra decorative photos for later
  graphics/ .............. (empty) future logos / graphic files

screenshots/ ............. Design inspiration screenshots  (saved on my computer only)
originals/ ............... Unedited source files & old drafts (saved on my computer only)
  main-photo/ ............ Original HEIC of my main photo
  film-photos/ ........... Original iPhone photos behind the film strip
  old-design-drafts/ ..... Earlier design versions, kept just in case
```

> **Note:** `screenshots/` and `originals/` stay on your computer and are NOT
> published to the live website (so private/raw files never go public).

---

## How to change common things (just ask Claude)

- **Swap my main photo:** put the new photo in `assets/images/main-photo/` and say
  "use this as my main photo."
- **Add film-strip photos:** drop them in `assets/images/film-photos/` and say
  "add these to the film strip."
- **Add videos to a category page:** paste the TikTok links and say which page.
- **Add my Amazon link:** the buttons currently say `AMAZON_STOREFRONT_URL` as a
  placeholder — give Claude the real storefront link and it gets filled in everywhere.
- **Change wording or colors:** just describe what you want.

The look of each page (colors, fonts, layout) is written inside the `.html` files
themselves, so there's no separate styles folder to hunt through.
