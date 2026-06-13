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

const galleryData = {
  varenna: {
    title: "Varenna",
    images: [
      {
        src: "assets/italy/varenna-1.webp",
        alt: "Varenna and Lake Como seen from above",
        label: "Lakefront panorama",
        credit: "Diego Delso",
        license: "CC BY-SA 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Vista_de_Varenna,_lago_de_Como,_Italia,_2016-06-25,_DD_10.jpg",
      },
      {
        src: "assets/italy/varenna-2.webp",
        alt: "The old harbour and waterfront houses in Varenna",
        label: "Old harbour",
        credit: "AronMSzabo",
        license: "CC BY-SA 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Vecchio_Porto,_Varenna,_Italia.jpg",
      },
      {
        src: "assets/italy/varenna-3.webp",
        alt: "A quiet bay with boats and hillside houses in Varenna",
        label: "Quiet bay",
        credit: "Ashley Pomeroy",
        license: "CC BY-SA 3.0",
        source: "https://commons.wikimedia.org/wiki/File:Varenna_9831.jpg",
      },
    ],
  },
  bellagio: {
    title: "Bellagio",
    images: [
      {
        src: "assets/italy/bellagio-1.webp",
        alt: "Bellagio seen across Lake Como from the water",
        label: "Approach by ferry",
        credit: "Ray Swi-hymn",
        license: "CC BY-SA 2.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Town_of_Bellagio_(Lake_Como)_seen_from_the_lake_(36722979021).jpg",
      },
      {
        src: "assets/italy/bellagio-2.webp",
        alt: "Villa Melzi gardens on the shore at Bellagio",
        label: "Villa Melzi gardens",
        credit: "Ray in Manila",
        license: "CC BY 2.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Villa_Melzi,_Bellagio,_Lake_Como.jpg",
      },
      {
        src: "assets/italy/bellagio-3.webp",
        alt: "Wide Lake Como panorama toward Bellagio",
        label: "Lake panorama",
        credit: "Daniel Case",
        license: "CC BY-SA 3.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Bellagio_panorama_from_Lake_Como_ferry.jpg",
      },
    ],
  },
  nesso: {
    title: "Orrido di Nesso",
    images: [
      {
        src: "assets/italy/nesso-1.webp",
        alt: "Waterfall dropping through the narrow Orrido di Nesso gorge",
        label: "Waterfall gorge",
        credit: "Ysogo",
        license: "CC BY-SA 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Orrido_di_Nesso_dal_ponte_Civera_-_2.jpg",
      },
      {
        src: "assets/italy/nesso-2.webp",
        alt: "Rock pools and rushing water inside Orrido di Nesso",
        label: "Inside the gorge",
        credit: "Fausto Zambra",
        license: "CC BY-SA 4.0",
        source: "https://commons.wikimedia.org/wiki/File:Nesso_orrido.jpg",
      },
      {
        src: "assets/italy/nesso-3.webp",
        alt: "Orrido di Nesso waterfall beside the village houses",
        label: "Village waterfall",
        credit: "Civvì",
        license: "CC BY-SA 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Orrido_di_Nesso_04.jpg",
      },
    ],
  },
  balbianello: {
    title: "Villa del Balbianello",
    images: [
      {
        src: "assets/italy/balbianello-1.webp",
        alt: "Villa del Balbianello on its wooded Lake Como peninsula",
        label: "Wooded peninsula",
        credit: "Jeroen Komen",
        license: "CC BY-SA 2.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Villa_del_Balbianello_Lago_di_Como_featured_in_Casino_Royale_and_in_Star_Wars_(20063743160).jpg",
      },
      {
        src: "assets/italy/balbianello-2.webp",
        alt: "Lake view through the subtropical gardens at Villa del Balbianello",
        label: "Terraced gardens",
        credit: "Phyrexian",
        license: "CC BY-SA 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Lenno_-_Villa_del_Balbianello_0592.JPG",
      },
      {
        src: "assets/italy/balbianello-3.webp",
        alt: "Villa del Balbianello and its terraces seen from Lake Como",
        label: "Arrival from the lake",
        credit: "FAI",
        license: "CC BY-SA 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Vista_dal_lago_su_Villa_del_Balbianello,_Bene_FAI_sul_Lago_di_Como.jpg",
      },
    ],
  },
  portofino: {
    title: "Portofino",
    images: [
      {
        src: "assets/italy/portofino-1.webp",
        alt: "Colorful houses and boats around Portofino harbour",
        label: "Piazzetta harbour",
        credit: "Pierre-Selim Huard",
        license: "CC BY 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Portofino_-_2016-06-02_-_Harbor.jpg",
      },
      {
        src: "assets/italy/portofino-2.webp",
        alt: "Portofino harbour seen from the path above town",
        label: "Castello Brown view",
        credit: "Zinnmann",
        license: "CC BY-SA 3.0",
        source:
          "https://commons.wikimedia.org/wiki/File:20190502_Portofino_Panorama_zm.jpg",
      },
      {
        src: "assets/italy/portofino-3.webp",
        alt: "Portofino bay and village seen from high above",
        label: "Harbour from above",
        credit: "Quintin Soloviev",
        license: "CC BY-SA 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Portofino_view_from_above_(Quintin_Soloviev).jpg",
      },
    ],
  },
  camogli: {
    title: "Camogli",
    images: [
      {
        src: "assets/italy/camogli-1.webp",
        alt: "Camogli's painted seafront houses and basilica",
        label: "Painted seafront",
        credit: "Golden",
        license: "CC BY 4.0",
        source: "https://commons.wikimedia.org/wiki/File:View_of_Camogli.jpg",
      },
      {
        src: "assets/italy/camogli-2.webp",
        alt: "Camogli beach promenade and tall waterfront houses",
        label: "Beach promenade",
        credit: "Alessio Sbarbaro",
        license: "CC BY-SA 3.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Camogli_panorama_12.jpg",
      },
      {
        src: "assets/italy/camogli-3.webp",
        alt: "Curving Camogli beach viewed from the church and castle",
        label: "View from Dragonara",
        credit: "Angelo G. Valle",
        license: "CC BY-SA 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Camogli_veduta_dalla_chiesa_ott_2022.jpg",
      },
    ],
  },
  riviera: {
    title: "San Fruttuoso and Santa Margherita",
    images: [
      {
        src: "assets/italy/riviera-1.webp",
        alt: "Turquoise water and the small beach at San Fruttuoso",
        label: "San Fruttuoso bay",
        credit: "Tigulliotrekking",
        license: "CC BY-SA 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:San_fruttuoso_di_camogli.jpg",
      },
      {
        src: "assets/italy/riviera-2.webp",
        alt: "Stone cloister of San Fruttuoso Abbey and Doria tower",
        label: "Abbey cloister",
        credit: "EdoBoo",
        license: "CC BY-SA 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Abbazia_di_San_Fruttuoso_e_Torre_Doria.jpg",
      },
      {
        src: "assets/italy/riviera-3.webp",
        alt: "Aerial view of Santa Margherita Ligure and its harbour",
        label: "Santa Margherita",
        credit: "Quintin Soloviev",
        license: "CC BY 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Santa_Margherita_Ligure,_Italy.jpg",
      },
    ],
  },
  mountains: {
    title: "Valtellina and Bernina",
    images: [
      {
        src: "assets/italy/mountains-1.webp",
        alt: "Terraced Valtellina vineyards above the Adda valley",
        label: "Valtellina vineyards",
        credit: "Franco Folini",
        license: "CC BY-SA 2.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Valtellina,_Italy_vineyard.jpg",
      },
      {
        src: "assets/italy/mountains-2.webp",
        alt: "Tirano and the surrounding mountain valley at sunrise",
        label: "Tirano valley",
        credit: "Gabrielle Merk",
        license: "CC BY-SA 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Tirano-Panorama.jpg",
      },
      {
        src: "assets/italy/mountains-3.webp",
        alt: "Bernina Express beside Lago Bianco in the high Alps",
        label: "Bernina at Lago Bianco",
        credit: "David Gubler",
        license: "CC BY-SA 3.0",
        source:
          "https://commons.wikimedia.org/wiki/File:RhB_ABe_4-4_III_mit_Bernina-Express_am_Lago_Bianco.jpg",
      },
    ],
  },
};

