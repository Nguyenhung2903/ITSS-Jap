module.paths.push("../node_modules");
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { ListObjectsV2Command, S3Client } = require("@aws-sdk/client-s3");
const { uploadToR2, hasR2Config } = require("../src/utils/r2.js");

const prisma = new PrismaClient();

const AVATAR_DIR = path.join(__dirname, "../assets/avatar");
const COVER_DIR = path.join(__dirname, "../assets/group_bia");

// Helper to get configuration
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

let client = null;
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

function publicUrlForKey(key) {
    const { publicUrl } = getR2Config();
    return `${publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function listR2Files(prefix) {
    try {
        const { bucket } = getR2Config();
        const command = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix
        });
        const response = await getClient().send(command);
        return (response.Contents || [])
            .map(item => publicUrlForKey(item.Key))
            .filter(url => !url.endsWith("/")); // filter out directory placeholders
    } catch (err) {
        console.warn(`Could not list R2 files for prefix ${prefix}:`, err.message);
        return [];
    }
}

function getFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter(file => !file.startsWith("."))
        .map(file => path.join(dir, file));
}

async function main() {
    try {
        if (!hasR2Config()) {
            console.error("R2 is not configured in backend/.env!");
            process.exit(1);
        }

        console.log("Checking existing files in R2 storage...");
        let r2Avatars = await listR2Files("avatars/");
        let r2Covers = await listR2Files("group_bia/");

        console.log(`Found ${r2Avatars.length} avatars and ${r2Covers.length} covers already in R2.`);

        const localAvatars = getFiles(AVATAR_DIR);
        const localCovers = getFiles(COVER_DIR);

        // Upload avatars if R2 is empty
        if (r2Avatars.length < 10) {
            console.log("\n=== Uploading Avatars to R2 ===");
            r2Avatars = [];
            for (let i = 0; i < localAvatars.length; i++) {
                const filePath = localAvatars[i];
                const filename = path.basename(filePath);
                const buffer = fs.readFileSync(filePath);
                
                let mimeType = "image/jpeg";
                if (filename.endsWith(".png")) mimeType = "image/png";
                else if (filename.endsWith(".webp")) mimeType = "image/webp";
                else if (filename.endsWith(".avif")) mimeType = "image/avif";
                else if (filename.endsWith(".gif")) mimeType = "image/gif";

                try {
                    console.log(`[${i+1}/${localAvatars.length}] Uploading ${filename}...`);
                    const result = await uploadToR2(buffer, "avatars", {
                        contentType: mimeType,
                        originalName: filename
                    });
                    r2Avatars.push(result.secure_url);
                } catch (err) {
                    console.error(`Failed to upload avatar ${filename}:`, err.message);
                }
            }
        } else {
            console.log("Using existing avatars from R2 (skipping uploads).");
        }

        // Upload covers if R2 is empty
        if (r2Covers.length < 10) {
            console.log("\n=== Uploading Covers to R2 ===");
            r2Covers = [];
            for (let i = 0; i < localCovers.length; i++) {
                const filePath = localCovers[i];
                const filename = path.basename(filePath);
                const buffer = fs.readFileSync(filePath);
                
                let mimeType = "image/jpeg";
                if (filename.endsWith(".png")) mimeType = "image/png";
                else if (filename.endsWith(".webp")) mimeType = "image/webp";
                else if (filename.endsWith(".avif")) mimeType = "image/avif";
                else if (filename.endsWith(".gif")) mimeType = "image/gif";

                try {
                    console.log(`[${i+1}/${localCovers.length}] Uploading ${filename}...`);
                    const result = await uploadToR2(buffer, "group_bia", {
                        contentType: mimeType,
                        originalName: filename
                    });
                    r2Covers.push(result.secure_url);
                } catch (err) {
                    console.error(`Failed to upload cover ${filename}:`, err.message);
                }
            }
        } else {
            console.log("Using existing covers from R2 (skipping uploads).");
        }

        if (r2Avatars.length === 0 || r2Covers.length === 0) {
            console.error("No images available. Aborting DB update.");
            process.exit(1);
        }

        // 3. Update Database Users
        console.log("\n=== Updating Users in Database ===");
        const users = await prisma.verifiedUser.findMany({ select: { id: true, email: true } });
        console.log(`Updating ${users.length} users...`);
        for (const user of users) {
            const randomAvatar = r2Avatars[Math.floor(Math.random() * r2Avatars.length)];
            await prisma.verifiedUser.update({
                where: { id: user.id },
                data: { avatarUrl: randomAvatar }
            });
        }
        console.log("Users updated successfully.");

        // 4. Update Database Groups
        console.log("\n=== Updating Groups in Database ===");
        const groups = await prisma.group.findMany({ select: { groupId: true, name: true } });
        console.log(`Updating ${groups.length} groups...`);
        for (const group of groups) {
            const randomAvatar = r2Covers[Math.floor(Math.random() * r2Covers.length)];
            const randomCover = r2Covers[Math.floor(Math.random() * r2Covers.length)];
            await prisma.group.update({
                where: { groupId: group.groupId },
                data: {
                    groupAvatar: randomAvatar,
                    groupCover: randomCover
                }
            });
        }
        console.log("Groups updated successfully.");

        // 5. Update Database Events
        console.log("\n=== Updating Events in Database ===");
        const events = await prisma.event.findMany({ select: { id: true, title: true } });
        console.log(`Updating ${events.length} events...`);
        for (const event of events) {
            const randomCover = r2Covers[Math.floor(Math.random() * r2Covers.length)];
            await prisma.event.update({
                where: { id: event.id },
                data: { imageUrl: randomCover }
            });
        }
        console.log("Events updated successfully.");

        console.log("\n=== Migration Completed Successfully! ===");
    } catch (err) {
        console.error("Migration script failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
