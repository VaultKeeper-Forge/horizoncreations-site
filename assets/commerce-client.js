const commerceMode = document.body.dataset.commerceMode;
const commerceApi = document.body.dataset.commerceApi;

function setStatus(control, message) {
  const status = control.querySelector("[data-commerce-status]");
  if (status) status.textContent = message;
}

document.querySelectorAll("[data-commerce-control]").forEach((control) => {
  const button = control.querySelector("[data-commerce-add]");
  if (!(button instanceof HTMLButtonElement) || commerceMode !== "mock") return;

  button.addEventListener("click", async () => {
    const productId = button.dataset.productId;
    if (!productId || !commerceApi) return;
    button.disabled = true;
    setStatus(control, "Creating a private mock cart…");
    try {
      const response = await fetch(`${commerceApi}/api/v1/storefront/cart`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Mock cart could not be created.");
      setStatus(control, `Mock cart ${data.cart.id} created. No payment, shipping purchase, or public checkout is active.`);
    } catch (error) {
      setStatus(control, error instanceof Error ? error.message : "Mock cart could not be created.");
    } finally {
      button.disabled = false;
    }
  });
});
