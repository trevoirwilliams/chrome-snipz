# Chrome Snipz

Chrome Snipz is a lightweight Manifest V3 Chrome extension for storing, searching, capturing, and copying short reusable text snippets. It is designed for creators, instructors, community managers, support teams, and professionals who repeatedly write similar replies, notes, references, or promotional text across the web.

## Current scope

Version `0.2.0` expands the original MVP with a persistent side panel and copied-selection capture workflow:

- Store reusable text snippets up to 500 characters.
- Add a title, category, and comma-separated tags.
- Search snippets by title, body, category, or tags.
- Filter snippets by category.
- Copy snippets to the clipboard.
- Track usage count and recently used snippets.
- Edit and delete snippets.
- Import and export snippets as JSON.
- Persist snippets locally with `chrome.storage.local`.
- Autosave the current editor draft so text is not lost when focus changes.
- Open as a Chrome side panel so the UI can remain available while browsing.
- Detect copied selected text in normal web pages and ask whether to save it as a snippet.
- Extract selected anchor URLs and append them to the captured snippet body when enabled.

## Project structure

```text
.
├── manifest.json                 # Chrome extension manifest
├── service_worker.js             # Side panel setup and capture message handling
├── panel.html                    # Persistent side panel UI
├── app.css                       # Side panel styling
├── app.js                        # Snippet manager, draft autosave, settings, capture review
├── popup.html                    # Legacy MVP popup retained but no longer used by manifest
├── popup.css                     # Legacy MVP popup styling
├── popup.js                      # Legacy MVP popup behavior
├── content/
│   └── copy-capture.js           # Web page copy-selection capture script
├── PRIVACY.md                    # Privacy notes for users and reviewers
└── docs/
    ├── publishing.md             # Chrome Web Store publishing checklist
    └── testing.md                # Local testing instructions
```

## Local testing

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the repository folder that contains `manifest.json`.
6. Pin **Chrome Snipz** to the toolbar.
7. Click the toolbar icon to open the persistent side panel.
8. Create a snippet, copy it, and paste it into any text field.
9. Select and copy text from a web page, then use the confirmation prompt to save or dismiss the captured snippet.

See [`docs/testing.md`](docs/testing.md) for a fuller test checklist.

## Release packaging

Create a zip package containing the extension files at the repository root. Do not zip the parent folder itself. For example:

```bash
zip -r chrome-snipz-0.2.0.zip manifest.json service_worker.js panel.html app.css app.js content PRIVACY.md docs README.md
```

Upload the zip package in the Chrome Developer Dashboard when you are ready to submit the extension for review.

## Permissions

Chrome Snipz uses:

- `storage` to save snippets, settings, pending captures, and editor drafts locally.
- `clipboardWrite` to copy saved snippets to the clipboard.
- `sidePanel` to keep the snippet manager open while browsing.
- `content_scripts` on `http://*/*` and `https://*/*` so the extension can detect copied selected text on normal web pages.

## Roadmap

Potential next iterations:

- Add favorite snippets and pinned snippets.
- Add placeholder variables such as `{firstName}`, `{courseName}`, and `{link}`.
- Add snippet variants to avoid repetitive replies.
- Add optional direct insertion into active text fields.
- Add `chrome.storage.sync` as an opt-in sync mode.
- Add AI-assisted rewriting for tone, length, and platform context.

## Privacy position

Chrome Snipz stores snippets, draft text, settings, and pending copied-selection captures locally in the browser through Chrome extension storage. The extension does not include analytics, tracking, account login, external network requests, or remote sync.
