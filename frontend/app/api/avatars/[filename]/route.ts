import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
    request: Request,
    props: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await props.params;

        // Clean the filename to prevent directory traversal
        const cleanFilename = path.basename(filename);

        const possiblePaths = [
            path.join(process.cwd(), "public/assets/images/avatars", cleanFilename),
            path.join(process.cwd(), "frontend/public/assets/images/avatars", cleanFilename),
            path.join("/app/frontend/public/assets/images/avatars", cleanFilename),
        ];

        for (const filePath of possiblePaths) {
            if (fs.existsSync(filePath)) {
                const fileBuffer = fs.readFileSync(filePath);

                // Determine MIME type
                let contentType = "image/jpeg";
                const ext = path.extname(cleanFilename).toLowerCase();
                if (ext === ".png") contentType = "image/png";
                else if (ext === ".webp") contentType = "image/webp";
                else if (ext === ".gif") contentType = "image/gif";
                else if (ext === ".svg") contentType = "image/svg+xml";

                return new Response(fileBuffer, {
                    headers: {
                        "Content-Type": contentType,
                        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
                    },
                });
            }
        }
    } catch (err) {
        console.error("Error serving avatar image from route:", err);
    }

    return new Response("Not Found", { status: 404 });
}
