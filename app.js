const KEYS = {
  snippets: "chromeSnipz.snippets.v1",
  draft: "chromeSnipz.editorDraft.v1",
  capture: "chromeSnipz.pendingCapture.v1",
  settings: "chromeSnipz.settings.v1"
};
const LIMIT = 500;
const CATEGORIES = ["General", "Reply", "Promotion", "Support", "Research", "Reference", "Captured Text"];
const DEFAULT_SETTINGS = { captureCopiedSelections: true, appendAnchorUrls: true };
const starters = [
  snippet("Quick Reply", "Reply", ["reply", "general"], "Thanks for sharing this. The practical takeaway for me is that tools are most useful when they support a clear workflow and make the next action easier."),
  snippet("Helpful Resource Follow-up", "Reference", ["resource", "follow-up"], "This is a useful thread. I have a related resource that goes deeper into the implementation details. I’ll share it separately so the main discussion stays focused.")
];
const state = { snippets: [], settings: DEFAULT_SETTINGS, capture: null, editingId: null, search: "", category: "all", draftTimer: 0 };
const $ = (selector) => document.querySelector(selector);
const el = {
  count: $("#snippetCount"), captureToggle: $("#captureToggle"), linksToggle: $("#appendLinksToggle"),
  capturePanel: $("#capturePanel"), captureSource: $("#captureSource"), capturePreview: $("#capturePreview"),
  saveCapture: $("#saveCaptureButton"), loadCapture: $("#loadCaptureButton"), discardCapture: $("#discardCaptureButton"),
  search: $("#searchInput"), category: $("#categoryFilter"), list: $("#snippetList"), empty: $("#emptyState"),
  editorTitle: $("#editorTitle"), draftStatus: $("#draftStatus"), cancelEdit: $("#cancelEditButton"), form: $("#snippetForm"),
  title: $("#titleInput"), categoryInput: $("#categoryInput"), suggestions: $("#categorySuggestions"),
  tags: $("#tagsInput"), body: $("#bodyInput"), chars: $("#charCounter"), save: $("#saveButton"),
  clearDraft: $("#clearDraftButton"), message: $("#formMessage"), export: $("#exportButton"), import: $("#importButton"), file: $("#importFileInput")
};

init();

async function init() {
  bind();
  const data = await chrome.storage.local.get([KEYS.snippets, KEYS.settings, KEYS.capture, KEYS.draft]);
  state.snippets = Array.isArray(data[KEYS.snippets]) ? data[KEYS.snippets].map(normalizeSnippet) : starters;
  state.settings = { ...DEFAULT_SETTINGS, ...(data[KEYS.settings] || {}) };
  state.capture = data[KEYS.capture] || null;
  await chrome.storage.local.set({ [KEYS.snippets]: state.snippets, [KEYS.settings]: state.settings });
  restoreDraft(data[KEYS.draft]);
  render();
}

function bind() {
  el.captureToggle.addEventListener("change", async () => { state.settings.captureCopiedSelections = el.captureToggle.checked; await saveSettings(); renderSettings(); });
  el.linksToggle.addEventListener("change", async () => { state.settings.appendAnchorUrls = el.linksToggle.checked; await saveSettings(); });
  el.search.addEventListener("input", () => { state.search = el.search.value.trim().toLowerCase(); renderList(); });
  el.category.addEventListener("change", () => { state.category = el.category.value; renderList(); });
  [el.title, el.categoryInput, el.tags, el.body].forEach((input) => input.addEventListener("input", () => { updateCounter(); queueDraft(); }));
  el.form.addEventListener("submit", async (event) => { event.preventDefault(); await saveEditorSnippet(); });
  el.cancelEdit.addEventListener("click", resetEditor);
  el.clearDraft.addEventListener("click", async () => { await resetEditor(); show("Draft cleared."); });
  el.list.addEventListener("click", handleListClick);
  el.saveCapture.addEventListener("click", saveCaptureAsSnippet);
  el.loadCapture.addEventListener("click", loadCaptureIntoEditor);
  el.discardCapture.addEventListener("click", discardCapture);
  el.export.addEventListener("click", exportSnippets);
  el.import.addEventListener("click", () => el.file.click());
  el.file.addEventListener("change", importSnippets);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[KEYS.capture]) { state.capture = changes[KEYS.capture].newValue || null; renderCapture(); }
    if (changes[KEYS.settings]) { state.settings = { ...DEFAULT_SETTINGS, ...(changes[KEYS.settings].newValue || {}) }; renderSettings(); }
    if (changes[KEYS.snippets]) { state.snippets = (changes[KEYS.snippets].newValue || []).map(normalizeSnippet); renderCategories(); renderList(); }
  });
}

