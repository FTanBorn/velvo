<p align="center"><img src="logo/png/icon-512.png" width="128" alt="Velvo logo"></p>

<h1 align="center">Velvo</h1>

<p align="center"><b>A free, open-source IPTV player for LG webOS TVs that lets you choose the subtitle and audio language.</b></p>

<p align="center">English · <a href="README.tr.md">Türkçe</a></p>

---

## Why Velvo?

Many IPTV players on LG TVs can't switch **embedded subtitle and audio tracks**. If your movie has ten subtitle languages, you're stuck with whatever plays first. Velvo was built to fix that. It reads the tracks inside the file, shows which languages are available before you press play, and lets you switch them from the player.

Velvo is free. It has no ads, no accounts and no tracking.

## Features

- **Your own playlist**: Xtream Codes API (server, username, password) or an M3U/M3U8 playlist URL
- **Subtitles and audio**:
  - Switch embedded subtitle and audio tracks while playing
  - Language badges on the detail page (for MKV files they're detected before playback)
  - Subtitle style: size, color and position
  - The app remembers your audio and subtitle choice for each series, so the next episode starts the same way
- **Built for the TV**:
  - Netflix-style home screen with dynamic rows
  - Movies, series with seasons and episodes, live TV, search, My List and "continue watching"
  - Works with both the Magic Remote and the standard remote
- **Profiles**: each person has their own language preferences, watch progress and list
- **Interface languages**: English and Turkish. The app picks one from your TV's language automatically. [Add yours!](#translations)

## Disclaimer

**Velvo is only a media player. It does not include, provide, sell or link to any channels, movies, series or playlists.**

You need your own playlist from a provider you are legally entitled to use. The Velvo project does not endorse piracy. Watching content without the rights holder's permission may be illegal where you live, and you are responsible for what you play. The bundled [demo playlist](demo/velvo-demo.m3u) contains only openly licensed films and public test streams.

## Try it with the demo playlist

On the login screen, choose **M3U** and enter:

```
https://raw.githubusercontent.com/FTanBorn/velvo/main/demo/velvo-demo.m3u
```

*Sintel* in the demo list has one audio track and ten embedded subtitle languages, so you can test subtitle switching right away.

## Install on your TV (Developer Mode)

Velvo isn't in the LG Content Store yet. Until it is, you can install it with LG's free developer tools:

1. Create a free account at [webostv.developer.lge.com](https://webostv.developer.lge.com).
2. On the TV, install **Developer Mode** from the LG Content Store. Sign in with that account, turn on *Dev Mode Status* and restart the TV.
3. Open Developer Mode again and turn on *Key Server*.
4. On your computer, run:

```bash
npm install -g @webos-tools/cli
```

```bash
ares-setup-device
```

Add the TV with its IP address, port `9922` and user `prisoner`.

```bash
ares-novacom --device tv --getkey
```

Enter the passphrase shown in the Developer Mode app.

```bash
ares-package app -o dist
```

```bash
ares-install --device tv dist/*.ipk
```

The Developer Mode session expires after about 50 hours. Use *Extend* in the Developer Mode app to keep the app installed.

## Compatibility

- Tested on an LG 55SK7900 (2018 model) with a Chrome 38 web engine. Newer webOS TVs should also work.
- **Audio switching** uses the standard HTML5 `audioTracks` API.
- **Embedded subtitles** use the webOS media service (`luna://com.webos.media`), the same approach other open-source webOS players take.
  - This service isn't officially documented.
  - If a TV doesn't support it, Velvo hides the option and says so instead of failing silently.

## Development

- Everything runs from `app/`. It's plain HTML, CSS and JavaScript with no build step and no framework.
- **The code must stay ES5.** Older webOS TVs run Chrome 38, so these won't work there:
  - JavaScript: `let`/`const`, arrow functions, template strings, `Object.assign`, `Array.prototype.find`, `includes`, `startsWith`, `closest`
  - CSS: variables, grid, flex `gap`
- For a quick check, open `app/index.html` in a desktop browser. It falls back gracefully when webOS services aren't there.
- For on-TV debugging, run:

```bash
ares-inspect --device tv --app com.furkan.iptvtest --open
```

```
app/
  index.html        entry point
  appinfo.json      webOS app manifest
  css/app.css       all styles
  js/core.js        helpers, Xtream + M3U adapter, storage, profiles, focus engine, router
  js/i18n.js        interface translations
  js/player.js      track detection (MKV), language preferences, player screen
  js/screens.js     home, detail, browse, live TV, search, settings, login
  lib/webOSTV.js    LG webOSTV.js library (Apache-2.0)
demo/               legal demo playlist
logo/               logo sources (SVG) and exported PNGs
docs/privacy.html   privacy policy (GitHub Pages)
```

## Translations

The interface is written in Turkish and translated at runtime. To add a language (for example German):

1. In `app/js/i18n.js`, add a `DICT.de` dictionary. Copy `DICT.en` and translate the values.
2. Add `RULES.de` for sentences that contain numbers, such as episode numbers or durations.
3. Add `['de', 'Deutsch']` to `A.UI_LANGS`.

Pull requests are welcome.

## Roadmap

- Online subtitles (e.g. OpenSubtitles) for files without embedded tracks
- EPG / TV guide for live channels
- More interface languages
- Samsung Tizen version

## License

Velvo is licensed under the [GNU General Public License v3.0](LICENSE). You're free to use, study, share and change it. If you distribute a modified version, it must stay open source under the same license.

Third-party components and demo content credits are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Privacy

Velvo collects no data. Your playlist details and preferences stay on your TV. Read the [privacy policy](PRIVACY.md) (also online at [ftanborn.github.io/velvo/privacy.html](https://ftanborn.github.io/velvo/privacy.html)).
