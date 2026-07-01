const STORAGE_KEYS = {
  snippets: "chromeSnipz.snippets.v1",
  pendingCapture: "chromeSnipz.pendingCapture.v1",
  settings: "chromeSnipz.settings.v1"
};

const MAX_SNIPPET_LENGTH = 500;
const DEFAULT_SETTINGS = {
  captureCopiedSelections: true,
  appendAnchorUrls: true
};

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error("Unable to set side panel behavior", error));
  }
});

chrome.runtime.onStartup.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error("Unable to set side panel behavior", error));
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((error) => {
      console.error(error);
      sendResponse({ ok: false, error: error.message });
    });

  return true;
});

async function handleMessage(message, sender) {
  if (!message || typeof message !== "object") {
    return { ok: false, error: "Invalid message." };
  }

  if (message.type === "CHROME_SNIPZ_CAPTURE_COPIED_SELECTION") {
    return captureCopiedSelection(message.payload, sender);
  }

  if (message.type === "CHROME_SNIPZ_SAVE_CAPTURED_TEXT") {
    return saveCapturedText(message.payload);
  }

  if (message.type === "CHROME_SNIPZ_IGNORE_CAPTURE") {
    return ignoreCapture(message.payload?.id);
  }

  if (message.type === "CHROME_SNIPZ_OPEN_PANEL") {
    return openPanel(sender);
  }

  return { ok: false, error: "Unsupported message type." };
}

async function captureCopiedSelection(payload, sender) {
  const settings = await getSettings();
  if (!settings.captureCopiedSelections) {
    return { ok: true, skipped: true };
  }

  const body = clampSnippetBody(payload?.body);
  if (!body) {
    return { ok: true, skipped: true };
  }

  const sourceUrl = payload?.sourceUrl || sender.tab?.url || null;
  const hostname = sourceUrl ? getHostname(sourceUrl) : null;
  const pendingCapture = {
    id: createId(),
    title: payload?.title || createTitleFromBody(body),
    body,
    sourceUrl,
    sourceTitle: payload?.sourceTitle || sender.tab?.title || null,
    hostname,
    copiedAt: new Date().toISOString(),
    urls: Array.isArray(payload?.urls) ? payload.urls.slice(0, 5) : [],
    wasTruncated: Boolean(payload?.wasTruncated)
  };

  await chrome.storage.local.set({ [STORAGE_KEYS.pendingCapture]: pendingCapture });
  return { ok: true, capture: pendingCapture };
}

async function saveCapturedText(payload) {
  const body = clampSnippetBody(payload?.body);
  if (!body) {
    return { ok: false, error: "No captured text supplied." };
  }

  const result = await chrome.storage.local.get(STORAGE_KEYS.snippets);
  const snippets = Array.isArray(result[STORAGE_KEYS.snippets]) ? result[STORAGE_KEYS.snippets] : [];
  const now = new Date().toISOString();
  const sourceUrl = payload?.sourceUrl || null;

  const snippet = {
    id: createId(),
    title: payload?.title || createTitleFromBody(body),
    category: "Captured Text",
    tags: buildCaptureTags(sourceUrl),
    body,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    sourceUrl
  };

  await chrome.storage.local.set({
    [STORAGE_KEYS.snippets]: [snippet, ...snippets],
    [STORAGE_KEYS.pendingCapture]: null
  });

  return { ok: true, snippet };
}

async function ignoreCapture(captureId) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.pendingCapture);
  const pendingCapture = result[STORAGE_KEYS.pendingCapture];

  if (!captureId || pendingCapture?.id === captureId) {
    await chrome.storage.local.set({ [STORAGE_KEYS.pendingCapture]: null });
  }

  return { ok: true };
}

async function openPanel(sender) {
  if (!chrome.sidePanel?.open) {
    return { ok: false, error: "Side panel opening is not available in this Chrome version." };
  }

  const windowId = sender.tab?.windowId;
  if (!windowId) {
    return { ok: false, error: "Unable to resolve the active window." };
  }

  await chrome.sidePanel.open({ windowId });
  return { ok: true };
}

async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.settings] || {}) };
}

function clampSnippetBody(body) {
  const value = String(body || "").trim();
  return value.length > MAX_SNIPPET_LENGTH ? value.slice(0, MAX_SNIPPET_LENGTH) : value;
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

function buildCaptureTags(sourceUrl) {
  const tags = ["captured"];
  const hostname = sourceUrl ? getHostname(sourceUrl) : null;

  if (hostname) {
    tags.push(hostname.replace(/^www\./, "").split(".")[0].toLowerCase());
  }

  return Array.from(new Set(tags)).slice(0, 8);
}

function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `snippet-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
