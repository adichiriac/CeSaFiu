const filterButtons = document.querySelectorAll("[data-filter]");
const propertyCards = document.querySelectorAll(".property-card");
const galleryButtons = document.querySelectorAll("[data-image]");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = lightbox?.querySelector("img");
const lightboxCaption = lightbox?.querySelector("p");
const lightboxClose = lightbox?.querySelector(".lightbox-close");
const rankingList = document.querySelector(".ranking-list");
const rankingRows = [...document.querySelectorAll(".ranking-row")];
const weightInputs = [...document.querySelectorAll("[data-weight]")];
const weightTotal = document.querySelector("[data-weight-total]");
const resetWeights = document.querySelector("[data-reset-weights]");
const defaultWeights = Object.fromEntries(
  weightInputs.map((input) => [input.dataset.weight, Number(input.value)]),
);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((candidate) => {
      candidate.classList.toggle("is-active", candidate === button);
    });

    propertyCards.forEach((card) => {
      const tags = card.dataset.tags?.split(" ") ?? [];
      card.hidden = filter !== "all" && !tags.includes(filter);
    });
  });
});

function updateRanking() {
  if (!rankingList || weightInputs.length === 0) {
    return;
  }

  const weights = Object.fromEntries(
    weightInputs.map((input) => [input.dataset.weight, Number(input.value)]),
  );
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  weightInputs.forEach((input) => {
    const output = document.querySelector(
      `[data-weight-output="${input.dataset.weight}"]`,
    );

    if (output) {
      output.textContent = input.value;
    }
  });

  if (weightTotal) {
    weightTotal.textContent = String(total);
  }

  const rankedRows = rankingRows
    .map((row, originalIndex) => {
      const weightedTotal = Object.entries(weights).reduce(
        (sum, [criterion, weight]) =>
          sum + Number(row.dataset[criterion]) * weight,
        0,
      );
      const score = total === 0 ? 0 : Number((weightedTotal / total).toFixed(1));

      return { row, originalIndex, score };
    })
    .sort((first, second) => {
      return second.score - first.score || first.originalIndex - second.originalIndex;
    });

  rankedRows.forEach(({ row, score }, index) => {
    row.querySelector(".ranking-position").textContent = String(index + 1);
    row.querySelector(".ranking-score").textContent = score
      .toFixed(1)
      .replace(".", ",");
    rankingList.append(row);

    const propertyId = row.dataset.property;
    const rankPill = document.querySelector(`#${propertyId} .rank-pill`);

    if (rankPill) {
      rankPill.textContent = `Locul ${index + 1}`;
    }
  });
}

weightInputs.forEach((input) => {
  input.addEventListener("input", updateRanking);
});

resetWeights?.addEventListener("click", () => {
  weightInputs.forEach((input) => {
    input.value = String(defaultWeights[input.dataset.weight]);
  });
  updateRanking();
});

function closeLightbox() {
  if (!lightbox?.open) {
    return;
  }

  lightbox.close();
  document.body.classList.remove("lightbox-open");
}

galleryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!lightbox || !lightboxImage || !lightboxCaption) {
      return;
    }

    lightboxImage.src = button.dataset.image ?? "";
    lightboxImage.alt = button.dataset.alt ?? "";
    lightboxCaption.textContent = button.dataset.alt ?? "";
    lightbox.showModal();
    document.body.classList.add("lightbox-open");
  });
});

lightboxClose?.addEventListener("click", closeLightbox);

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

lightbox?.addEventListener("close", () => {
  document.body.classList.remove("lightbox-open");
});

updateRanking();
