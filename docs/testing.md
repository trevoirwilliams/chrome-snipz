# Testing Chrome Snipz Locally

## Load the unpacked extension

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the repository folder that contains `manifest.json`.
6. Pin **Chrome Snipz** to the toolbar.
7. Click the toolbar icon to open the side panel.

## Functional checklist

### Side panel workflow

- Click the Chrome Snipz toolbar icon.
- Confirm the Chrome side panel opens.
- Click outside the panel or interact with the current web page.
- Confirm the side panel remains available until you explicitly close it.

### Draft persistence

- Start creating a snippet without saving it.
- Click away from the panel or change tabs.
- Reopen the side panel if needed.
- Confirm the draft title, category, tags, and body are still present.
- Click **Clear draft** and confirm the editor resets.

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
- Paste into a comment box, Gmail draft, Google Doc, or any text field.
- Confirm the copied text matches the snippet body.
- Confirm the usage count increases.

### Copied-selection capture

- Ensure **Watch copied selections** is enabled.
- Select text on a normal web page and copy it.
- Confirm a Chrome Snipz prompt appears on the page.
- Click **Save** and confirm the copied text appears as a snippet.
- Repeat the test and click **Review** to open the side panel review card.
- Click **Dismiss** and confirm the pending capture disappears.

### Anchor URL extraction

- Ensure **Append selected link URLs** is enabled.
- Select visible text that includes a hyperlink.
- Copy the selected text.
- Confirm the captured snippet body includes the selected text and the extracted URL at the end.

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
- Reopen the side panel.
- Confirm saved snippets and settings are still present.

## Browser console debugging

To inspect side panel errors:

1. Open the Chrome Snipz side panel.
2. Right-click inside the panel.
3. Click **Inspect**.
4. Review the Console tab.

To inspect page capture errors:

1. Open a web page where copied-selection capture is being tested.
2. Open DevTools for the page.
3. Review the Console tab.

## Known limitations

- Copy detection runs on normal `http` and `https` pages only.
- Chrome Web Store pages, browser settings pages, and other restricted pages do not allow normal extension content scripts.
- The extension captures selected copied text for review; it does not modify the user's actual clipboard text when appending anchor URLs.
- Snippets are local to the browser profile and are not synced across devices.