async function handleListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  if (button.dataset.action === "copy") return copySnippet(id);
  if (button.dataset.action === "edit") return editSnippet(id);
  if (button.dataset.action === "delete") return deleteSnippet(id);
}

async function saveEditorSnippet() {
  const title = el.title.value.trim();
  const body = el.body.value.trim();
  if (!title) return show("Add a title before saving.", true);
  if (!body) return show("Add snippet text before saving.", true);
  if (body.length > LIMIT) return show(`Snippets must be ${LIMIT} characters or fewer.`, true);
  const now = new Date().toISOString();
  if (state.editingId) {
    state.snippets = state.snippets.map((s) => s.id === state.editingId ? { ...s, title, body, category: cleanCategory(el.categoryInput.value), tags: parseTags(el.tags.value), updatedAt: now } : s);
    show("Snippet updated.");
  } else {
    state.snippets.unshift(snippet(title, cleanCategory(el.categoryInput.value), parseTags(el.tags.value), body));
    show("Snippet saved.");
  }
  await chrome.storage.local.set({ [KEYS.snippets]: state.snippets });
  await resetEditor({ keepMessage: true });
  render();
}

async function copySnippet(id) {
  const target = state.snippets.find((s) => s.id === id);
  if (!target) return;
  try {
    await navigator.clipboard.writeText(target.body);
    const now = new Date().toISOString();
    state.snippets = state.snippets.map((s) => s.id === id ? { ...s, usageCount: Number(s.usageCount || 0) + 1, lastUsedAt: now } : s);
    await chrome.storage.local.set({ [KEYS.snippets]: state.snippets });
    show("Copied to clipboard.");
    renderList();
  } catch (error) {
    console.error(error);
    show("Unable to copy. Try selecting the text manually.", true);
  }
}

function editSnippet(id) {
  const target = state.snippets.find((s) => s.id === id);
  if (!target) return;
  state.editingId = id;
  el.editorTitle.textContent = "Edit snippet";
  el.save.textContent = "Update snippet";
  el.cancelEdit.classList.remove("hidden");
  el.title.value = target.title;
  el.categoryInput.value = target.category;
  el.tags.value = (target.tags || []).join(", ");
  el.body.value = target.body;
  updateCounter();
  queueDraft();
  el.title.focus();
}

async function deleteSnippet(id) {
  const target = state.snippets.find((s) => s.id === id);
  if (!target || !confirm(`Delete “${target.title}”?`)) return;
  state.snippets = state.snippets.filter((s) => s.id !== id);
  await chrome.storage.local.set({ [KEYS.snippets]: state.snippets });
  if (state.editingId === id) await resetEditor();
  render();
  show("Snippet deleted.");
}

async function saveCaptureAsSnippet() {
  if (!state.capture) return;
  state.snippets.unshift(snippet(state.capture.title || titleFromBody(state.capture.body), "Captured Text", captureTags(state.capture), clamp(state.capture.body), state.capture.sourceUrl || null));
  state.capture = null;
  await chrome.storage.local.set({ [KEYS.snippets]: state.snippets, [KEYS.capture]: null });
  render();
  show("Captured text saved as a snippet.");
}

function loadCaptureIntoEditor() {
  if (!state.capture) return;
  state.editingId = null;
  el.editorTitle.textContent = "Create snippet";
  el.save.textContent = "Save snippet";
  el.cancelEdit.classList.add("hidden");
  el.title.value = state.capture.title || titleFromBody(state.capture.body);
  el.categoryInput.value = "Captured Text";
  el.tags.value = captureTags(state.capture).join(", ");
  el.body.value = clamp(state.capture.body);
  updateCounter();
  queueDraft();
  el.title.focus();
  show("Captured text loaded into the editor.");
}

