const fs = require("fs");
const path = require("path");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const FRONTEND_ASSET_ROOTS = [
    path.join(__dirname, "../../../frontend/public/assets/images"),
    path.join(process.cwd(), "../frontend/public/assets/images"),
    path.join("/app/frontend/public/assets/images"),
];

function listAssetFiles(folder) {
    for (const root of FRONTEND_ASSET_ROOTS) {
        const dir = path.join(root, folder);
        try {
            const files = fs
                .readdirSync(dir, { withFileTypes: true })
                .filter((entry) => entry.isFile())
                .map((entry) => entry.name)
                .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
                .sort((a, b) => a.localeCompare(b));

            if (files.length > 0) return files;
        } catch {
            // Try the next known runtime layout.
        }
    }

    return [];
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
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/+$/, "");
    const key = `static/assets/images/${folder}/${filename}`;

    if (publicUrl) {
        return `${publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
    }

    return `/assets/images/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
}

function selectSystemAvatar(seed) {
    return selectAssetUrl("avatars", seed, "/assets/images/avatars/avatar.jpg");
}

function selectSystemEventCover(seed) {
    return selectAssetUrl("events", seed, "/assets/images/events/event-1.png");
}

function selectSystemGroupCover(seed) {
    return selectAssetUrl("groups", seed, "/assets/images/groups/group-1.jpg");
}

function selectSystemCover(seed) {
    return selectSystemEventCover(seed);
}

module.exports = {
    selectSystemAvatar,
    selectSystemCover,
    selectSystemEventCover,
    selectSystemGroupCover,
};
