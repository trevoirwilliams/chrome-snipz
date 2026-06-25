const STORAGE_KEY = "chromeSnipz.snippets.v1";
const MAX_SNIPPET_LENGTH = 500;
const DEFAULT_CATEGORIES = [
  "Course Promo",
  "LinkedIn Reply",
  "YouTube Reply",
  "Udemy Reply",
  "Partnership",
  "General"
];

const starterSnippets = [
  {
    id: "starter-linkedin-course-promo",
    title: "Soft Course Promo",
    category: "Course Promo",
    tags: ["linkedin", "course", "promo"],
    body: "Great point. I see this challenge often when developers move from concept to real implementation. I cover this step-by-step in one of my courses, with practical examples and production-minded guidance. I’ll leave the course link in the comments for anyone who wants to go deeper.",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsedAt: null
  },
  {
    id: "starter-thanks-for-sharing",
    title: "Thanks for Sharing",
    category: "LinkedIn Reply",
    tags: ["linkedin", "reply"],
    body: "Thanks for sharing this. The practical takeaway for me is that tools are most useful when they support a clear workflow, not when they replace the thinking required to do the work well.",
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsedAt: null
  }
];

const state = {
  snippets: [],
  editingId: null,
  searchText: "",
  categoryFilter: "all"
};

const elements = {
  snippetCount: document.querySelector("#snippetCount"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  snippetList: document.querySelector("#snippetList"),
  emptyState: document.querySelector("#emptyState"),
  editorTitle: document.querySelector("#editorTitle"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  snippetForm: document.querySelector("#snippetForm"),
  titleInput: document.querySelector("#titleInput"),
  categoryInput: document.querySelector("#categoryInput"),
  categorySuggestions: document.querySelector("#categorySuggestions"),
  tagsInput: document.querySelector("#tagsInput"),
  bodyInput: document.querySelector("#bodyInput"),
  charCounter: document.querySelector("#charCounter"),
  saveButton: document.querySelector("#saveButton"),
  formMessage: document.querySelector("#formMessage"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importFileInput: document.querySelector("#importFileInput")
};

init();

async function init() {
  bindEvents();
  await loadSnippets();
  render();
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.searchText = event.target.value.trim().toLowerCase();
    renderSnippetList();
  });

  elements.categoryFilter.addEventListener("change", (event) => {
    state.categoryFilter = event.target.value;
    renderSnippetList();
  });

  elements.bodyInput.addEventListener("input", updateCharacterCounter);

  elements.snippetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveCurrentSnippet();
  });

  elements.cancelEditButton.addEventListener("click", resetForm);

  elements.snippetList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const snippetId = button.dataset.id;
    const action = button.dataset.action;

    if (action === "copy") {
      await copySnippet(snippetId);
    }

    if (action === "edit") {
      editSnippet(snippetId);
    }

    if (action === "delete") {
      await deleteSnippet(snippetId);
    }
  });

  elements.exportButton.addEventListener("click", exportSnippets);
  elements.importButton.addEventListener("click", () => elements.importFileInput.click());
  elements.importFileInput.addEventListener("change", importSnippets);
}

async function loadSnippets() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const savedSnippets = result[STORAGE_KEY];

  if (Array.isArray(savedSnippets)) {
    state.snippets = savedSnippets;
    return;
  }

  state.snippets = starterSnippets;
  await persistSnippets();
}

async function persistSnippets() {
  await chrome.storage.local.set({ [STORAGE_KEY]: state.snippets });
}

async function saveCurrentSnippet() {
  const title = elements.titleInput.value.trim();
  const category = normalizeCategory(elements.categoryInput.value);
  const tags = parseTags(elements.tagsInput.value);
  const body = elements.bodyInput.value.trim();

  if (!title) {
    showFormMessage("Add a title before saving.", true);
    return;
  }

  if (!body) {
    showFormMessage("Add snippet text before saving.", true);
    return;
  }

  if (body.length > MAX_SNIPPET_LENGTH) {
    showFormMessage(`Snippets must be ${MAX_SNIPPET_LENGTH} characters or fewer.`, true);
    return;
  }

  const now = new Date().toISOString();

  if (state.editingId) {
    state.snippets = state.snippets.map((snippet) =>
      snippet.id === state.editingId
        ? {
            ...snippet,
            title,
            category,
            tags,
            body,
            updatedAt: now
          }
        : snippet
    );
    showFormMessage("Snippet updated.");
  } else {
    state.snippets.unshift({
      id: createId(),
      title,
      category,
      tags,
      body,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null
    });
    showFormMessage("Snippet saved.");
  }

  await persistSnippets();
  resetForm({ keepMessage: true });
  render();
}

