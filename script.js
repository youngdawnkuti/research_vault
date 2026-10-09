
const filters = document.querySelectorAll(".filter");
const articles = document.querySelectorAll(".article-card");
const notice = document.querySelector("#notice");

function showNotice(message) {
  notice.textContent = message;
  notice.hidden = false;
  notice.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.filter;

    filters.forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    articles.forEach((article) => {
      const matches =
        selected === "all" ||
        article.dataset.type === selected;

      article.hidden = !matches;
    });

    notice.hidden = true;
  });
});

document.querySelectorAll(".read-link").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.article === "free") {
      showNotice(
        "Your free sample will appear here. Next, we will add the full article."
      );
    } else {
      showNotice(
        "Premium access is not enabled yet. Create your account and membership system in the next stage."
      );
    }
  });
});

document.querySelector("#loginBtn").addEventListener("click", () => {
  showNotice(
    "Member login is coming in the next stage of development."
  );
});

document.querySelectorAll(".purchase-btn").forEach((button) => {
  button.addEventListener("click", () => {
    showNotice(
      "Payments are not connected yet. No payment has been taken."
    );
  });
});