# YT Local Player

A Chrome extension that swaps the video on a YouTube watch page for a file from your computer, while keeping the YouTube interface (controls, progress bar, fullscreen, etc.) intact.

Useful when you have a local copy of a video (a downloaded lecture, a recording, a clip you own) and want to watch it with YouTube's player UI.

## Features

- Adds a folder-with-upload button to the YouTube player control bar, next to the fullscreen button.
- Opens a file picker for any `video/*` file and plays it in YouTube's own `<video>` element.
- Pauses the YouTube video automatically when a local file is loaded.
- Shows a toast with the loaded file name and updates the button tooltip.
- Works with YouTube's single-page navigation: when you move to another video, the local object URL is released and the button is re-injected on the new page.
- Clicking the extension icon on a YouTube watch page opens the same file picker. On any other site it shows an alert telling you to open a video first.

## Installation

The extension is not published to the Chrome Web Store, so load it unpacked:

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome (or any Chromium browser that supports Manifest V3).
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder (the one containing `manifest.json`).

## Usage

1. Open a YouTube video (`https://www.youtube.com/watch?v=...`).
2. Click the **folder icon** in the player control bar, or click the extension icon in the toolbar.
3. Choose a local video file.
4. The local file replaces the YouTube video and starts playing. Use the normal YouTube controls as usual.

To switch files, click the button again.

## Project structure

```
YT-localplayer-extension/
├── manifest.json   # Manifest V3 configuration (permissions, content script, service worker)
├── background.js   # Service worker: handles toolbar icon clicks
├── content.js      # Content script injected into youtube.com/watch pages
├── inject.css      # Styles for the injected button and toast
└── icons/          # Extension icons (16, 48, 128 px)
```

### How it works

- **`background.js`** listens for clicks on the toolbar icon. On a YouTube watch page it sends an `openLocalVideo` message to the content script. Elsewhere it runs a script in the tab that shows an alert.
- **`content.js`** locates the player (`#movie_player`), its right-hand controls (`.ytp-right-controls`) and its `<video>` element. It:
  - injects the `#ytlp-btn` button before the fullscreen button, using inline styles and DOM-built SVG so YouTube's CSS and HTML sanitizing do not interfere;
  - creates a hidden `<input type="file" accept="video/*">` on demand;
  - on file selection, pauses YouTube through its player API and `video.pause()`, then sets `video.src` to a `URL.createObjectURL(file)` and plays it;
  - uses two `MutationObserver`s: one re-injects the button if YouTube rebuilds the controls, the other detects URL changes to clean up the previous object URL.
- **`inject.css`** holds the styles for the button override and the toast notification.

## Permissions

| Permission | Why it is needed |
| --- | --- |
| `scripting` | Run a small alert script on non-YouTube tabs when the toolbar icon is clicked. |
| `activeTab` | Access the current tab after the user clicks the toolbar icon. |
| Content script on `*://www.youtube.com/watch*` | Inject the button and swap the video on watch pages. |

The extension does not make network requests and does not send your files anywhere. The video is read locally through a blob URL.

## Limitations

- Only works on `youtube.com/watch` pages. It does not run on Shorts, embeds, or other sites.
- Depends on YouTube's current DOM and player selectors (`#movie_player`, `.ytp-right-controls`, `video.html5-main-video`). If YouTube changes them, the button will stop appearing until the selectors are updated.
- Playback is limited to what the browser can decode. Formats such as some MKV or HEVC files may not play in Chrome.
- The YouTube progress bar and time display still reflect the YouTube video, not the local file, so seeking and time labels may not match the local file's timeline.
- The button and toast text are currently in Portuguese (European).

## Development

There is no build step. Edit the files and reload the extension from `chrome://extensions` (the reload icon on the extension card), then reload the YouTube tab, since content scripts are only injected on page load.

Debugging: open DevTools on a YouTube watch page. The content script logs `[YT Local Player] Botão injectado.` when the button is added.

## License

No license has been specified yet.
