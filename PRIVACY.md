# Privacy Notes

Chrome Snipz is designed as a local-first snippet manager.

## Data stored

The extension stores the snippets the user creates, including:

- snippet title
- snippet body
- category
- tags
- usage count
- created and updated timestamps
- last-used timestamp

## Where data is stored

Snippet data is stored locally in the user's browser with `chrome.storage.local`.

## Data not collected

The MVP does not:

- create user accounts
- send snippet data to a server
- collect analytics
- track browsing history
- read page content
- inject scripts into third-party sites
- sell or share user data

## Sensitive data guidance

Users should not store passwords, API keys, private student information, confidential client details, or other sensitive secrets as snippets.

## Future changes

If future versions add cloud sync, AI-assisted rewriting, analytics, or direct page insertion, the privacy documentation and Chrome Web Store disclosures should be updated before release.
