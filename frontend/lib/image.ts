const PLACEHOLDER_HOSTS = new Set(["example.com", "www.example.com"]);

/**
 * Normalize avatar/image URLs from API responses.
 * Returns null when the value is missing or unusable.
 */
export function normalizeAvatarUrl(url?: string | null): string | null {
    if (!url?.trim()) return null;

    const trimmed = url.trim();

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        try {
            const parsed = new URL(trimmed);
            if (PLACEHOLDER_HOSTS.has(parsed.hostname)) return null;
            return trimmed;
        } catch {
            return null;
        }
    }

    if (trimmed.startsWith("/api/") || trimmed.startsWith("/assets/")) {
        return trimmed;
    }

    return null;
}

export function resolveImageUrl(
    url?: string | null,
    fallback = "/assets/images/avatars/avatar.jpg"
): string {
    const normalized = normalizeAvatarUrl(url);
    if (!normalized) {
        return fallback;
    }

    if (normalized.startsWith("/assets/images/avatars/")) {
        const filename = normalized.split("/").pop() || "";
        if (filename.startsWith("avatar_")) {
            return `/api/avatars/${filename}`;
        }
    }

    return normalized;
}

/**
 * Map heterogeneous API user fields to a single avatarUrl.
 */
export function pickAvatarUrl(
    source?: {
        avatarUrl?: string | null;
        avatar?: string | null;
        image?: string | null;
        profileImage?: string | null;
        photoUrl?: string | null;
    } | null
): string | null {
    if (!source) return null;

    return (
        normalizeAvatarUrl(source.avatarUrl) ||
        normalizeAvatarUrl(source.avatar) ||
        normalizeAvatarUrl(source.profileImage) ||
        normalizeAvatarUrl(source.image) ||
        normalizeAvatarUrl(source.photoUrl)
    );
}