function createDestinationGallery(mount, gallery) {
  const figure = document.createElement("figure");
  const toolbar = document.createElement("div");
  const kicker = document.createElement("span");
  const controls = document.createElement("div");
  const previousButton = document.createElement("button");
  const count = document.createElement("span");
  const nextButton = document.createElement("button");
  const track = document.createElement("div");
  const credits = document.createElement("figcaption");

  figure.className = "destination-gallery";
  figure.setAttribute("aria-label", `${gallery.title} photo carousel`);
  figure.setAttribute("aria-roledescription", "carousel");

  toolbar.className = "gallery-toolbar";
  kicker.className = "gallery-kicker";
  kicker.textContent = "Destination preview";

  controls.className = "gallery-controls";
  previousButton.className = "gallery-button";
  previousButton.type = "button";
  previousButton.setAttribute("aria-label", "Previous photo");
  previousButton.textContent = "←";
  count.className = "gallery-count";
  count.setAttribute("aria-live", "polite");
  nextButton.className = "gallery-button";
  nextButton.type = "button";
  nextButton.setAttribute("aria-label", "Next photo");
  nextButton.textContent = "→";
  controls.append(previousButton, count, nextButton);
  toolbar.append(kicker, controls);

  track.className = "gallery-track";
  track.tabIndex = 0;

  gallery.images.forEach((image, index) => {
    const slide = document.createElement("a");
    const picture = document.createElement("img");
    const label = document.createElement("span");

    slide.className = "gallery-slide";
    slide.href = image.source;
    slide.target = "_blank";
    slide.rel = "noreferrer";
    slide.setAttribute(
      "aria-label",
      `${index + 1} of ${gallery.images.length}: ${image.label}`,
    );

    picture.src = image.src;
    picture.alt = image.alt;
    picture.loading = "lazy";
    picture.decoding = "async";
    picture.width = 640;
    picture.height = 400;
    label.textContent = image.label;
    slide.append(picture, label);
    track.append(slide);
  });

  credits.className = "photo-credits";
  credits.append("Photos: ");
  gallery.images.forEach((image, index) => {
    const link = document.createElement("a");
    link.href = image.source;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = `${image.credit} (${image.license})`;
    credits.append(link);
    if (index < gallery.images.length - 1) {
      credits.append(" · ");
    }
  });

  figure.append(toolbar, track, credits);
  mount.replaceWith(figure);

  const slides = [...track.querySelectorAll(".gallery-slide")];
  let activeIndex = 0;
  let updateFrame;

  function updateControls() {
    activeIndex = slides.reduce((closest, slide, index) => {
      const currentOffset = slide.offsetLeft - track.offsetLeft;
      const closestOffset = slides[closest].offsetLeft - track.offsetLeft;
      const currentDistance = Math.abs(currentOffset - track.scrollLeft);
      const closestDistance = Math.abs(
        closestOffset - track.scrollLeft,
      );
      return currentDistance < closestDistance ? index : closest;
    }, 0);

    count.textContent = `${activeIndex + 1} / ${slides.length}`;
    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === slides.length - 1;
  }

  function goToSlide(index) {
    const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
    track.scrollTo({
      left: slides[nextIndex].offsetLeft - track.offsetLeft,
      behavior: "smooth",
    });
  }

  previousButton.addEventListener("click", () => goToSlide(activeIndex - 1));
  nextButton.addEventListener("click", () => goToSlide(activeIndex + 1));

  track.addEventListener(
    "scroll",
    () => {
      window.cancelAnimationFrame(updateFrame);
      updateFrame = window.requestAnimationFrame(updateControls);
    },
    { passive: true },
  );

  track.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToSlide(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToSlide(activeIndex + 1);
    }
  });

  updateControls();
}

