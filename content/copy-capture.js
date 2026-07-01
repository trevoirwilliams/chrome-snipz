(() => {
  const STORAGE_KEYS = {
    settings: "chromeSnipz.settings.v1"
  };

  const MAX_SNIPPET_LENGTH = 500;
  const MIN_CAPTURE_LENGTH = 4;
  const TOAST_ID = "chrome-snipz-capture-toast";
  const DEFAULT_SETTINGS = {
    captureCopiedSelections: true,
    appendAnchorUrls: true
  };

  document.addEventListener("copy", handleCopy, true);

  async function handleCopy() {
    const settings = await getSettings();
    if (!settings.captureCopiedSelections) {
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || "";
    if (selectedText.length < MIN_CAPTURE_LENGTH) {
      return;
    }

    const urls = settings.appendAnchorUrls ? extractSelectedAnchorUrls(selection) : [];
    const bodyResult = buildBody(selectedText, urls);
    const payload = {
      title: createTitleFromBody(bodyResult.body),
      body: bodyResult.body,
      urls,
      wasTruncated: bodyResult.wasTruncated,
      sourceUrl: location.href,
      sourceTitle: document.title
    };

    const response = await sendMessage({
      type: "CHROME_SNIPZ_CAPTURE_COPIED_SELECTION",
      payload
    });

    if (response?.ok && response.capture) {
      showCaptureToast(response.capture);
    }
  }

  async function getSettings() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.settings);
      return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.settings] || {}) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  function extractSelectedAnchorUrls(selection) {
    if (!selection || selection.rangeCount === 0) {
      return [];
    }

    const urls = new Set();

    for (let index = 0; index < selection.rangeCount; index += 1) {
      const range = selection.getRangeAt(index);
      addAnchorsFromFragment(range, urls);
      addClosestAnchor(range.startContainer, urls);
      addClosestAnchor(range.endContainer, urls);
      addAnchorsFromCommonAncestor(range, selection, urls);
    }

    return Array.from(urls).slice(0, 5);
  }

  function addAnchorsFromFragment(range, urls) {
    const fragment = range.cloneContents();
    fragment.querySelectorAll?.("a[href]").forEach((anchor) => addUrl(anchor.href, urls));
  }

  function addClosestAnchor(node, urls) {
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    const anchor = element?.closest?.("a[href]");
    if (anchor) {
      addUrl(anchor.href, urls);
    }
  }

  function addAnchorsFromCommonAncestor(range, selection, urls) {
    const ancestor = range.commonAncestorContainer;
    const element = ancestor?.nodeType === Node.ELEMENT_NODE ? ancestor : ancestor?.parentElement;
    if (!element?.querySelectorAll) {
      return;
    }

    element.querySelectorAll("a[href]").forEach((anchor) => {
      if (selection.containsNode(anchor, true)) {
        addUrl(anchor.href, urls);
      }
    });
  }

  function addUrl(rawUrl, urls) {
    try {
      const url = new URL(rawUrl, location.href);
      if (!["http:", "https:"].includes(url.protocol)) {
        return;
      }

      urls.add(url.href);
    } catch {
      // Ignore malformed href values.
    }
  }

  function buildBody(selectedText, urls) {
    const uniqueUrls = Array.from(new Set(urls)).filter((url) => !selectedText.includes(url));
    const appendedUrlBlock = uniqueUrls.length ? `\n\n${uniqueUrls.join("\n")}` : "";
    const body = `${selectedText}${appendedUrlBlock}`.trim();
    const wasTruncated = body.length > MAX_SNIPPET_LENGTH;

    return {
      body: wasTruncated ? body.slice(0, MAX_SNIPPET_LENGTH) : body,
      wasTruncated
    };
  }

  function showCaptureToast(capture) {
    removeExistingToast();

    const toast = document.createElement("div");
    toast.id = TOAST_ID;
    toast.setAttribute("role", "dialog");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML = `
      <div class="chrome-snipz-toast-title">Save copied text as a snippet?</div>
      <div class="chrome-snipz-toast-preview"></div>
      <div class="chrome-snipz-toast-actions">
        <button type="button" data-action="save">Save</button>
        <button type="button" data-action="review">Review</button>
        <button type="button" data-action="dismiss">Dismiss</button>
      </div>
    `;

    const preview = toast.querySelector(".chrome-snipz-toast-preview");
    preview.textContent = capture.body;

    toast.querySelector("[data-action='save']").addEventListener("click", async () => {
      const response = await sendMessage({
        type: "CHROME_SNIPZ_SAVE_CAPTURED_TEXT",
        payload: capture
      });

      if (response?.ok) {
        preview.textContent = "Saved to Chrome Snipz.";
        window.setTimeout(removeExistingToast, 1300);
      }
    });

    toast.querySelector("[data-action='review']").addEventListener("click", async () => {
      await sendMessage({ type: "CHROME_SNIPZ_OPEN_PANEL" });
      removeExistingToast();
    });

    toast.querySelector("[data-action='dismiss']").addEventListener("click", async () => {
      await sendMessage({
        type: "CHROME_SNIPZ_IGNORE_CAPTURE",
        payload: { id: capture.id }
      });
      removeExistingToast();
    });

    const style = document.createElement("style");
    style.textContent = `
      #${TOAST_ID} {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483647;
        width: min(360px, calc(100vw - 36px));
        padding: 14px;
        border: 1px solid #d9deea;
        border-radius: 16px;
        background: #ffffff;
        color: #172033;
        box-shadow: 0 12px 30px rgba(23, 32, 51, 0.22);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #${TOAST_ID} .chrome-snipz-toast-title {
        font-size: 14px;
        font-weight: 800;
        margin-bottom: 8px;
      }

      #${TOAST_ID} .chrome-snipz-toast-preview {
        max-height: 88px;
        overflow: auto;
        border: 1px solid #d9deea;
        border-radius: 10px;
        background: #f6f7fb;
        padding: 8px;
        font-size: 12px;
        line-height: 1.4;
        white-space: pre-wrap;
      }

      #${TOAST_ID} .chrome-snipz-toast-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }

      #${TOAST_ID} button {
        border: 0;
        border-radius: 10px;
        padding: 8px 10px;
        background: #eef1f7;
        color: #172033;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        font-weight: 800;
      }

      #${TOAST_ID} button[data-action="save"] {
        background: #3657ff;
        color: #ffffff;
      }
    `;

    toast.appendChild(style);
    document.documentElement.appendChild(toast);
  }

  function removeExistingToast() {
    document.getElementById(TOAST_ID)?.remove();
  }

  function createTitleFromBody(body) {
    const singleLine = String(body || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!singleLine) {
      return "Captured snippet";
    }

    return singleLine.length > 56 ? `${singleLine.slice(0, 56)}...` : singleLine;
  }

  function sendMessage(message) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message });
            return;
          }

          resolve(response);
        });
      } catch (error) {
        resolve({ ok: false, error: error.message });
      }
    });
  }
})();
