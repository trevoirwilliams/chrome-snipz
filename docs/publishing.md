# Publishing Chrome Snipz to the Chrome Web Store

## Pre-submission checklist

Before uploading to the Chrome Web Store:

- Test the extension locally as an unpacked extension.
- Confirm `manifest.json` has the correct name, description, and version.
- Prepare production icons, including a 128x128 icon.
- Prepare screenshots for the listing.
- Prepare a concise single-purpose description.
- Review `PRIVACY.md` and ensure it matches the actual behavior of the extension.
- Zip only the extension files, not the parent project folder.

## Create the zip package

From the repository root:

```bash
zip -r chrome-snipz-0.1.0.zip manifest.json popup.html popup.css popup.js PRIVACY.md docs README.md
```

Do not include local OS files, test exports, `.git`, or unrelated project files in the package.

## Suggested listing copy

### Short description

Store, search, and copy short reusable text snippets for faster replies and comments.

### Detailed description

Chrome Snipz helps creators, instructors, community managers, and professionals quickly reuse short text snippets while responding across the web. Save snippets for course promotions, social replies, student support, partnership responses, and common comments. Search, filter by category, copy to clipboard, and paste wherever you are working.

### Single purpose statement

Chrome Snipz stores user-created text snippets locally and lets users quickly copy those snippets to the clipboard.

## Suggested privacy disclosure notes

For the MVP, the extension stores snippet data locally using Chrome extension storage. It does not collect analytics, transmit data to a server, read page content, track browsing activity, or inject scripts into third-party websites.

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
2. Open the Chrome Snipz toolbar popup.
3. Create a snippet under 500 characters.
4. Click Copy.
5. Paste the copied snippet into any text field.
6. Test search, category filtering, edit, delete, export, and import.

No login, credentials, paid account, external server, or special website access is required.
```

## Versioning guidance

Increase the manifest version for every Chrome Web Store upload. Use a simple semantic version progression such as:

- `0.1.0` for the first testable MVP.
- `0.2.0` for side panel or favorites.
- `1.0.0` for the first polished public release.
