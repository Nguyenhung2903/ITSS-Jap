const PLACEHOLDER_HOSTS = new Set(["example.com", "www.example.com"]);

export function resolveImageUrl(url?: string | null, fallback = "/image/avatar.jpg") {
    if (!url?.trim()) return fallback;

    try {
        const parsed = new URL(url, "http://localhost");
        if (PLACEHOLDER_HOSTS.has(parsed.hostname)) return fallback;
    } catch {
        return fallback;
    }

    return url;
}