document.querySelectorAll("[data-gallery]").forEach((mount) => {
  const gallery = galleryData[mount.dataset.gallery];
  if (gallery) {
    createDestinationGallery(mount, gallery);
  }
});

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

const checkinButton = document.querySelector("#checkin-48");
const checkinCountdown = document.querySelector("#checkin-countdown");

// Wizz Air online check-in opens exactly 48h before departure:
// flight W4 3671 leaves Iași on 20 Jun 2026 at 06:00 (EEST, UTC+3).
const checkinOpensAt = new Date("2026-06-18T06:00:00+03:00").getTime();

function updateCheckinButton() {
  const remaining = checkinOpensAt - Date.now();

  if (remaining <= 0) {
    checkinButton.classList.add("is-live");
    checkinButton.removeAttribute("aria-disabled");
    checkinCountdown.textContent = "Check in now ✈";
    return;
  }

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  checkinCountdown.textContent =
    days > 0
      ? `48h · opens in ${days}d ${hours}h ${minutes}m`
      : `48h · opens in ${hours}h ${minutes}m`;

  window.setTimeout(updateCheckinButton, 30000);
}

if (checkinButton && checkinCountdown) {
  updateCheckinButton();
}

setupChecklist({
  selector: "[data-packing]",
  itemKey: "packing",
  progressSelector: "#packing-progress",
  storageKey: "italy-2026-packing",
  progressLabel: "packed",
});

updateVoucherControls();