async function copySnippet(snippetId) {
  const snippet = state.snippets.find((item) => item.id === snippetId);
  if (!snippet) return;

  try {
    await writeToClipboard(snippet.body);
    const now = new Date().toISOString();
    state.snippets = state.snippets.map((item) =>
      item.id === snippetId
        ? {
            ...item,
            usageCount: Number(item.usageCount || 0) + 1,
            lastUsedAt: now
          }
        : item
    );
    await persistSnippets();
    renderSnippetList();
    showFormMessage("Copied to clipboard.");
  } catch (error) {
    console.error(error);
    showFormMessage("Unable to copy. Try selecting the text manually.", true);
  }
}

async function writeToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temporaryTextArea = document.createElement("textarea");
  temporaryTextArea.value = text;
  temporaryTextArea.setAttribute("readonly", "");
  temporaryTextArea.style.position = "fixed";
  temporaryTextArea.style.opacity = "0";
  document.body.appendChild(temporaryTextArea);
  temporaryTextArea.select();
  document.execCommand("copy");
  temporaryTextArea.remove();
}

function editSnippet(snippetId) {
  const snippet = state.snippets.find((item) => item.id === snippetId);
  if (!snippet) return;

  state.editingId = snippet.id;
  elements.editorTitle.textContent = "Edit snippet";
  elements.saveButton.textContent = "Update snippet";
  elements.cancelEditButton.classList.remove("hidden");
  elements.titleInput.value = snippet.title;
  elements.categoryInput.value = snippet.category;
  elements.tagsInput.value = Array.isArray(snippet.tags) ? snippet.tags.join(", ") : "";
  elements.bodyInput.value = snippet.body;
  updateCharacterCounter();
  showFormMessage("");
  elements.titleInput.focus();
}

async function deleteSnippet(snippetId) {
  const snippet = state.snippets.find((item) => item.id === snippetId);
  if (!snippet) return;

  const confirmed = confirm(`Delete “${snippet.title}”?`);
  if (!confirmed) return;

  state.snippets = state.snippets.filter((item) => item.id !== snippetId);
  await persistSnippets();

  if (state.editingId === snippetId) {
    resetForm();
  }

  render();
  showFormMessage("Snippet deleted.");
}

function render() {
  renderCategories();
  renderSnippetList();
  updateCharacterCounter();
}

function renderCategories() {
  const categories = getCategories();

  elements.categoryFilter.innerHTML = "";
  elements.categoryFilter.appendChild(createOption("all", "All"));

  categories.forEach((category) => {
    elements.categoryFilter.appendChild(createOption(category, category));
  });

  if (categories.includes(state.categoryFilter)) {
    elements.categoryFilter.value = state.categoryFilter;
  } else {
    state.categoryFilter = "all";
    elements.categoryFilter.value = "all";
  }

  elements.categorySuggestions.innerHTML = "";
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    elements.categorySuggestions.appendChild(option);
  });
}

function renderSnippetList() {
  const filteredSnippets = getFilteredSnippets();
  elements.snippetList.innerHTML = "";
  elements.snippetCount.textContent = `${state.snippets.length} saved`;
  elements.emptyState.classList.toggle("hidden", filteredSnippets.length > 0);

  filteredSnippets.forEach((snippet) => {
    elements.snippetList.appendChild(createSnippetCard(snippet));
  });
}

function createSnippetCard(snippet) {
  const listItem = document.createElement("li");
  listItem.className = "snippet-card";

  const header = document.createElement("div");
  header.className = "snippet-card-header";

  const title = document.createElement("div");
  title.className = "snippet-title";
  title.textContent = snippet.title;

  const charCount = document.createElement("span");
  charCount.className = "meta-pill";
  charCount.textContent = `${snippet.body.length}/${MAX_SNIPPET_LENGTH}`;

  header.append(title, charCount);

  const body = document.createElement("p");
  body.className = "snippet-body";
  body.textContent = snippet.body;

  const meta = document.createElement("div");
  meta.className = "snippet-meta";
  meta.appendChild(createPill(snippet.category || "General"));
  meta.appendChild(createPill(`Used ${Number(snippet.usageCount || 0)}`));

  if (Array.isArray(snippet.tags)) {
    snippet.tags.slice(0, 3).forEach((tag) => meta.appendChild(createPill(`#${tag}`)));
  }

  const actions = document.createElement("div");
  actions.className = "snippet-actions";
  actions.append(
    createActionButton("copy", snippet.id, "Copy", "action-button"),
    createActionButton("edit", snippet.id, "Edit", "secondary-button"),
    createActionButton("delete", snippet.id, "Delete", "danger-button")
  );

  listItem.append(header, body, meta, actions);
  return listItem;
}

