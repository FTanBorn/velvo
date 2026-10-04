# Questions for LG Seller Lounge 1:1 Q&A

Send this text before submitting the app, through LG Seller Lounge → Support → 1:1 Q&A.

---

**Subject:** Embedded subtitle track selection (com.webos.media) and requiredACG for a free media player

Hello,

I'm preparing to submit **Velvo** (app ID `io.github.ftanborn.velvo`), a free, open-source media player for webOS TV. It plays the user's own M3U playlist or Xtream Codes account. It contains no content, ads or in-app purchases. Source code: https://github.com/FTanBorn/velvo

The app's main feature is letting users choose the subtitle and audio language of the video they are watching:

- Audio tracks are switched with the standard HTML5 `audioTracks` API.
- Embedded subtitle tracks are enabled and selected through `webOS.service.request('luna://com.webos.media', …)` with the methods `setSubtitleEnable`, `selectTrack` (type `text`), `setSubtitleFontSize`, `setSubtitleColor` and `setSubtitlePosition`, using the `mediaId` of the app's own `<video>` element.
- If a call fails, the app hides the option and shows a message, so the user never sees a broken menu.

I have two questions:

1. Is it acceptable for an app in the LG Content Store to use these `com.webos.media` methods for its own video element? If not, what is the recommended way to let users select embedded subtitle tracks?
2. For webOS TV 26 and later, which ACG group(s) should be declared in `requiredACG` for these methods? They are not listed in the API ACG table. The app also uses `luna://com.webos.applicationManager/launch` (to open trailers in the YouTube app), for which I plan to declare `application.launcher`.

Thank you.
