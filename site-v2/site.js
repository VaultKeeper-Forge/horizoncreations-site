const navToggle = document.querySelector("[data-nav-toggle]");
const navPanel = document.querySelector("[data-nav-panel]");

function setMenu(open) {
  if (!navToggle || !navPanel) return;
  navToggle.setAttribute("aria-expanded", String(open));
  navPanel.dataset.open = String(open);
  document.body.classList.toggle("menu-open", open);
}

navToggle?.addEventListener("click", () => {
  setMenu(navToggle.getAttribute("aria-expanded") !== "true");
});
navPanel?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

const revealItems = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.12 },
  );
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const dialog = document.querySelector("#image-viewer");
const dialogImage = dialog?.querySelector("img");
const dialogCaption = dialog?.querySelector("figcaption");
let lastLightboxTrigger = null;

document.querySelectorAll("[data-lightbox]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    if (!dialog || !dialogImage || !dialogCaption) return;
    lastLightboxTrigger = trigger;
    dialogImage.src = trigger.dataset.lightbox;
    dialogImage.alt = trigger.dataset.alt || "";
    dialogCaption.textContent = trigger.dataset.alt || "";
    dialog.showModal();
    document.body.classList.add("dialog-open");
  });
});

function closeDialog() {
  if (!dialog?.open) return;
  dialog.close();
}

dialog?.querySelector("[data-dialog-close]")?.addEventListener("click", closeDialog);
dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});
dialog?.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
  if (dialogImage) dialogImage.removeAttribute("src");
  lastLightboxTrigger?.focus();
});

const contextualBrief = document.querySelector("[data-contextual-brief]");
const params = new URLSearchParams(window.location.search);
const requestedPiece = params.get("piece");
if (contextualBrief && requestedPiece) {
  contextualBrief.hidden = false;
  contextualBrief.querySelector("strong").textContent = requestedPiece;
}

document.querySelector("[data-copy-brief]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const piece = requestedPiece || "a custom leather piece";
  const brief = `Hi Curtis — I’m reaching out about ${piece}. I’d like to use it for: [what it needs to do]. Approximate size: [size]. Color or visual direction: [notes]. Timing: [when you need it].`;
  try {
    await navigator.clipboard.writeText(brief);
    button.textContent = "Request brief copied";
  } catch {
    button.textContent = "Copy failed — select the template below";
  }
});
