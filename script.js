/*
 * Добавляйте места в массив PLACES ниже.
 * Координаты указываются в формате [широта, долгота].
 * Фото можно положить в папку photos/ репозитория и указать, например:
 * photos/my-place-1.jpg
 */
const PLACES = [
  {
    title: "Набережная Оби",
    coordinates: [61.2456, 73.3962],
    description: "Демонстрационная метка. Замените координаты, описание и фото на свои.",
    photos: [
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=700&q=80"
    ]
  },
  {
    title: "Место — пример",
    coordinates: [61.2535, 73.4050],
    description: "Вторая демонстрационная метка. Можно удалить или заменить.",
    photos: [
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=700&q=80"
    ]
  },
  {
    title: "Новая метка",
    coordinates: [61.261566, 73.187978],
    description: "Место по заданным координатам.",
    photos: ["P1281853.jpg"]
  }
];

// Центр карты — Сургут. Карту можно двигать мышью или пальцем и менять масштаб.
const map = L.map("map", {
  zoomControl: true,
  scrollWheelZoom: true
}).setView([61.25, 73.40], 12);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  minZoom: 3,
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function popupContent(place) {
  const photos = Array.isArray(place.photos) ? place.photos : [];
  const gallery = photos.length
    ? '<div class="gallery">' + photos.map((src, index) =>
        '<img loading="lazy" src="' + escapeHtml(src) + '" alt="' +
        escapeHtml(place.title + " — фото " + (index + 1)) + '">'
      ).join("") + "</div>"
    : '<div class="no-photos">Фото пока не добавлены.</div>';

  return '<div class="place-popup"><h3>' + escapeHtml(place.title) +
    '</h3><p>' + escapeHtml(place.description || "") + '</p>' + gallery + '</div>';
}

PLACES.forEach(place => {
  if (!Array.isArray(place.coordinates) || place.coordinates.length !== 2 ||
      !Number.isFinite(place.coordinates[0]) || !Number.isFinite(place.coordinates[1])) {
    console.warn("Пропущена метка с неверными координатами:", place);
    return;
  }

  L.marker(place.coordinates)
    .addTo(map)
    .bindPopup(popupContent(place), { maxWidth: 280 });
});


// Полноэкранный просмотр фото: нажмите на любое фото внутри окна метки.
const lightboxStyle = document.createElement("style");
lightboxStyle.textContent = `
  .place-popup .gallery img { cursor: zoom-in; }
  .photo-lightbox {
    position: fixed; inset: 0; z-index: 10000;
    display: flex; align-items: center; justify-content: center;
    padding: 48px 16px 16px; box-sizing: border-box;
    background: rgba(0, 0, 0, .94); cursor: zoom-out;
  }
  .photo-lightbox[hidden] { display: none; }
  .photo-lightbox img {
    display: block; max-width: 100%; max-height: 100%;
    width: auto; height: auto; object-fit: contain;
    cursor: default; box-shadow: 0 8px 40px rgba(0,0,0,.35);
  }
  .photo-lightbox-close {
    position: absolute; top: 10px; right: 14px;
    width: 44px; height: 44px; border: 0; border-radius: 50%;
    color: #fff; background: rgba(255,255,255,.16);
    font: 32px/1 sans-serif; cursor: pointer;
  }
  .photo-lightbox-close:focus-visible { outline: 2px solid white; outline-offset: 3px; }
`;
document.head.appendChild(lightboxStyle);

const lightbox = document.createElement("div");
lightbox.className = "photo-lightbox";
lightbox.hidden = true;
lightbox.setAttribute("role", "dialog");
lightbox.setAttribute("aria-modal", "true");
lightbox.setAttribute("aria-label", "Просмотр фотографии");
lightbox.innerHTML = '<button type="button" class="photo-lightbox-close" aria-label="Закрыть фото">×</button><img alt="">';
document.body.appendChild(lightbox);

const lightboxImage = lightbox.querySelector("img");
const closeLightbox = () => {
  lightbox.hidden = true;
  lightboxImage.removeAttribute("src");
};
lightbox.querySelector("button").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", event => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
});
document.addEventListener("click", event => {
  const thumbnail = event.target.closest(".place-popup .gallery img");
  if (!thumbnail) return;
  event.preventDefault();
  event.stopPropagation();
  lightboxImage.alt = thumbnail.alt || "Фотография";
  // Для удалённых Unsplash-фото просим более крупный размер; локальные фото не меняем.
  const source = thumbnail.getAttribute("src");
  lightboxImage.src = source && source.includes("images.unsplash.com/")
    ? source.replace(/([?&])w=700\b/, "$1w=2000")
    : source;
  lightbox.hidden = false;
  lightbox.querySelector("button").focus();
});
