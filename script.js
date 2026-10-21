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
