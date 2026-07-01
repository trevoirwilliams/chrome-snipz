# Publishing Chrome Snipz to the Chrome Web Store

## Pre-submission checklist

Before uploading to the Chrome Web Store:

- Test the extension locally as an unpacked extension.
- Confirm `manifest.json` has the correct name, description, version, and permissions.
- Prepare production icons, including a 128x128 icon.
- Prepare screenshots for the listing.
- Prepare a concise single-purpose description.
- Review `PRIVACY.md` and ensure it matches the actual behavior of the extension.
- Zip only the extension files, not the parent project folder.

## Create the zip package

From the repository root:

```bash
zip -r chrome-snipz-0.2.0.zip manifest.json service_worker.js panel.html app.css app.js content PRIVACY.md docs README.md
```

Do not include local OS files, test exports, `.git`, or unrelated project files in the package.

## Suggested listing copy

### Short description

Store, capture, search, and copy short reusable text snippets for faster writing.

### Detailed description

Chrome Snipz helps creators, instructors, support teams, community managers, and professionals quickly reuse short text snippets while working across the web. Save snippets for replies, references, support responses, promotional notes, and common comments. Search, filter by category, copy to clipboard, and keep the side panel open while browsing.

Chrome Snipz can also detect copied selected text on normal web pages and ask whether that copied text should become a snippet. When selected text includes a hyperlink, Chrome Snipz can append the selected URL to the captured snippet body.

### Single purpose statement

Chrome Snipz stores user-created text snippets locally and lets users quickly capture, review, search, and copy those snippets.

## Permission justification

Suggested Chrome Web Store permission explanations:

```text
storage: Saves snippets, settings, drafts, and pending copied-selection captures locally in the browser.

clipboardWrite: Lets users copy saved snippets to the clipboard by clicking the Copy button.

sidePanel: Opens Chrome Snipz as a persistent side panel so users can keep the snippet manager available while browsing.

Host access for http and https pages: Runs a content script that detects when selected text is copied and asks the user whether to save that copied text as a snippet. The extension does not send page content or copied text to an external server.
```

## Suggested privacy disclosure notes

The extension stores snippet data, draft text, settings, and pending captures locally using Chrome extension storage. It does not collect analytics, transmit data to a server, track browsing history, create accounts, or sync data externally.

## Upload flow

1. Register and set up a Chrome Web Store developer account.
2. Go to the Chrome Developer Dashboard.
3. Click **Add new item**.
4. Upload the zip package.
5. Complete the Store Listing, Privacy, Distribution, and Test Instructions sections.
6. Submit the item for review.

## Reviewer test instructions

Suggested reviewer instructions:

```text
1. Install the extension.
2. Click the Chrome Snipz toolbar icon to open the side panel.
3. Create a snippet under 500 characters.
4. Click Copy.
5. Paste the copied snippet into any text field.
6. Select and copy text from a normal web page.
7. Use the Chrome Snipz prompt to save, review, or dismiss the copied text.
8. Test search, category filtering, edit, delete, export, and import.

No login, credentials, paid account, external server, or special website access is required.
```

## Versioning guidance

Increase the manifest version for every Chrome Web Store upload. Use a simple semantic version progression such as:

- `0.2.0` for the side panel and copied-selection capture release.
- `0.3.0` for favorites, pinned snippets, or placeholder variables.
- `1.0.0` for the first polished public release.
