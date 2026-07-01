# Privacy Notes

Chrome Snipz is designed as a local-first snippet manager.

## Data stored

The extension stores data the user creates or explicitly confirms, including:

- snippet title
- snippet body
- category
- tags
- usage count
- created and updated timestamps
- last-used timestamp
- source URL for captured snippets, when available
- editor draft text while the user is typing
- pending copied-selection text while awaiting user review
- extension settings

## Where data is stored

Snippet data, draft data, settings, and pending copied-selection data are stored locally in the user's browser with `chrome.storage.local`.

## Copied-selection capture

When copied-selection capture is enabled, Chrome Snipz runs a content script on normal `http` and `https` web pages. The content script listens for browser copy events, reads the currently selected text, optionally extracts selected anchor URLs, and asks the user whether the copied text should become a snippet.

Captured text is not automatically saved as a permanent snippet unless the user confirms it. A pending capture may be stored locally so the user can review it in the side panel.

## Data not collected

The current version does not:

- create user accounts
- send snippet data to a server
- collect analytics
- track browsing history
- sell or share user data
- read full page content for remote processing
- sync data to external services

## Sensitive data guidance

Users should not store passwords, API keys, private student information, confidential client details, or other sensitive secrets as snippets.

Users should dismiss copied-selection prompts when the selected text contains private or sensitive content.

## Future changes

If future versions add cloud sync, AI-assisted rewriting, analytics, or direct page insertion, the privacy documentation and Chrome Web Store disclosures should be updated before release.
