"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { normalizeAvatarUrl, resolveImageUrl } from "@/lib/image";

type RemoteAvatarProps = {
    name?: string | null;
    src?: string | null;
    className?: string;
    imageClassName?: string;
    fallbackClassName?: string;
    sizes?: string;
    priority?: boolean;
};

function initialFromName(name?: string | null) {
    const trimmed = name?.trim();
    return trimmed ? trimmed[0]?.toUpperCase() : "T";
}

export default function RemoteAvatar({
    name,
    src,
    className = "relative h-10 w-10 shrink-0 overflow-hidden",
    imageClassName = "object-cover",
    fallbackClassName = "text-[14px]",
    sizes = "40px",
    priority = false,
}: RemoteAvatarProps) {
    const [failed, setFailed] = useState(false);
    const normalizedSrc = normalizeAvatarUrl(src);
    const imageSrc = normalizedSrc && !failed ? resolveImageUrl(normalizedSrc, "") : null;

    useEffect(() => {
        setFailed(false);
    }, [src]);

    if (!imageSrc || failed) {
        return (
            <div
                className={`${className} flex items-center justify-center bg-gradient-to-br from-[#005B5B] to-[#2DD4BF] text-white font-black uppercase select-none`}
            >
                <span className={fallbackClassName}>{initialFromName(name)}</span>
            </div>
        );
    }

    return (
        <div className={className}>
            <Image
                src={imageSrc}
                alt={name || "ユーザー"}
                fill
                sizes={sizes}
                priority={priority}
                className={imageClassName}
                onError={() => {
                    console.warn("[RemoteAvatar] Failed to load avatar:", src);
                    setFailed(true);
                }}
            />
        </div>
    );
}