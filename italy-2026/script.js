const filterButtons = document.querySelectorAll("[data-filter]");
const timelineItems = document.querySelectorAll(".timeline-item");
const copyButtons = document.querySelectorAll("[data-copy]");
const toast = document.querySelector("#toast");
const voucherInput = document.querySelector("#voucher-url");
const saveVoucherButton = document.querySelector("#save-voucher");
const openVoucherLink = document.querySelector("#open-voucher");
const removeVoucherButton = document.querySelector("#remove-voucher");
const voucherStatus = document.querySelector("#voucher-status");

const voucherStorageKey = "italy-2026-rental-voucher";

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((candidate) => {
      const isActive = candidate === button;
      candidate.classList.toggle("is-active", isActive);
      candidate.setAttribute("aria-pressed", String(isActive));
    });

    timelineItems.forEach((item) => {
      item.hidden = filter !== "all" && item.dataset.type !== filter;
    });
  });
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");

  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      showToast("Address copied");
    } catch {
      showToast("Copy unavailable on this browser");
    }
  });
});

function loadSavedItems(storageKey) {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) ?? {};
  } catch {
    return {};
  }
}

function setupChecklist({
  selector,
  itemKey,
  progressSelector,
  storageKey,
  progressLabel,
}) {
  const inputs = document.querySelectorAll(selector);
  const progress = document.querySelector(progressSelector);
  const savedItems = loadSavedItems(storageKey);

  function updateProgress() {
    const completed = [...inputs].filter((input) => input.checked).length;
    progress.textContent = `${completed} of ${inputs.length} ${progressLabel}`;
  }

  inputs.forEach((input) => {
    input.checked = Boolean(savedItems[input.dataset[itemKey]]);

    input.addEventListener("change", () => {
      const items = loadSavedItems(storageKey);
      items[input.dataset[itemKey]] = input.checked;
      localStorage.setItem(storageKey, JSON.stringify(items));
      updateProgress();
    });
  });

  updateProgress();
}

function updateVoucherControls() {
  const savedUrl = localStorage.getItem(voucherStorageKey);
  const hasVoucher = Boolean(savedUrl);

  openVoucherLink.hidden = !hasVoucher;
  removeVoucherButton.hidden = !hasVoucher;
  voucherStatus.textContent = hasVoucher
    ? "Private voucher link saved on this device."
    : "No private voucher link saved on this device.";

  if (hasVoucher) {
    openVoucherLink.href = savedUrl;
  } else {
    openVoucherLink.removeAttribute("href");
  }
}

saveVoucherButton.addEventListener("click", () => {
  const voucherUrl = voucherInput.value.trim();

  try {
    const parsedUrl = new URL(voucherUrl);
    const isBookingVoucher =
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname === "cars.booking.com" &&
      parsedUrl.pathname.startsWith("/voucher/");

    if (!isBookingVoucher) {
      throw new Error("Invalid voucher URL");
    }

    localStorage.setItem(voucherStorageKey, parsedUrl.href);
    voucherInput.value = "";
    updateVoucherControls();
    showToast("Private voucher link saved");
  } catch {
    showToast("Paste a valid Booking.com car voucher URL");
  }
});

removeVoucherButton.addEventListener("click", () => {
  localStorage.removeItem(voucherStorageKey);
  updateVoucherControls();
  showToast("Private voucher link removed");
});

filterButtons.forEach((button) => {
  button.setAttribute(
    "aria-pressed",
    String(button.classList.contains("is-active")),
  );
});

setupChecklist({
  selector: "[data-task]",
  itemKey: "task",
  progressSelector: "#decision-progress",
  storageKey: "italy-2026-decisions",
  progressLabel: "resolved",
});

setupChecklist({
  selector: "[data-packing]",
  itemKey: "packing",
  progressSelector: "#packing-progress",
  storageKey: "italy-2026-packing",
  progressLabel: "packed",
});

updateVoucherControls();
