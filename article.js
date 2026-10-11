
import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
  "https://yswoqzcipvkpbrqqbucu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_WvvZJk6SDYdV7_foZotolg_FtpGXx9f";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const articleMessage = document.getElementById("articleMessage");
const articleContent = document.getElementById("articleContent");

async function loadArticle() {
  const slug = new URLSearchParams(window.location.search).get("slug");

  if (!slug) {
    articleMessage.textContent = "No article was selected.";
    return;
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.replace("auth.html");
    return;
  }

  const { data, error } = await supabase
    .from("articles")
    .select("title, slug, summary, category, is_premium, content")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("Article loading error:", error);
    articleMessage.textContent =
      "We couldn't load this article. Please try again.";
    return;
  }

  if (!data) {
    articleMessage.textContent =
      "This article is unavailable or your account does not have access to it.";
    return;
  }

  document.getElementById("articleTitle").textContent = data.title;
  document.getElementById("articleCategory").textContent =
    data.category || "Research";
  document.getElementById("articleSummary").textContent =
    data.summary || "";
  document.getElementById("articleAccess").textContent =
    data.is_premium ? "Premium" : "Free";
  document.getElementById("articleBody").textContent =
    data.content || "The full article has not been added yet.";

  document.title = data.title + " | The Research Vault";
  articleMessage.hidden = true;
  articleContent.hidden = false;
}

loadArticle();
