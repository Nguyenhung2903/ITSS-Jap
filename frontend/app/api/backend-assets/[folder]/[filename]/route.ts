import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const ALLOWED_FOLDERS = new Set(["avatar", "group_bia"]);
const CONTENT_TYPES: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif",
};

type RouteContext = {
    params: Promise<{
        folder: string;
        filename: string;
    }>;
};

export async function GET(_request: Request, context: RouteContext) {
    const { folder, filename } = await context.params;
    const cleanFolder = path.basename(decodeURIComponent(folder));
    const cleanFilename = path.basename(decodeURIComponent(filename));
    const ext = path.extname(cleanFilename).toLowerCase();

    if (!ALLOWED_FOLDERS.has(cleanFolder) || !CONTENT_TYPES[ext]) {
        return new NextResponse("Not found", { status: 404 });
    }

    const candidates = [
        path.join(process.cwd(), "../backend/assets", cleanFolder, cleanFilename),
        path.join(process.cwd(), "backend/assets", cleanFolder, cleanFilename),
        path.join("/app/backend/assets", cleanFolder, cleanFilename),
    ];

    for (const filePath of candidates) {
        try {
            const file = await readFile(filePath);
            return new NextResponse(file, {
                headers: {
                    "Content-Type": CONTENT_TYPES[ext],
                    "Cache-Control": "public, max-age=31536000, immutable",
                },
            });
        } catch {
            // Try the next runtime path.
        }
    }

    return new NextResponse("Not found", { status: 404 });
}
