import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
  "https://yswoqzcipvkpbrqqbucu.supabase.co";

// Use the same publishable key as auth.js.
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_WvvZJk6SDYdV7_foZotolg_FtpGXx9f";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


const form = document.getElementById("articleForm");
const publishButton = document.querySelector(".publish-button");
const securityNote = document.querySelector(".security-note");

let adminVerified = false;

async function checkAdminAccess() {
  securityNote.textContent = "Checking administrator access...";
  publishButton.disabled = true;

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    window.location.replace("auth.html");
    return;
  }

  if (data.user.app_metadata?.role !== "admin") {
    document.body.replaceChildren();

    const message = document.createElement("p");
    message.textContent =
      "Access denied. Administrator permission is required.";
    message.style.cssText =
      "margin:60px auto;max-width:600px;padding:24px;" +
      "font-family:sans-serif;text-align:center;";

    document.body.appendChild(message);
    return;
  }

  adminVerified = true;
  publishButton.disabled = false;
  securityNote.textContent =
    "Administrator recognised. You can now save articles.";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!adminVerified) {
    securityNote.textContent =
      "Administrator verification is required.";
    return;
  }

  const title = document.getElementById("title").value.trim();
  const slug = document.getElementById("slug").value.trim();
  const category = document.getElementById("category").value.trim();
  const summary = document.getElementById("summary").value.trim();
  const content = document.getElementById("content").value.trim();
  const isPremium =
    document.getElementById("accessType").value === "true";
  const published =
    document.getElementById("publicationStatus").value === "published";

  if (!title || !slug || !category || !summary || !content) {
    securityNote.textContent =
      "Please complete all article fields before saving.";
    return;
  }

  const cleanSlug = slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  publishButton.disabled = true;
  publishButton.textContent = "Saving article...";
  securityNote.textContent = "Sending your article to the library...";

  try {
    const { error } = await supabase
      .from("articles")
      .insert({
        title,
        slug: cleanSlug,
        category,
        summary,
        content,
        is_premium: isPremium,
        published
      });

    if (error) {
      throw error;
    }

    securityNote.textContent = published
      ? "Article saved and published successfully!"
      : "Draft saved successfully! It is not visible to members yet.";

    form.reset();
  } catch (error) {
    console.error("Article save error:", error);
    securityNote.textContent =
      "Could not save article: " + error.message;
  } finally {
    publishButton.disabled = !adminVerified;
    publishButton.textContent = "Save Article";
  }
});

checkAdminAccess();
