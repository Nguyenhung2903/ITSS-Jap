const { selectSystemAvatar } = require("./systemAssets");

const PLACEHOLDER_HOSTS = new Set(["example.com", "www.example.com"]);

function getAppBaseUrl() {
    const raw =
        process.env.PUBLIC_APP_URL?.trim() ||
        process.env.NEXT_PUBLIC_APP_URL?.trim() ||
        process.env.SPACE_HOST?.trim();

    if (!raw) return "";

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
        return raw.replace(/\/+$/, "");
    }

    return `https://${raw.replace(/\/+$/, "")}`;
}

function isValidAbsoluteUrl(url) {
    try {
        const parsed = new URL(url);
        return (
            (parsed.protocol === "http:" || parsed.protocol === "https:") &&
            !PLACEHOLDER_HOSTS.has(parsed.hostname)
        );
    } catch {
        return false;
    }
}

function isResolvableRelativePath(url) {
    return (
        url.startsWith("/api/") ||
        url.startsWith("/assets/")
    );
}

function toAbsoluteUrl(path) {
    if (!path?.trim()) return null;

    const trimmed = path.trim();
    if (isValidAbsoluteUrl(trimmed)) return trimmed;

    if (trimmed.startsWith("/")) {
        const base = getAppBaseUrl();
        return base ? `${base}${trimmed}` : trimmed;
    }

    return null;
}

function getDefaultAvatarUrl(seed = "default") {
    return selectSystemAvatar(seed);
}

/**
 * Resolve a stored avatar value to a URL the frontend can load.
 * Always returns a non-empty string.
 */
function resolveAvatarUrl(url, seed, context = "user") {
    const trimmed = url?.trim();

    if (!trimmed) {
        console.warn(`[avatarUrl] Missing avatarUrl for ${context}; applying default`);
        const fallback = getDefaultAvatarUrl(seed);
        return toAbsoluteUrl(fallback) || fallback;
    }

    if (isValidAbsoluteUrl(trimmed)) {
        return trimmed;
    }

    if (isResolvableRelativePath(trimmed)) {
        return toAbsoluteUrl(trimmed) || trimmed;
    }

    console.warn(`[avatarUrl] Invalid avatarUrl for ${context}: ${trimmed}`);
    const fallback = getDefaultAvatarUrl(seed);
    return toAbsoluteUrl(fallback) || fallback;
}

function withResolvedAvatar(user, context) {
    if (!user || typeof user !== "object") return user;

    const seed = user.email || user.id || context || "default";
    return {
        ...user,
        avatarUrl: resolveAvatarUrl(user.avatarUrl, seed, context || `user:${user.id ?? "unknown"}`),
    };
}

function mapUsersWithAvatar(users, contextPrefix = "user") {
    return (users || []).map((user) =>
        withResolvedAvatar(user, `${contextPrefix}:${user.id ?? "unknown"}`)
    );
}

function withResolvedAuthor(entity, contextPrefix = "author") {
    if (!entity?.author) return entity;
    return {
        ...entity,
        author: withResolvedAvatar(
            entity.author,
            `${contextPrefix}:${entity.author.id ?? "unknown"}`
        ),
    };
}

function mapPostsWithAuthor(posts, contextPrefix = "post") {
    return (posts || []).map((post) => withResolvedAuthor(post, contextPrefix));
}

module.exports = {
    resolveAvatarUrl,
    withResolvedAvatar,
    mapUsersWithAvatar,
    withResolvedAuthor,
    mapPostsWithAuthor,
    getDefaultAvatarUrl,
    toAbsoluteUrl,
};
