/** Client-safe API / socket URL helpers (no server-only imports). */

export function getApiBaseUrl(): string {
    const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!raw) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
    }
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
        return raw.replace(/\/$/, "");
    }
    return `https://${raw.replace(/\/$/, "")}`;
}

/** Socket.IO server origin (strips /api from API base URL). */
export function getSocketBaseUrl(): string {
    const fromEnv = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
    if (fromEnv) {
        if (fromEnv.startsWith("http://") || fromEnv.startsWith("https://")) {
            return fromEnv.replace(/\/$/, "");
        }
        return `https://${fromEnv.replace(/\/$/, "")}`;
    }

    try {
        return getApiBaseUrl().replace(/\/api$/, "");
    } catch {
        return "http://localhost:5000";
    }
}
