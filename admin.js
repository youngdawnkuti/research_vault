import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://yswoqzcipvkpbrqqbucu.supabase.co";
// Keep the same currently working publishable key used by auth.js.
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WvvZJk6SDYdV7_foZotolg_FtpGXx9f";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const form = $("articleForm");
const saveButton = $("saveArticle");
const securityNote = $("securityNote");
const managementList = $("articleManagementList");
const articleSearch = $("articleSearch");
const articleFilter = $("articleFilter");
const accessType = $("accessType");
const freeEditor = $("freeEditor");
const premiumEditor = $("premiumEditor");
const subtopicEditorList = $("subtopicEditorList");

let adminVerified = false;
let savedArticles = [];
let currentSubtopics = [];
let editingId = null;
let busy = false;

function setMessage(message, isError = false) {
  securityNote.textContent = message;
  securityNote.classList.toggle("error-note", isError);
}

function slugify(value) {
  return value.toLowerCase().trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function setBusy(value, label = "Save research") {
  busy = value;
  saveButton.disabled = value || !adminVerified;
  saveButton.textContent = value ? "Saving..." : label;
}

async function checkAdminAccess() {
  saveButton.disabled = true;
  setMessage("Checking administrator access...");
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    window.location.replace("auth.html");
    return;
  }

  if (data.user.app_metadata?.role !== "admin") {
    document.body.replaceChildren();
    const message = document.createElement("p");
    message.textContent = "Access denied. Administrator permission is required.";
    message.style.cssText = "margin:60px auto;max-width:600px;padding:24px;font-family:sans-serif;text-align:center;";
    document.body.appendChild(message);
    return;
  }

  adminVerified = true;
  saveButton.disabled = false;
  setMessage("Administrator verified. Your changes are saved to the research library.");
}

function updateFormat() {
  const isPremium = accessType.value === "true";
  freeEditor.hidden = isPremium;
  premiumEditor.hidden = !isPremium;
  $("content").required = !isPremium;
  if (isPremium) $("content").value = "";
}

function addSubtopicEditor(subtopic = {}) {
  const card = document.createElement("article");
  card.className = "subtopic-editor-card";

  const top = document.createElement("div");
  top.className = "subtopic-card-top";

  const heading = document.createElement("h4");
  heading.textContent = "Subtopic";

  const controls = document.createElement("div");
  controls.className = "subtopic-actions";

  const up = document.createElement("button");
  up.type = "button";
  up.className = "icon-button";
  up.textContent = "↑ Move up";
  up.setAttribute("aria-label", "Move subtopic up");

  const down = document.createElement("button");
  down.type = "button";
  down.className = "icon-button";
  down.textContent = "↓ Move down";
  down.setAttribute("aria-label", "Move subtopic down");

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "icon-button danger-button";
  remove.textContent = "Remove";

  controls.append(up, down, remove);
  top.append(heading, controls);

  const titleLabel = document.createElement("label");
  titleLabel.textContent = "Subtopic title";
  const title = document.createElement("input");
  title.type = "text";
  title.className = "subtopic-title";
  title.placeholder = "e.g. Choosing the Right Problem";
  title.required = true;
  title.value = subtopic.title || "";
  titleLabel.appendChild(title);

  const contentLabel = document.createElement("label");
  contentLabel.textContent = "Subtopic content";
  const content = document.createElement("textarea");
  content.className = "subtopic-content";
  content.rows = 8;
  content.placeholder = "Write this section of your research...";
  content.required = true;
  content.value = subtopic.content || "";
  contentLabel.appendChild(content);

  const idInput = document.createElement("input");
  idInput.type = "hidden";
  idInput.className = "subtopic-id";
  idInput.value = subtopic.id || "";

  card.append(top, titleLabel, title, contentLabel, content, idInput);
  subtopicEditorList.appendChild(card);

  up.addEventListener("click", () => {
    const previous = card.previousElementSibling;
    if (previous) subtopicEditorList.insertBefore(card, previous);
    refreshSubtopicLabels();
  });

  down.addEventListener("click", () => {
    const next = card.nextElementSibling;
    if (next) subtopicEditorList.insertBefore(next, card);
    refreshSubtopicLabels();
  });

  remove.addEventListener("click", () => {
    if (!confirm("Remove this subtopic when you save the research?")) return;
    card.remove();
    refreshSubtopicLabels();
  });

  refreshSubtopicLabels();
}

function refreshSubtopicLabels() {
  [...subtopicEditorList.querySelectorAll(".subtopic-editor-card")].forEach((card, index) => {
    card.querySelector("h4").textContent = `Subtopic ${index + 1}`;
    card.querySelector('[aria-label="Move subtopic up"]').disabled = index === 0;
    card.querySelector('[aria-label="Move subtopic down"]').disabled =
      index === subtopicEditorList.children.length - 1;
  });
}