async function discardCapture() {
  state.capture = null;
  await chrome.storage.local.set({ [KEYS.capture]: null });
  renderCapture();
}

function render() { renderSettings(); renderCapture(); renderCategories(); renderList(); updateCounter(); }
function renderSettings() { el.captureToggle.checked = !!state.settings.captureCopiedSelections; el.linksToggle.checked = !!state.settings.appendAnchorUrls; el.linksToggle.disabled = !el.captureToggle.checked; }
function renderCapture() {
  el.capturePanel.classList.toggle("hidden", !state.capture);
  if (!state.capture) { el.captureSource.textContent = ""; el.capturePreview.textContent = ""; return; }
  const source = state.capture.sourceTitle || state.capture.hostname || "Current page";
  const copied = state.capture.copiedAt ? new Date(state.capture.copiedAt).toLocaleString() : "recently";
  el.captureSource.textContent = `${source} · ${copied}`;
  el.capturePreview.textContent = state.capture.body || "";
}

function renderCategories() {
  const categories = [...new Set([...CATEGORIES, ...state.snippets.map((s) => s.category || "General")])].sort((a, b) => a.localeCompare(b));
  el.category.innerHTML = "";
  el.category.append(option("all", "All"), ...categories.map((category) => option(category, category)));
  if (!categories.includes(state.category)) state.category = "all";
  el.category.value = state.category;
  el.suggestions.innerHTML = "";
  categories.forEach((category) => { const item = document.createElement("option"); item.value = category; el.suggestions.appendChild(item); });
}

function renderList() {
  const snippets = state.snippets.filter((s) => {
    const inCategory = state.category === "all" || s.category === state.category;
    const text = [s.title, s.body, s.category, ...(s.tags || [])].join(" ").toLowerCase();
    return inCategory && (!state.search || text.includes(state.search));
  }).sort((a, b) => (Date.parse(b.lastUsedAt || 0) - Date.parse(a.lastUsedAt || 0)) || (Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0)));
  el.count.textContent = `${state.snippets.length} saved`;
  el.empty.classList.toggle("hidden", snippets.length > 0);
  el.list.innerHTML = "";
  snippets.forEach((s) => el.list.appendChild(card(s)));
}

function card(s) {
  const item = document.createElement("li");
  item.className = "snippet-card";
  item.append(row("snippet-card-header", div("snippet-title", s.title), pill(`${s.body.length}/${LIMIT}`)));
  const body = document.createElement("p"); body.className = "snippet-body"; body.textContent = s.body; item.appendChild(body);
  const meta = div("snippet-meta"); meta.append(pill(s.category || "General"), pill(`Used ${Number(s.usageCount || 0)}`));
  (s.tags || []).slice(0, 3).forEach((tag) => meta.appendChild(pill(`#${tag}`))); item.appendChild(meta);
  const actions = div("snippet-actions");
  actions.append(button("copy", s.id, "Copy", "action-button"), button("edit", s.id, "Edit", "secondary-button"), button("delete", s.id, "Delete", "danger-button"));
  item.appendChild(actions);
  return item;
}

function queueDraft() {
  clearTimeout(state.draftTimer);
  state.draftTimer = setTimeout(async () => {
    await chrome.storage.local.set({ [KEYS.draft]: { editingId: state.editingId, title: el.title.value, category: el.categoryInput.value, tags: el.tags.value, body: el.body.value, updatedAt: new Date().toISOString() } });
    el.draftStatus.textContent = "Draft saved locally.";
  }, 250);
  el.draftStatus.textContent = "Autosaving draft...";
}
function restoreDraft(draft) {
  if (!draft || typeof draft !== "object" || !(draft.title || draft.category || draft.tags || draft.body)) return;
  state.editingId = draft.editingId || null;
  el.title.value = draft.title || ""; el.categoryInput.value = draft.category || ""; el.tags.value = draft.tags || ""; el.body.value = draft.body || "";
  if (state.editingId) { el.editorTitle.textContent = "Edit snippet"; el.save.textContent = "Update snippet"; el.cancelEdit.classList.remove("hidden"); }
  el.draftStatus.textContent = "Draft restored.";
}
async function resetEditor(options = {}) {
  state.editingId = null;
  el.editorTitle.textContent = "Create snippet"; el.save.textContent = "Save snippet"; el.cancelEdit.classList.add("hidden"); el.form.reset(); updateCounter();
  clearTimeout(state.draftTimer); await chrome.storage.local.remove(KEYS.draft); el.draftStatus.textContent = "Draft autosaves locally while you type.";
  if (!options.keepMessage) show("");
}

