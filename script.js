/*
 * Фото можно хранить в отдельных папках репозитория.
 * Для автоматической загрузки списка файлов используется публичный GitHub Contents API.
 * Папка spoon/ привязана к метке 61.241187, 73.39222.
 */
const REPO_OWNER = "VR3434";
const REPO_NAME = "maps";
const REPO_BRANCH = "fix/fullscreen-map-and-refresh";
const PHOTO_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif)$/i;

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
    title: "асфальт",
    coordinates: [61.261566, 73.187978],
    description: "место с асфальтом",
    photos: ["P1281853.JPG"]
  },
  {
    title: "Spoon",
    coordinates: [61.241187, 73.39222],
    description: "Фотографии автоматически загружаются из папки spoon.",
    photoFolder: "spoon"
  }
];

const map = L.map("map", { zoomControl: true, scrollWheelZoom: true })
  .setView([61.25, 73.40], 12);

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
  const initialPhotos = Array.isArray(place.photos) ? place.photos : [];
  const folderAttribute = place.photoFolder ? ' data-folder="' + escapeHtml(place.photoFolder) + '"' : "";
  const photosAttribute = ' data-photos="' + escapeHtml(JSON.stringify(initialPhotos)) + '"';
  return '<div class="place-popup"><h3>' + escapeHtml(place.title) +
    '</h3><p>' + escapeHtml(place.description || "") + '</p>' +
    '<div class="gallery" data-title="' + escapeHtml(place.title) + '"' +
    folderAttribute + photosAttribute + '><div class="no-photos">Загрузка фотографий…</div></div></div>';
}

async function listFolderPhotos(folder) {
  const url = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME +
    '/contents/' + folder.split("/").map(encodeURIComponent).join("/") +
    '?ref=' + encodeURIComponent(REPO_BRANCH);
  const response = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!response.ok) throw new Error("GitHub API вернул " + response.status);
  const files = await response.json();
  if (!Array.isArray(files)) return [];
  return files
    .filter(file => file.type === "file" && PHOTO_EXTENSIONS.test(file.name))
    .sort((a, b) => a.name.localeCompare(b.name, "ru", { numeric: true }))
    .map(file => file.download_url)
    .filter(Boolean);
}

function renderGallery(gallery, photos, title) {
  gallery.replaceChildren();
  if (!photos.length) {
    gallery.innerHTML = '<div class="no-photos">В папке пока нет фотографий JPG, PNG, GIF, WEBP или AVIF.</div>';
    return;
  }
  let current = 0;
  const frame = document.createElement("div");
  frame.className = "gallery-frame";
  const image = document.createElement("img");
  image.className = "gallery-current";
  image.alt = title + " — фото 1";
  image.loading = "lazy";
  image.addEventListener("click", () => openLightbox(photos, current, title));
  const prev = document.createElement("button");
  prev.type = "button"; prev.className = "gallery-arrow gallery-prev";
  prev.textContent = "‹"; prev.setAttribute("aria-label", "Предыдущее фото");
  const next = document.createElement("button");
  next.type = "button"; next.className = "gallery-arrow gallery-next";
  next.textContent = "›"; next.setAttribute("aria-label", "Следующее фото");
  const count = document.createElement("div");
  count.className = "gallery-count";
  function show(index) {
    current = (index + photos.length) % photos.length;
    image.src = photos[current];
    image.alt = title + " — фото " + (current + 1);
    count.textContent = (current + 1) + " / " + photos.length;
    const arrowsVisible = photos.length > 1;
    prev.hidden = !arrowsVisible;
    next.hidden = !arrowsVisible;
  }
  prev.addEventListener("click", event => { event.stopPropagation(); show(current - 1); });
  next.addEventListener("click", event => { event.stopPropagation(); show(current + 1); });
  frame.append(image, prev, next, count);
  gallery.append(frame);
  show(0);
}

const lightboxStyle = document.createElement("style");
lightboxStyle.textContent = `
  .place-popup .gallery { display: block; width: 100%; }
  .gallery-frame { position: relative; width: 100%; overflow: hidden; border-radius: 9px; background: #eef0f2; }
  .gallery-current { display: block; width: 100%; height: 160px; object-fit: cover; cursor: zoom-in; }
  .gallery-arrow, .lightbox-arrow {
    position: absolute; top: 50%; transform: translateY(-50%); z-index: 2;
    width: 34px; height: 42px; border: 0; border-radius: 9px;
    background: rgba(0,0,0,.58); color: white; font: 30px/1 sans-serif; cursor: pointer;
  }
  .gallery-prev { left: 6px; } .gallery-next { right: 6px; }
  .gallery-count { position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
    padding: 3px 8px; border-radius: 12px; background: #0009; color: white; font: 12px sans-serif; }
  .gallery-arrow[hidden], .lightbox-arrow[hidden] { display: none; }
  .photo-lightbox { position: fixed; inset: 0; z-index: 10000; display: flex;
    align-items: center; justify-content: center; padding: 54px 56px 28px;
    box-sizing: border-box; background: rgba(0,0,0,.95); }
  .photo-lightbox[hidden] { display: none; }
  .photo-lightbox img { display: block; max-width: 100%; max-height: 100%;
    width: auto; height: auto; object-fit: contain; }
  .photo-lightbox-close { position: absolute; top: 10px; right: 14px; z-index: 3;
    width: 44px; height: 44px; border: 0; border-radius: 50%; color: #fff;
    background: rgba(255,255,255,.16); font: 32px/1 sans-serif; cursor: pointer; }
  .lightbox-arrow { width: 46px; height: 58px; font-size: 42px; }
  .lightbox-prev { left: 10px; } .lightbox-next { right: 10px; }
  .lightbox-count { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
    color: white; background: #0009; border-radius: 14px; padding: 5px 10px; font: 14px sans-serif; }
  @media (max-width: 480px) {
    .photo-lightbox { padding-left: 44px; padding-right: 44px; }
    .lightbox-arrow { width: 34px; height: 48px; }
  }
`;
document.head.appendChild(lightboxStyle);