function collectSubtopics() {
  return [...subtopicEditorList.querySelectorAll(".subtopic-editor-card")].map((card) => ({
    id: card.querySelector(".subtopic-id").value || null,
    title: card.querySelector(".subtopic-title").value.trim(),
    content: card.querySelector(".subtopic-content").value.trim()
  }));
}

function resetEditor() {
  form.reset();
  $("editingArticleId").value = "";
  editingId = null;
  currentSubtopics = [];
  subtopicEditorList.replaceChildren();
  $("editorHeading").textContent = "Create new research";
  $("editorBadge").textContent = "NEW ARTICLE";
  $("cancelEdit").hidden = true;
  accessType.value = "false";
  $("publicationStatus").value = "false";
  updateFormat();
  setBusy(false, "Save research");
}

async function loadArticles() {
  managementList.textContent = "Loading your research library...";
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, category, summary, is_premium, published, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    managementList.textContent = "Could not load research: " + error.message;
    return;
  }
  savedArticles = data || [];
  displayArticles();
}

function displayArticles() {
  const searchTerm = articleSearch.value.trim().toLowerCase();
  const filter = articleFilter.value;
  const filtered = savedArticles.filter((article) => {
    const searchable = `${article.title || ""} ${article.slug || ""} ${article.category || ""}`.toLowerCase();
    const matchesSearch = searchable.includes(searchTerm);
    const matchesFilter = filter === "all" ||
      (filter === "published" && article.published) ||
      (filter === "draft" && !article.published) ||
      (filter === "free" && !article.is_premium) ||
      (filter === "premium" && article.is_premium);
    return matchesSearch && matchesFilter;
  });

  managementList.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "security-note";
    empty.textContent = "No matching research found.";
    managementList.appendChild(empty);
    return;
  }

  filtered.forEach((article) => {
    const card = document.createElement("article");
    card.className = "managed-article-card";
    const heading = document.createElement("h3");
    heading.textContent = article.title;

    const meta = document.createElement("p");
    meta.className = "article-meta";
    meta.textContent = `${article.category || "General"} · ${article.is_premium ? "Premium research" : "Free research"} · ${article.published ? "Published" : "Draft"}`;

    const slug = document.createElement("p");
    slug.className = "article-slug";
    slug.textContent = `/${article.slug}`;

    const summary = document.createElement("p");
    summary.textContent = article.summary || "No summary provided.";

    const actions = document.createElement("div");
    actions.className = "card-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "secondary-button";
    edit.textContent = "Edit research";
    edit.addEventListener("click", () => editArticle(article.id));


const toggle = document.createElement("button");
toggle.type = "button";
toggle.className = "secondary-button";
toggle.textContent = article.published ? "Unpublish" : "Publish";
toggle.addEventListener("click", () => togglePublication(article));

const deleteButton = document.createElement("button");
deleteButton.type = "button";
deleteButton.className = "secondary-button danger-button";
deleteButton.textContent = "Delete research";
deleteButton.addEventListener("click", () => deleteArticle(article));

actions.append(edit, toggle, deleteButton);
card.append(heading, meta, slug, summary, actions);
    managementList.appendChild(card);
  });
}

