"use client";

import Image from "next/image";
import Link from "next/link";

export type GroupCardData = {
    id: number;
    name: string;
    desc: string;
    coverImg: string;
    hobbyTags: string[];
    languageTags: string[];
    memberCount: number;
    memberAvatars: string[];
    isJoined: boolean;
};

function formatTagLabel(tag: string) {
    const normalized = tag.trim();
    return normalized.startsWith("#") ? normalized.toUpperCase() : `#${normalized.toUpperCase()}`;
}

function formatMemberCount(count: number) {
    return count.toLocaleString("ja-JP");
}

function extraMembersLabel(count: number) {
    if (count <= 2) return "";
    const extra = count - 2;
    if (extra >= 1000) return `+${Math.floor(extra / 1000)}K`;
    return `+${extra}`;
}

type GroupRecommendCardProps = {
    group: GroupCardData;
    onJoin?: (groupId: number) => void;
    isJoining?: boolean;
};

export default function GroupRecommendCard({ group, onJoin, isJoining }: GroupRecommendCardProps) {
    const displayTags = [...group.hobbyTags, ...group.languageTags].slice(0, 2);
    const showAvatars = group.memberCount > 0 && group.memberAvatars.length > 0;
    const extraLabel = extraMembersLabel(group.memberCount);

    return (
        <Link href={`/community/${group.id}`} className="block h-full">
            <article className="h-full bg-white rounded-[32px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group cursor-pointer hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)] transition-shadow">
                <div className="h-48 w-full relative shrink-0 bg-gray-300 overflow-hidden">
                    <Image
                        src={group.coverImg}
                        alt={group.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                    {displayTags.length > 0 && (
                        <div className="absolute bottom-6 left-6 flex flex-row gap-2">
                            {displayTags.map((tag, index) => (
                                <span
                                    key={`${tag}-${index}`}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold text-white tracking-[0.5px] uppercase ${
                                        index === 0
                                            ? "bg-[rgba(0,91,91,0.9)]"
                                            : "bg-white/20 backdrop-blur-md"
                                    }`}
                                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                >
                                    {formatTagLabel(tag)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 p-8 flex flex-col justify-between min-h-[254px]">
                    <div>
                        <h4 className="text-[20px] font-normal text-[#181D1B] leading-7 mb-3">{group.name}</h4>
                        <p className="text-[14px] text-[#526160] leading-[23px] line-clamp-2">{group.desc}</p>
                    </div>

                    <div className="flex justify-between items-end mt-7">
                        {showAvatars ? (
                            <div className="flex flex-col gap-[3px]">
                                <div className="flex -space-x-2">
                                    {group.memberAvatars.slice(0, 2).map((avatar, idx) => (
                                        <div
                                            key={idx}
                                            className="w-8 h-8 rounded-full border-2 border-white bg-gray-400 overflow-hidden relative"
                                        >
                                            <Image
                                                src={avatar || "/assets/images/avatars/avatar-1.jpg"}
                                                alt=""
                                                fill
                                                sizes="32px"
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                    {group.memberCount > 2 && (
                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-[#EAEFEC] flex justify-center items-center">
                                            <span
                                                className="text-[10px] font-bold text-[#526160]"
                                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                            >
                                                {extraLabel}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <p
                                    className="text-[11px] text-[#6E7979] tracking-[0.55px] uppercase leading-4"
                                    style={{
                                        fontFamily:
                                            group.memberCount >= 1000
                                                ? "'Plus Jakarta Sans', sans-serif"
                                                : "Manrope",
                                    }}
                                >
                                    {formatMemberCount(group.memberCount)} メンバー
                                </p>
                            </div>
                        ) : (
                            <p className="text-[11px] font-normal text-[#6E7979] tracking-[0.55px] uppercase pb-1">
                                {group.memberCount > 0
                                    ? `${formatMemberCount(group.memberCount)}人のメンバー`
                                    : "メンバー募集中"}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!group.isJoined && onJoin) onJoin(group.id);
                            }}
                            disabled={group.isJoined || isJoining}
                            className={`px-6 py-3 rounded-xl text-[14px] font-normal flex items-center gap-2 transition-opacity shrink-0 ${
                                group.isJoined
                                    ? "bg-[#923118] text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] cursor-default"
                                    : "bg-[#D3E3E1] text-[#566664] hover:opacity-80"
                            }`}
                        >
                            {group.isJoined && (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={3}
                                    stroke="currentColor"
                                    className="w-2.5 h-2.5"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            )}
                            {group.isJoined ? "参加中" : isJoining ? "処理中…" : "参加する"}
                        </button>
                    </div>
                </div>
            </article>
        </Link>
    );
}
