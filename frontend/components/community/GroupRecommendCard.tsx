"use client";

import Image from "next/image";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/image";

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
            <article className="h-full bg-white rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden flex flex-col group cursor-pointer hover:shadow-[0_25px_50px_rgba(0,91,91,0.07)] hover:-translate-y-1.5 transition-all duration-300 ease-out border border-[#DFE3E1]/40">
                <div className="h-44 w-full relative shrink-0 bg-gray-100 overflow-hidden">
                    <Image
                        src={group.coverImg}
                        alt={group.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    {displayTags.length > 0 && (
                        <div className="absolute bottom-5 left-5 flex flex-row gap-2 z-10">
                            {displayTags.map((tag, index) => (
                                <span
                                    key={`${tag}-${index}`}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black text-white tracking-[0.5px] uppercase ${
                                        index === 0
                                            ? "bg-[#005B5B] shadow-[0_2px_4px_rgba(0,91,91,0.3)]"
                                            : "bg-white/20 backdrop-blur-md border border-white/10"
                                    }`}
                                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                >
                                    {formatTagLabel(tag)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between min-h-[240px] bg-white">
                    <div>
                        <h4 className="text-[18px] font-extrabold text-[#181D1B] leading-6 mb-2 group-hover:text-[#005B5B] transition-colors duration-300">{group.name}</h4>
                        <p className="text-[13px] text-[#6E7979] leading-[21px] line-clamp-3">{group.desc}</p>
                    </div>

                    <div className="flex justify-between items-end mt-6">
                        {showAvatars ? (
                            <div className="flex flex-col gap-1.5">
                                <div className="flex -space-x-1.5">
                                    {group.memberAvatars.slice(0, 2).map((avatar, idx) => (
                                        <div
                                            key={idx}
                                            className="w-7.5 h-7.5 rounded-full border-2 border-white bg-gray-200 overflow-hidden relative shadow-xs"
                                        >
                                            <Image
                                                src={resolveImageUrl(avatar, "/assets/images/avatars/avatar-1.jpg")}
                                                alt=""
                                                fill
                                                sizes="30px"
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                    {group.memberCount > 2 && (
                                        <div className="w-7.5 h-7.5 rounded-full border-2 border-white bg-[#EAEFEC] flex justify-center items-center shadow-xs">
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
                                    className="text-[10.5px] font-bold text-[#BEC9C8] tracking-[0.55px] uppercase leading-none"
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
                            <p className="text-[10.5px] font-bold text-[#BEC9C8] tracking-[0.55px] uppercase pb-1 leading-none">
                                {group.memberCount > 0
                                    ? `${formatMemberCount(group.memberCount)} メンバー`
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
                            className={`px-5 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5 transition-all duration-300 shrink-0 active:scale-95 ${
                                group.isJoined
                                    ? "bg-[#923118]/8 text-[#923118] border border-[#923118]/20 cursor-default"
                                    : "bg-white hover:bg-[#005B5B] text-[#005B5B] hover:text-white border border-[#005B5B]/35 hover:border-transparent cursor-pointer shadow-xs hover:shadow-[0_4px_12px_rgba(0,91,91,0.15)]"
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
