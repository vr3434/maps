/*
 * Фото можно хранить в отдельных папках репозитория.
 * Для автоматической загрузки списка файлов используется публичный GitHub Contents API.
 * Папка spoon/ привязана к метке 61.241187, 73.39222.
 */
const REPO_OWNER = "VR3434";
const REPO_NAME = "maps";
const REPO_BRANCH = "fix/fullscreen-map-and-refresh";
const MEDIA_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|mp4)$/i;

const PLACES = [
  {
    title: "асфальт",
    coordinates: [61.261566, 73.187978],
    description: "место с асфальтом",
    photos: ["P1281853.JPG"]
  },
  {
    title: "Ложка",
    coordinates: [61.241187, 73.39222],
    description: "Фотографии автоматически загружаются из папки spoon.",
    photoFolder: "spoon"
  },
  {
    title: "Балалайка",
    coordinates: [61.243951, 73.404528],
    description: "Фотографии автоматически загружаются из папки balalaika.",
    photoFolder: "balalaika"
  },
  {
    title: "Матрёшка",
    coordinates: [61.247816, 73.422265],
    description: "Фотографии автоматически загружаются из папки Matryoshka.",
    photoFolder: "Matryoshka"
  },
  {
    title: "корова",
    coordinates: [61.249355, 73.429523],
    description: "Фотографии автоматически загружаются из папки cow.",
    photoFolder: "cow"
  },
  {
    title: "Самовар с чашками",
    coordinates: [61.255151, 73.435025],
    description: "Фотографии автоматически загружаются из папки Samovar with cups.",
    photoFolder: "Samovar with cups"
  },
  {
    title: "Лис — fox science",
    coordinates: [61.238029, 73.409426],
    description: "Видео fox_science из папки fox.",
    photoFolder: "fox",
    mediaFile: "fox_science"
  },
  {
    title: "Лис — fox basket",
    coordinates: [61.236895, 73.407528],
    description: "Видео fox_basket из папки fox.",
    photoFolder: "fox",
    mediaFile: "fox_basket"
  },
  {
    title: "Чёрный лис",
    coordinates: [61.236787, 73.407086],
    description: "Видео black_fox из папки fox.",
    photoFolder: "fox",
    mediaFile: "black_fox"
  },
  {
    title: "Длинный лис",
    coordinates: [61.237567, 73.406625],
    description: "Видео long_fox из папки fox.",
    photoFolder: "fox",
    mediaFile: "long_fox"
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
  const fileAttribute = place.mediaFile ? ' data-media-file="' + escapeHtml(place.mediaFile) + '"' : "";
  const photosAttribute = ' data-photos="' + escapeHtml(JSON.stringify(initialPhotos)) + '"';
  return '<div class="place-popup"><h3>' + escapeHtml(place.title) +
    '</h3><p>' + escapeHtml(place.description || "") + '</p>' +
    '<div class="gallery" data-title="' + escapeHtml(place.title) + '"' +
    folderAttribute + fileAttribute + photosAttribute + '><div class="no-photos">Загрузка фотографий…</div></div></div>';
}

async function listFolderMedia(folder, exactBaseName) {
  const url = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME +
    '/contents/' + folder.split("/").map(encodeURIComponent).join("/") +
    '?ref=' + encodeURIComponent(REPO_BRANCH);
  const response = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!response.ok) throw new Error("GitHub API вернул " + response.status);
  const files = await response.json();
  if (!Array.isArray(files)) return [];
  return files
    .filter(file => file.type === "file" && MEDIA_EXTENSIONS.test(file.name) && (!exactBaseName || file.name.replace(/\.[^.]+$/, "") === exactBaseName))
    .sort((a, b) => a.name.localeCompare(b.name, "ru", { numeric: true }))
    .map(file => ({ url: file.download_url, type: /\.mp4$/i.test(file.name) ? "video" : "image" }))
    .filter(file => file.url);
}

function renderGallery(gallery, media, title) {
  gallery.replaceChildren();
  if (!media.length) {
    gallery.innerHTML = '<div class="no-photos">В папке пока нет фото или видео MP4.</div>';
    return;
  }
  let current = 0;
  const frame = document.createElement("div");
  frame.className = "gallery-frame";
  const stage = document.createElement("div");
  stage.className = "gallery-stage";
  const prev = document.createElement("button");
  prev.type = "button"; prev.className = "gallery-arrow gallery-prev";
  prev.textContent = "‹"; prev.setAttribute("aria-label", "Предыдущий файл");
  const next = document.createElement("button");
  next.type = "button"; next.className = "gallery-arrow gallery-next";
  next.textContent = "›"; next.setAttribute("aria-label", "Следующий файл");
  const count = document.createElement("div");
  count.className = "gallery-count";
  function show(index) {
    current = (index + media.length) % media.length;
    stage.replaceChildren();
    const item = media[current];
    if (item.type === "video") {
      const video = document.createElement("video");
      video.className = "gallery-current";
      video.src = item.url;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-label", title + " — видео " + (current + 1));
      stage.append(video);
    } else {
      const image = document.createElement("img");
      image.className = "gallery-current";
      image.src = item.url;
      image.alt = title + " — фото " + (current + 1);
      image.loading = "lazy";
      image.addEventListener("click", () => openLightbox(media.filter(entry => entry.type === "image").map(entry => entry.url), 0, title));
      stage.append(image);
    }
    count.textContent = (current + 1) + " / " + media.length;
    prev.hidden = media.length < 2;
    next.hidden = media.length < 2;
  }
  prev.addEventListener("click", event => { event.stopPropagation(); show(current - 1); });
  next.addEventListener("click", event => { event.stopPropagation(); show(current + 1); });
  frame.append(stage, prev, next, count);
  gallery.append(frame);
  show(0);
}

const lightboxStyle = document.createElement("style");
lightboxStyle.textContent = `
  .place-popup .gallery { display: block; width: 100%; }
  .gallery-frame { position: relative; width: 100%; overflow: hidden; border-radius: 9px; background: #eef0f2; }
  .gallery-current { display: block; width: 100%; height: 160px; object-fit: contain; background: #111; }\n  img.gallery-current { object-fit: cover; cursor: zoom-in; }
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
        photos = await listFolderMedia(gallery.dataset.folder, gallery.dataset.mediaFile);
      } else {
        photos = JSON.parse(gallery.dataset.photos || "[]").map(url => ({ url, type: "image" }));
      }
      gallery.dataset.loaded = "true";
      renderGallery(gallery, photos, gallery.dataset.title || place.title);
    } catch (error) {
      console.error("Не удалось загрузить фотографии:", error);
      gallery.innerHTML = '<div class="no-photos">Не удалось загрузить медиафайлы. Проверьте, что папка существует в репозитории.</div>';
    } finally {
      delete gallery.dataset.loading;
    }
  });
});
