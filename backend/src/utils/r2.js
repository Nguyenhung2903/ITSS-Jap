const crypto = require("crypto");
const path = require("path");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
]);

const MIME_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "application/pdf": ".pdf",
};

let client = null;

function getR2Config() {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
    const endpoint =
        process.env.CLOUDFLARE_R2_ENDPOINT?.trim() ||
        (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");

    return {
        accountId,
        endpoint,
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim(),
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim(),
        bucket: process.env.CLOUDFLARE_R2_BUCKET?.trim(),
        publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/+$/, ""),
    };
}

function hasR2Config() {
    const config = getR2Config();
    return Boolean(
        config.endpoint &&
        config.accessKeyId &&
        config.secretAccessKey &&
        config.bucket &&
        config.publicUrl
    );
}

function getClient() {
    if (client) return client;

    const config = getR2Config();
    client = new S3Client({
        region: "auto",
        endpoint: config.endpoint,
        forcePathStyle: true,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });

    return client;
}

function normalizeFolder(folder) {
    return String(folder || "uploads")
        .split("/")
        .map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, ""))
        .filter(Boolean)
        .join("/") || "uploads";
}

function extensionForFile(file) {
    if (file?.mimetype && MIME_EXTENSIONS[file.mimetype]) {
        return MIME_EXTENSIONS[file.mimetype];
    }

    const original = file?.originalname ? path.extname(file.originalname).toLowerCase() : "";
    return original && original.length <= 10 ? original : "";
}

function publicUrlForKey(key) {
    const { publicUrl } = getR2Config();
    return `${publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function uploadToR2(fileOrBuffer, folder = "uploads", options = {}) {
    if (!hasR2Config()) {
        const error = new Error("Cloudflare R2 is not configured");
        error.code = "R2_NOT_CONFIGURED";
        throw error;
    }

    const file = Buffer.isBuffer(fileOrBuffer)
        ? { buffer: fileOrBuffer, mimetype: options.contentType, originalname: options.originalName }
        : fileOrBuffer;

    if (!file?.buffer || !Buffer.isBuffer(file.buffer)) {
        throw new Error("Upload buffer is required");
    }

    const contentType = file.mimetype || options.contentType || "application/octet-stream";
    if (options.imagesOnly && !IMAGE_MIME_TYPES.has(contentType)) {
        const error = new Error("Only image uploads are allowed");
        error.code = "INVALID_IMAGE_TYPE";
        throw error;
    }

    const cleanFolder = normalizeFolder(folder);
    const ext = extensionForFile(file);
    const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const key = `${cleanFolder}/${filename}`;

    await getClient().send(
        new PutObjectCommand({
            Bucket: getR2Config().bucket,
            Key: key,
            Body: file.buffer,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000, immutable",
        })
    );

    const url = publicUrlForKey(key);
    return {
        key,
        url,
        secure_url: url,
        public_id: key,
        resource_type: IMAGE_MIME_TYPES.has(contentType) ? "image" : "raw",
    };
}

module.exports = {
    hasR2Config,
    uploadToR2,
    publicUrlForKey,
};
