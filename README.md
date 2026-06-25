# Chrome Snipz

Chrome Snipz is a lightweight Manifest V3 Chrome extension for storing, searching, and copying short text snippets. It is designed for creators, instructors, community managers, and professionals who repeatedly write similar replies across platforms such as LinkedIn, YouTube, Udemy, Gmail, and community forums.

## MVP scope

This first version intentionally focuses on a low-permission workflow:

- Store reusable text snippets up to 500 characters.
- Add a title, category, and comma-separated tags.
- Search snippets by title, body, category, or tags.
- Filter snippets by category.
- Copy snippets to the clipboard from the extension popup.
- Track usage count and recently used snippets.
- Edit and delete snippets.
- Import and export snippets as JSON.
- Persist data locally with `chrome.storage.local`.

The MVP does not inject text directly into LinkedIn, Gmail, or other sites. That keeps the extension simpler, safer, and less likely to break when web apps change their DOM structure.

## Project structure

```text
.
├── manifest.json        # Chrome extension manifest
├── popup.html           # Popup UI markup
├── popup.css            # Popup styling
├── popup.js             # Snippet storage, filtering, copy, import/export logic
├── PRIVACY.md           # Privacy notes for users and reviewers
└── docs/
    ├── publishing.md    # Chrome Web Store publishing checklist
    └── testing.md       # Local testing instructions
```

## Local testing

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the repository folder that contains `manifest.json`.
6. Pin **Chrome Snipz** to the toolbar.
7. Open the popup, create a snippet, copy it, and paste it into a text field.

See [`docs/testing.md`](docs/testing.md) for a fuller test checklist.

## Release packaging

Create a zip package containing the extension files at the repository root. Do not zip the parent folder itself. For example:

```bash
zip -r chrome-snipz-0.1.0.zip manifest.json popup.html popup.css popup.js PRIVACY.md docs README.md
```

Upload the zip package in the Chrome Developer Dashboard when you are ready to submit the extension for review.

## Roadmap

Potential next iterations:

- Add a Chrome side panel experience for persistent browsing while replying.
- Add favorite snippets and pinned snippets.
- Add placeholder variables such as `{firstName}`, `{courseName}`, and `{link}`.
- Add snippet variants to avoid repetitive social replies.
- Add direct insertion into active text fields using optional host permissions.
- Add `chrome.storage.sync` as an opt-in sync mode.
- Add AI-assisted rewriting for tone, length, and platform context.

## Privacy position

Chrome Snipz stores snippets locally in the browser through Chrome extension storage. The MVP does not include analytics, tracking, network requests, account login, or remote sync.