function updateCounter() { const n = el.body.value.length; el.chars.textContent = `${n} / ${LIMIT}`; el.chars.classList.toggle("is-warning", n >= 450 && n <= LIMIT); el.chars.classList.toggle("is-danger", n > LIMIT); }
function show(text, error = false) { el.message.textContent = text; el.message.classList.toggle("is-error", error); }
async function saveSettings() { await chrome.storage.local.set({ [KEYS.settings]: state.settings }); }
function parseTags(value) { return value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 8); }
function cleanCategory(value) { return value.trim() || "General"; }
function clamp(value) { value = String(value || "").trim(); return value.length > LIMIT ? value.slice(0, LIMIT) : value; }
function captureTags(capture) { const tags = ["captured"]; if (capture.hostname) tags.push(capture.hostname.replace(/^www\./, "").split(".")[0].toLowerCase()); return [...new Set(tags)].slice(0, 8); }
function titleFromBody(body) { const text = String(body || "").replace(/\s+/g, " ").trim(); return !text ? "Captured snippet" : text.length > 56 ? `${text.slice(0, 56)}...` : text; }
function snippet(title, category, tags, body, sourceUrl = null) { const now = new Date().toISOString(); return { id: crypto.randomUUID ? crypto.randomUUID() : `snippet-${Date.now()}-${Math.random().toString(16).slice(2)}`, title, category, tags, body: clamp(body), usageCount: 0, createdAt: now, updatedAt: now, lastUsedAt: null, sourceUrl }; }
function normalizeSnippet(s) { return { ...snippet(s.title || titleFromBody(s.body), s.category || "General", Array.isArray(s.tags) ? s.tags : [], s.body || "", s.sourceUrl || null), ...s, body: clamp(s.body), usageCount: Number(s.usageCount || 0) }; }
function option(value, label) { const item = document.createElement("option"); item.value = value; item.textContent = label; return item; }
function div(className, text) { const node = document.createElement("div"); node.className = className; if (text) node.textContent = text; return node; }
function row(className, ...children) { const node = div(className); node.append(...children); return node; }
function pill(text) { const node = document.createElement("span"); node.className = "meta-pill"; node.textContent = text; return node; }
function button(action, id, label, className) { const node = document.createElement("button"); node.type = "button"; node.className = className; node.dataset.action = action; node.dataset.id = id; node.textContent = label; return node; }

function exportSnippets() {
  const blob = new Blob([JSON.stringify({ app: "Chrome Snipz", version: "0.2.0", exportedAt: new Date().toISOString(), snippets: state.snippets }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `chrome-snipz-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
}
async function importSnippets(event) {
  const [file] = event.target.files; if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const imported = (Array.isArray(parsed) ? parsed : parsed.snippets).map(normalizeSnippet).filter((s) => s.body);
    const ids = new Set(state.snippets.map((s) => s.id));
    state.snippets = [...imported.map((s) => ids.has(s.id) ? { ...s, id: crypto.randomUUID() } : s), ...state.snippets];
    await chrome.storage.local.set({ [KEYS.snippets]: state.snippets }); render(); show(`Imported ${imported.length} snippet${imported.length === 1 ? "" : "s"}.`);
  } catch (error) { console.error(error); show("Import failed. Use a valid Chrome Snipz JSON file.", true); }
  finally { el.file.value = ""; }
}
