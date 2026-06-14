"use client";

import Image from "next/image";
import { useState } from "react";
import { resolveImageUrl } from "@/lib/image";

type UserAvatarProps = {
    name?: string | null;
    src?: string | null;
    size?: number;
    className?: string;
    priority?: boolean;
};

function initialFromName(name?: string | null) {
    const trimmed = name?.trim();
    return trimmed ? trimmed[0]?.toUpperCase() : "T";
}

export default function UserAvatar({
    name,
    src,
    size = 40,
    className = "",
    priority = false,
}: UserAvatarProps) {
    const [failed, setFailed] = useState(false);
    const isUploaded = src?.includes("avatar_");
    const hasImage = src && !isUploaded && !failed;
    const imageSrc = hasImage ? resolveImageUrl(src) : null;

    return (
        <div
            className={[
                "relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#005B5B] to-[#2DD4BF] text-white shadow-sm flex items-center justify-center font-black uppercase select-none",
                className,
            ].join(" ")}
            style={{ width: size, height: size }}
        >
            {hasImage && imageSrc ? (
                <Image
                    src={imageSrc}
                    alt={name || "ユーザー"}
                    fill
                    sizes={`${size}px`}
                    priority={priority}
                    className="object-cover"
                    onError={() => setFailed(true)}
                />
            ) : (
                <span style={{ fontSize: `${Math.max(10, Math.floor(size * 0.38))}px` }}>
                    {initialFromName(name)}
                </span>
            )}
        </div>
    );
}