async function editArticle(id) {
  setMessage("Loading research for editing...");
  const { data: article, error } = await supabase
    .from("articles")
    .select("id, title, slug, category, summary, content, is_premium, published")
    .eq("id", id)
    .single();

  if (error || !article) {
    setMessage("Could not open this research: " + (error?.message || "Article not found."), true);
    return;
  }

  editingId = article.id;
  $("editingArticleId").value = article.id;
  $("title").value = article.title || "";
  $("slug").value = article.slug || "";
  $("category").value = article.category || "Other";
  $("summary").value = article.summary || "";
  $("content").value = article.content || "";
  accessType.value = String(Boolean(article.is_premium));
  $("publicationStatus").value = String(Boolean(article.published));
  subtopicEditorList.replaceChildren();

  if (article.is_premium) {
    const { data: subtopics, error: subtopicError } = await supabase
      .from("article_subtopics")
      .select("id, title, content, position")
      .eq("article_id", article.id)
      .order("position", { ascending: true });

    if (subtopicError) {
      setMessage("Article opened, but subtopics could not load: " + subtopicError.message, true);
      return;
    }
    currentSubtopics = subtopics || [];
    currentSubtopics.forEach(addSubtopicEditor);
    if (!currentSubtopics.length) addSubtopicEditor();
  } else {
    currentSubtopics = [];
  }

  updateFormat();
  $("editorHeading").textContent = "Edit research";
  $("editorBadge").textContent = "EDITING";
  $("cancelEdit").hidden = false;
  setBusy(false, "Save changes");
  setMessage("Research loaded. Make your changes and save.");
  $("editorPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function togglePublication(article) {
  const next = !article.published;
  const action = next ? "publish" : "unpublish";
  if (!confirm(`Are you sure you want to ${action} "${article.title}"?`)) return;

  const { error } = await supabase
    .from("articles")
    .update({ published: next })
    .eq("id", article.id);

  if (error) {
    setMessage(`Could not ${action} research: ${error.message}`, true);
    return;
  }
  setMessage(next ? "Research published." : "Research unpublished.");
  await loadArticles();
}


async function deleteArticle(article) {
  const confirmed = confirm(
    `Permanently delete "${article.title}"?\n\n` +
    "This cannot be undone. Any premium subtopics belonging to this research will also be deleted."
  );

  if (!confirmed) return;

  setMessage("Deleting research...");

  try {
    // First try deleting the article directly.
    let result = await supabase
      .from("articles")
      .delete()
      .eq("id", article.id);

    // If a foreign-key constraint prevents deletion, remove
    // the associated premium subtopics and retry.
    if (result.error?.code === "23503") {
      const subtopicResult = await supabase
        .from("article_subtopics")
        .delete()
        .eq("article_id", article.id);

      if (subtopicResult.error) throw subtopicResult.error;

      result = await supabase
        .from("articles")
        .delete()
        .eq("id", article.id);
    }

    if (result.error) throw result.error;

    setMessage(`"${article.title}" was deleted successfully.`);
    await loadArticles();

  } catch (error) {
    console.error("Delete research error:", error);
    setMessage(
      "Could not delete research: " + error.message,
      true
    );
  }
}


async function saveSubtopics(articleId, submitted) {
  const existingIds = new Set(currentSubtopics.map((item) => item.id));
  const submittedIds = new Set(submitted.filter((item) => item.id).map((item) => item.id));

  // Delete only rows removed in the editor.
  const removedIds = [...existingIds].filter((id) => !submittedIds.has(id));
  if (removedIds.length) {
    const { error } = await supabase
      .from("article_subtopics")
      .delete()
      .in("id", removedIds);
    if (error) throw error;
  }

  for (let index = 0; index < submitted.length; index++) {
    const item = submitted[index];
    const row = {
      article_id: articleId,
      title: item.title,
      content: item.content,
      position: index + 1
    };

    let result;
    if (item.id) {
      result = await supabase
        .from("article_subtopics")
        .update(row)
        .eq("id", item.id)
        .eq("article_id", articleId);
    } else {
      result = await supabase.from("article_subtopics").insert(row);
    }
    if (result.error) throw result.error;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!adminVerified || busy) {
    setMessage("Administrator verification is required.", true);
    return;
  }

  const title = $("title").value.trim();
  const slug = slugify($("slug").value);
  const category = $("category").value.trim();
  const summary = $("summary").value.trim();
  const isPremium = accessType.value === "true";
  const published = $("publicationStatus").value === "true";
  const content = isPremium ? "" : $("content").value.trim();
  const subtopics = isPremium ? collectSubtopics() : [];

  if (!title || !slug || !category || !summary) {
    setMessage("Please complete the title, slug, category and summary.", true);
    return;
  }
  if (!isPremium && !content) {
    setMessage("Please write the full content for this free article.", true);
    return;
  }
  if (isPremium && subtopics.length === 0) {
    setMessage("Add at least one subtopic to premium research.", true);
    return;
  }
  if (isPremium && subtopics.some((item) => !item.title || !item.content)) {
    setMessage("Every premium subtopic needs a title and content.", true);
    return;
  }

  setBusy(true);
  setMessage("Saving research...");

  try {
    const articlePayload = {
      title, slug, category, summary, content,
      is_premium: isPremium,
      published
    };

    let articleId = editingId;
    if (editingId) {
      const { error } = await supabase.from("articles")
        .update(articlePayload).eq("id", editingId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("articles")
        .insert(articlePayload).select("id").single();
      if (error) throw error;
      articleId = data.id;
      editingId = articleId;
    }

    if (isPremium) {
      await saveSubtopics(articleId, subtopics);
    } else if (currentSubtopics.length) {
      const { error } = await supabase
        .from("article_subtopics")
        .delete()
        .eq("article_id", articleId);
      if (error) throw error;
    }

    setMessage(published ? "Research saved and published successfully." : "Draft saved successfully. It is not visible to members yet.");
    resetEditor();
    await loadArticles();
  } catch (error) {
    console.error("Research save error:", error);
    setMessage("Could not fully save research: " + error.message + ". Check the article and subtopic records before retrying.", true);
    setBusy(false, editingId ? "Save changes" : "Save research");
  }
});

$("makeSlug").addEventListener("click", () => {
  $("slug").value = slugify($("title").value);
});
$("title").addEventListener("blur", () => {
  if (!$("slug").value.trim()) $("slug").value = slugify($("title").value);
});
accessType.addEventListener("change", updateFormat);
$("addSubtopic").addEventListener("click", () => addSubtopicEditor());
$("cancelEdit").addEventListener("click", () => {
  resetEditor();
  setMessage("Editing cancelled. No changes were made.");
});
articleSearch.addEventListener("input", displayArticles);
articleFilter.addEventListener("change", displayArticles);

updateFormat();
checkAdminAccess().then(() => {
  if (adminVerified) loadArticles();
});