const lightbox = document.createElement("div");
lightbox.className = "photo-lightbox";
lightbox.hidden = true;
lightbox.setAttribute("role", "dialog");
lightbox.setAttribute("aria-modal", "true");
lightbox.setAttribute("aria-label", "Просмотр фотографий");
lightbox.innerHTML = '<button type="button" class="photo-lightbox-close" aria-label="Закрыть фото">×</button>' +
  '<button type="button" class="lightbox-arrow lightbox-prev" aria-label="Предыдущее фото">‹</button>' +
  '<img alt=""><button type="button" class="lightbox-arrow lightbox-next" aria-label="Следующее фото">›</button>' +
  '<div class="lightbox-count"></div>';
document.body.appendChild(lightbox);

const lightboxImage = lightbox.querySelector("img");
const lightboxCount = lightbox.querySelector(".lightbox-count");
let lightboxPhotos = [];
let lightboxIndex = 0;
let lightboxTitle = "";
function showLightboxPhoto(index) {
  if (!lightboxPhotos.length) return;
  lightboxIndex = (index + lightboxPhotos.length) % lightboxPhotos.length;
  lightboxImage.src = lightboxPhotos[lightboxIndex];
  lightboxImage.alt = lightboxTitle + " — фото " + (lightboxIndex + 1);
  lightboxCount.textContent = (lightboxIndex + 1) + " / " + lightboxPhotos.length;
  lightbox.querySelector(".lightbox-prev").hidden = lightboxPhotos.length < 2;
  lightbox.querySelector(".lightbox-next").hidden = lightboxPhotos.length < 2;
}
function openLightbox(photos, index, title) {
  lightboxPhotos = photos;
  lightboxTitle = title;
  showLightboxPhoto(index);
  lightbox.hidden = false;
  lightbox.querySelector(".photo-lightbox-close").focus();
}
function closeLightbox() {
  lightbox.hidden = true;
  lightboxImage.removeAttribute("src");
}
lightbox.querySelector(".photo-lightbox-close").addEventListener("click", closeLightbox);
lightbox.querySelector(".lightbox-prev").addEventListener("click", () => showLightboxPhoto(lightboxIndex - 1));
lightbox.querySelector(".lightbox-next").addEventListener("click", () => showLightboxPhoto(lightboxIndex + 1));
lightbox.addEventListener("click", event => { if (event.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", event => {
  if (lightbox.hidden) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") showLightboxPhoto(lightboxIndex - 1);
  if (event.key === "ArrowRight") showLightboxPhoto(lightboxIndex + 1);
});

PLACES.forEach(place => {
  if (!Array.isArray(place.coordinates) || place.coordinates.length !== 2 ||
      !Number.isFinite(place.coordinates[0]) || !Number.isFinite(place.coordinates[1])) {
    console.warn("Пропущена метка с неверными координатами:", place);
    return;
  }
  const marker = L.marker(place.coordinates).addTo(map);
  marker.bindPopup(popupContent(place), { maxWidth: 280 });
  marker.on("popupopen", async event => {
    const popupElement = event.popup.getElement();
    const gallery = popupElement && popupElement.querySelector(".place-popup .gallery");
    if (!gallery || gallery.dataset.loaded === "true" || gallery.dataset.loading === "true") return;
    gallery.dataset.loading = "true";
    try {
      let photos = [];
      if (gallery.dataset.folder) {
        photos = await listFolderPhotos(gallery.dataset.folder);
      } else {
        photos = JSON.parse(gallery.dataset.photos || "[]");
      }
      gallery.dataset.loaded = "true";
      renderGallery(gallery, photos, gallery.dataset.title || place.title);
    } catch (error) {
      console.error("Не удалось загрузить фотографии:", error);
      gallery.innerHTML = '<div class="no-photos">Не удалось загрузить фото из папки. Проверьте, что папка существует в репозитории.</div>';
    } finally {
      delete gallery.dataset.loading;
    }
  });
});
