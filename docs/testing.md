# Testing Chrome Snipz Locally

## Load the unpacked extension

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the repository folder that contains `manifest.json`.
6. Pin **Chrome Snipz** to the toolbar.
7. Open the popup from the toolbar.

## Functional checklist

### Snippet creation

- Create a snippet with a title, category, tags, and body.
- Confirm the snippet appears in the list.
- Confirm the saved count increases.
- Confirm the character counter updates while typing.
- Confirm the body field prevents more than 500 characters.

### Search and filtering

- Search by title.
- Search by body text.
- Search by tag.
- Filter by category.
- Confirm the empty state appears when no snippets match.

### Copy workflow

- Click **Copy** on a snippet.
- Paste into a LinkedIn comment box, Gmail draft, Google Doc, or any text field.
- Confirm the copied text matches the snippet body.
- Confirm the usage count increases.

### Editing and deleting

- Edit an existing snippet and save changes.
- Cancel an edit and confirm the form resets.
- Delete a snippet and confirm it disappears from the list.

### Import and export

- Click **Export JSON** and confirm a JSON file downloads.
- Delete or edit a snippet.
- Click **Import JSON** and select the exported file.
- Confirm imported snippets appear in the list.

### Reload persistence

- Go back to `chrome://extensions`.
- Click the reload icon for Chrome Snipz.
- Reopen the popup.
- Confirm saved snippets are still present.

## Browser console debugging

To inspect popup errors:

1. Open the Chrome Snipz popup.
2. Right-click inside the popup.
3. Click **Inspect**.
4. Review the Console tab.

## Known MVP limitations

- The extension copies snippets to the clipboard; it does not insert directly into the active page.
- Snippets are local to the browser profile and are not synced across devices.
- The current UI is optimized for Chrome desktop, not mobile browsers.
