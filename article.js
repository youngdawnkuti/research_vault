
import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
  "https://yswoqzcipvkpbrqqbucu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_WvvZJk6SDYd7_foZotolg_FtpGXx9f";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const articleMessage = document.getElementById("articleMessage");
const articleContent = document.getElementById("articleContent");
const articleBody = document.getElementById("articleBody");

const subtopicSelect = document.getElementById("subtopicSelect");
const readingProgress = document.getElementById("readingProgress");
const lockMessage = document.getElementById("subtopicLockMessage");
const previousButton = document.getElementById("previousSubtopic");
const nextButton = document.getElementById("nextSubtopic");

let subtopics = [];
let currentIndex = 0;

async function loadArticle() {
  const slug = new URLSearchParams(
    window.location.search
  ).get("slug");

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

  // Load only the article's public metadata.
  // Do not fetch the legacy full content field here.
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id, title, slug, summary, category, is_premium, published")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (articleError || !article) {
    console.error("Article loading error:", articleError);
    articleMessage.textContent =
      "This article is unavailable or could not be loaded.";
    return;
  }

  document.getElementById("articleTitle").textContent =
    article.title;

  document.getElementById("articleCategory").textContent =
    article.category || "Research";

  document.getElementById("articleSummary").textContent =
    article.summary || "";

  document.getElementById("articleAccess").textContent =
    article.is_premium ? "Premium Research" : "Free Research";

  document.title = article.title + " | The Research Vault";

  // Retrieve content through the controlled database function.
  const { data: results, error: subtopicError } = await supabase
    .rpc("get_research_subtopics", {
      p_article_id: article.id
    });

  if (subtopicError) {
    console.error("Subtopic loading error:", subtopicError);
    articleMessage.textContent =
      "We couldn't load the research contents. Please try again.";
    return;
  }

  subtopics = results || [];

  if (subtopics.length === 0) {
    articleMessage.textContent =
      "Subtopics have not been added to this research yet.";
    return;
  }

  subtopicSelect.innerHTML = "";

  subtopics.forEach((subtopic, index) => {
    const option = document.createElement("option");
    option.value = String(index);

    if (subtopic.access_level === "locked") {
      option.textContent = `${index + 1}. ${subtopic.title} 🔒`;
    } else {
      option.textContent = `${index + 1}. ${subtopic.title}`;
    }

    subtopicSelect.appendChild(option);
  });

  articleMessage.hidden = true;
  articleContent.hidden = false;

  showSubtopic(0);
}

function showSubtopic(index) {
  if (index < 0 || index >= subtopics.length) return;

  currentIndex = index;

  const subtopic = subtopics[index];
  const isLocked = subtopic.access_level === "locked";

  subtopicSelect.value = String(index);

  readingProgress.textContent =
    `Subtopic ${index + 1} of ${subtopics.length}`;

  lockMessage.hidden = !isLocked;
  articleBody.hidden = isLocked;

  if (isLocked) {
    articleBody.textContent = "";
  } else {
    articleBody.textContent = subtopic.content || "";
  }

  previousButton.disabled = index === 0;
  nextButton.disabled = index === subtopics.length - 1;
}

subtopicSelect.addEventListener("change", () => {
  const index = Number(subtopicSelect.value);

  if (Number.isInteger(index)) {
    showSubtopic(index);
  }
});

previousButton.addEventListener("click", () => {
  showSubtopic(currentIndex - 1);
});

nextButton.addEventListener("click", () => {
  showSubtopic(currentIndex + 1);
});

loadArticle();