function createActionButton(action, id, label, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.action = action;
  button.dataset.id = id;
  button.textContent = label;
  return button;
}

function createPill(text) {
  const pill = document.createElement("span");
  pill.className = "meta-pill";
  pill.textContent = text;
  return pill;
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function getFilteredSnippets() {
  return state.snippets
    .filter((snippet) => {
      const matchesCategory = state.categoryFilter === "all" || snippet.category === state.categoryFilter;
      const searchable = [snippet.title, snippet.body, snippet.category, ...(snippet.tags || [])]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !state.searchText || searchable.includes(state.searchText);
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const aUsed = a.lastUsedAt ? Date.parse(a.lastUsedAt) : 0;
      const bUsed = b.lastUsedAt ? Date.parse(b.lastUsedAt) : 0;
      return bUsed - aUsed || Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0);
    });
}

function getCategories() {
  return Array.from(
    new Set([
      ...DEFAULT_CATEGORIES,
      ...state.snippets.map((snippet) => snippet.category || "General")
    ])
  ).sort((a, b) => a.localeCompare(b));
}

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeCategory(value) {
  const normalized = value.trim();
  return normalized || "General";
}

function updateCharacterCounter() {
  const count = elements.bodyInput.value.length;
  elements.charCounter.textContent = `${count} / ${MAX_SNIPPET_LENGTH}`;
  elements.charCounter.classList.toggle("is-warning", count >= 450 && count <= MAX_SNIPPET_LENGTH);
  elements.charCounter.classList.toggle("is-danger", count > MAX_SNIPPET_LENGTH);
}

function resetForm(options = {}) {
  state.editingId = null;
  elements.editorTitle.textContent = "Create snippet";
  elements.saveButton.textContent = "Save snippet";
  elements.cancelEditButton.classList.add("hidden");
  elements.snippetForm.reset();
  updateCharacterCounter();

  if (!options.keepMessage) {
    showFormMessage("");
  }
}

function showFormMessage(message, isError = false) {
  elements.formMessage.textContent = message;
  elements.formMessage.classList.toggle("is-error", isError);
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `snippet-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function exportSnippets() {
  const payload = {
    app: "Chrome Snipz",
    version: "0.1.0",
    exportedAt: new Date().toISOString(),
    snippets: state.snippets
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `chrome-snipz-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importSnippets(event) {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const fileText = await file.text();
    const parsed = JSON.parse(fileText);
    const importedSnippets = Array.isArray(parsed) ? parsed : parsed.snippets;

    if (!Array.isArray(importedSnippets)) {
      throw new Error("Invalid import format.");
    }

    const normalizedSnippets = importedSnippets.map(normalizeImportedSnippet).filter(Boolean);
    const existingIds = new Set(state.snippets.map((snippet) => snippet.id));
    const uniqueImports = normalizedSnippets.map((snippet) => {
      if (existingIds.has(snippet.id)) {
        return { ...snippet, id: createId() };
      }
      return snippet;
    });

    state.snippets = [...uniqueImports, ...state.snippets];
    await persistSnippets();
    render();
    showFormMessage(`Imported ${uniqueImports.length} snippet${uniqueImports.length === 1 ? "" : "s"}.`);
  } catch (error) {
    console.error(error);
    showFormMessage("Import failed. Use a valid Chrome Snipz JSON file.", true);
  } finally {
    elements.importFileInput.value = "";
  }
}

function normalizeImportedSnippet(snippet) {
  if (!snippet || typeof snippet !== "object") return null;

  const title = String(snippet.title || "Untitled snippet").trim().slice(0, 80);
  const body = String(snippet.body || "").trim().slice(0, MAX_SNIPPET_LENGTH);

  if (!body) return null;

  const now = new Date().toISOString();

  return {
    id: typeof snippet.id === "string" && snippet.id ? snippet.id : createId(),
    title,
    category: normalizeCategory(String(snippet.category || "General")).slice(0, 40),
    tags: Array.isArray(snippet.tags)
      ? snippet.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean).slice(0, 8)
      : [],
    body,
    usageCount: Number(snippet.usageCount || 0),
    createdAt: snippet.createdAt || now,
    updatedAt: snippet.updatedAt || now,
    lastUsedAt: snippet.lastUsedAt || null
  };
}
