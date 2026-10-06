# Anant Naad

**Divine Sounds, Anytime**

A free, static, mobile-first devotional listening website.

## What is included

- 24x7 time-based devotional experience
- Morning / Afternoon / Evening / Night themes
- YouTube IFrame Player API playback
- Public YouTube playlist support
- Video-ID queue fallback support
- Visual devotional ambience
- Daily spiritual quote
- 33-form Vedic pantheon presentation
- UPI QR donation support
- Native share API + clipboard fallback
- PWA manifest + offline app shell
- Responsive layout for mobile / tablet / desktop
- No login and no backend required
- "Created with Devotion ❤️ by Roshika"

## Run locally

Because this is a static site, a local web server is recommended.

### Python

```bash
python -m http.server 8080
```

Then open:

http://localhost:8080

Do not open `index.html` directly via `file://` if you want the service worker and PWA features.

## Change the music

Edit:

`config.js`

For each session you can use:

```js
playlistId: "YOUR_YOUTUBE_PLAYLIST_ID"
```

or:

```js
videoIds: ["VIDEO_ID_1", "VIDEO_ID_2"]
```

A playlist ID is preferred when you have curated public YouTube playlists.

## Important YouTube playback note

The website uses YouTube's official embedded player/API. It does not download, extract or rebroadcast YouTube music as an independent audio stream.

The first Play click is intentional because modern browsers restrict autoplay without user interaction.

Some YouTube videos may be unavailable for embedded playback. The player shows an error rather than bypassing the restriction.

## Free deployment

### GitHub Pages

1. Create a public GitHub repository.
2. Upload this folder.
3. In GitHub: Settings → Pages.
4. Select the main branch and `/root`.
5. Save and open the generated `github.io` address.

### Cloudflare Pages

1. Create a GitHub repository with these files.
2. Connect the repository to Cloudflare Pages.
3. For a static site, there is no build command.
4. Publish the site.

## Donation

The QR code in `assets/upi-qr.png` is generated for:

`yadavroshan817-1@okhdfcbank`

Replace the QR and UPI ID in `config.js` later if needed.

## Music sources used for the initial demo

The initial configuration includes public YouTube content discovered during development for:
- Hanuman Chalisa
- Ganesh bhajans
- Shiva bhajans
- Krishna devotional content
- devotional lofi

Replace these with your own curated public YouTube playlists for long-term control.

## Accuracy note about "33 gods"

The site presents one traditional Vedic enumeration: 8 Vasus, 11 Rudras, 12 Adityas, plus Indra and Prajapati. Different Hindu texts and traditions enumerate these groupings differently, so the site explicitly labels the presentation as one traditional enumeration.

## Next upgrade

For a more authentic radio station experience, create four public YouTube playlists on a dedicated Anant Naad channel:

- Anant Naad — Morning
- Anant Naad — Afternoon
- Anant Naad — Evening Aarti
- Anant Naad — Night Lofi

Then paste their playlist IDs into `config.js`.


## iPhone / iPad installation

On iPhone or iPad Safari, use **Share → Add to Home Screen**. The install button in the site shows these instructions because iOS Safari does not use the Chromium `beforeinstallprompt` flow.


## IMPORTANT: Updating an existing GitHub Pages deployment

If you are replacing an earlier Anant Naad version, upload the updated files from this package and hard-refresh the site once.

The v3 build includes cache-busting and a YouTube direct-embed fallback so an old service-worker cache is much less likely to hide the new site.

On desktop:
- Windows: Ctrl + Shift + R
- Mac: Cmd + Shift + R

On iPhone/iPad Safari:
Settings → Safari → Advanced → Website Data → remove the Anant Naad site entry, then reopen it.
