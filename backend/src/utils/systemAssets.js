const fs = require("fs");
const path = require("path");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const ASSET_ROOT = path.join(__dirname, "../../assets");

function listAssetFiles(folder) {
    const dir = path.join(ASSET_ROOT, folder);
    try {
        return fs
            .readdirSync(dir, { withFileTypes: true })
            .filter((entry) => entry.isFile())
            .map((entry) => entry.name)
            .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
            .sort((a, b) => a.localeCompare(b));
    } catch {
        return [];
    }
}

function hashSeed(seed) {
    const text = String(seed || "");
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function selectAssetUrl(folder, seed, fallback) {
    const files = listAssetFiles(folder);
    if (files.length === 0) return fallback;

    const filename = files[hashSeed(seed) % files.length];
    return `/api/backend-assets/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
}

function selectSystemAvatar(seed) {
    return selectAssetUrl("avatar", seed, "/assets/images/avatars/avatar.jpg");
}

function selectSystemCover(seed) {
    return selectAssetUrl("group_bia", seed, "/assets/images/events/event-1.png");
}

module.exports = {
    selectSystemAvatar,
    selectSystemCover,
};
