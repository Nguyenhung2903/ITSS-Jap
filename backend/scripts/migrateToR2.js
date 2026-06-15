module.paths.push("../node_modules");
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { hasR2Config, publicUrlForKey, uploadToR2 } = require("../src/utils/r2.js");

const prisma = new PrismaClient();

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const ASSET_ROOT = path.join(__dirname, "../../frontend/public/assets/images");
const STATIC_PREFIX = "static/assets/images";

function hashSeed(seed) {
    const text = String(seed || "");
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function contentTypeFor(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (ext === ".png") return "image/png";
    if (ext === ".webp") return "image/webp";
    if (ext === ".avif") return "image/avif";
    if (ext === ".gif") return "image/gif";
    return "image/jpeg";
}

function walkImages(dir, base = dir) {
    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        if (entry.name.startsWith(".")) return [];

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return walkImages(fullPath, base);
        if (!entry.isFile()) return [];
        if (!IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) return [];

        const relativePath = path.relative(base, fullPath).split(path.sep).join("/");
        return [{ fullPath, relativePath }];
    });
}

function isExternalUrl(url) {
    return /^https?:\/\//i.test(String(url || "").trim());
}

function shouldReplaceUrl(url) {
    const trimmed = String(url || "").trim();
    if (!trimmed) return true;
    if (trimmed.startsWith("/api/backend-assets/")) return true;
    if (trimmed.startsWith("/assets/")) return true;
    return false;
}

function pick(pool, seed) {
    if (pool.length === 0) return null;
    return pool[hashSeed(seed) % pool.length];
}

async function uploadStaticAssets() {
    const files = walkImages(ASSET_ROOT);
    const pools = {
        avatars: [],
        events: [],
        groups: [],
        all: [],
    };

    console.log(`Found ${files.length} frontend image assets.`);

    for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const key = `${STATIC_PREFIX}/${file.relativePath}`;
        const url = publicUrlForKey(key);
        const topFolder = file.relativePath.split("/")[0];

        try {
            await uploadToR2(
                {
                    buffer: fs.readFileSync(file.fullPath),
                    mimetype: contentTypeFor(file.relativePath),
                    originalname: path.basename(file.relativePath),
                },
                "static",
                {
                    key,
                    imagesOnly: true,
                }
            );
            console.log(`[${index + 1}/${files.length}] uploaded ${file.relativePath}`);
        } catch (error) {
            console.warn(`[${index + 1}/${files.length}] failed ${file.relativePath}: ${error.message}`);
        }

        if (topFolder === "avatars") pools.avatars.push(url);
        if (topFolder === "events") pools.events.push(url);
        if (topFolder === "groups") pools.groups.push(url);
        pools.all.push(url);
    }

    return pools;
}

async function updateDatabase(pools) {
    if (pools.avatars.length === 0) {
        throw new Error("No avatar assets available for DB migration");
    }
    if (pools.events.length === 0 && pools.groups.length === 0) {
        throw new Error("No cover assets available for DB migration");
    }

    const coverPool = pools.events.length > 0 ? pools.events : pools.groups;
    const groupPool = pools.groups.length > 0 ? pools.groups : coverPool;

    const users = await prisma.verifiedUser.findMany({
        select: { id: true, email: true, avatarUrl: true },
    });
    let userUpdates = 0;

    for (const user of users) {
        if (!shouldReplaceUrl(user.avatarUrl)) continue;

        const avatarUrl = pick(pools.avatars, user.email || user.id);
        if (!avatarUrl || user.avatarUrl === avatarUrl) continue;

        await prisma.verifiedUser.update({
            where: { id: user.id },
            data: { avatarUrl },
        });
        userUpdates += 1;
    }

    const groups = await prisma.group.findMany({
        select: { groupId: true, name: true, groupAvatar: true, groupCover: true },
    });
    let groupUpdates = 0;

    for (const group of groups) {
        const data = {};
        if (shouldReplaceUrl(group.groupAvatar)) {
            data.groupAvatar = pick(groupPool, `${group.name || group.groupId}:avatar`);
        }
        if (shouldReplaceUrl(group.groupCover)) {
            data.groupCover = pick(groupPool, `${group.name || group.groupId}:cover`);
        }

        if (Object.keys(data).length === 0) continue;

        await prisma.group.update({
            where: { groupId: group.groupId },
            data,
        });
        groupUpdates += 1;
    }

    const events = await prisma.event.findMany({
        select: { id: true, title: true, imageUrl: true },
    });
    let eventUpdates = 0;

    for (const event of events) {
        if (isExternalUrl(event.imageUrl) && !shouldReplaceUrl(event.imageUrl)) continue;
        if (!shouldReplaceUrl(event.imageUrl)) continue;

        const imageUrl = pick(coverPool, event.title || event.id);
        if (!imageUrl || event.imageUrl === imageUrl) continue;

        await prisma.event.update({
            where: { id: event.id },
            data: { imageUrl },
        });
        eventUpdates += 1;
    }

    console.log(JSON.stringify({ userUpdates, groupUpdates, eventUpdates }, null, 2));
}

async function main() {
    try {
        if (!hasR2Config()) {
            throw new Error("Cloudflare R2 env vars are incomplete");
        }

        const pools = await uploadStaticAssets();
        await updateDatabase(pools);
        console.log("R2 migration completed.");
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error("R2 migration failed:", error);
    process.exit(1);
});
