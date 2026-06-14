"use client";

import Image from "next/image";
import { formatEventDate } from "@/lib/events-format";
import { resolveImageUrl } from "@/lib/image";

export type EventCardData = {
    id: number;
    title: string;
    description: string;
    eventTime: string;
    format: "online" | "offline" | string;
    address?: string | null;
    urlLink?: string | null;
    imageUrl?: string | null;
    tags?: string[];
    isNew?: boolean;
    memberAvatars: string[];
    extraMemberCount: number;
    isJoined?: boolean;
};

function formatEventTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false });
}

type EventCardProps = {
    event: EventCardData;
    onJoin?: (eventId: number) => void;
    isJoining?: boolean;
};

export default function EventCard({ event, onJoin, isJoining }: EventCardProps) {
    const isOnline = event.format === "online";
    const imageSrc = resolveImageUrl(event.imageUrl, "/assets/images/events/event-1.png");

    return (
        <article className="flex w-full min-h-[400px] flex-col overflow-hidden rounded-[28px] border border-[#DFE3E1]/40 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:shadow-[0_20px_50px_rgba(0,91,91,0.05)] hover:-translate-y-1.5 transition-all duration-300 ease-out lg:flex-row group">
            <div className="relative isolate flex w-full shrink-0 flex-col justify-center lg:w-[40%] lg:min-w-[280px] lg:max-w-[383px] overflow-hidden">
                <div className="relative h-[240px] w-full lg:h-full lg:min-h-[280px] lg:flex-1 overflow-hidden">
                    <Image src={imageSrc} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" sizes="383px" />
                </div>
                {event.isNew && (
                    <span className="absolute left-5 top-5 z-10 rounded-xl bg-[#A43E24] px-4 py-1.5 text-[11px] font-black tracking-widest text-[#FFF7F6] shadow-[0_4px_10px_rgba(164,62,36,0.3)] uppercase">
                        NEW
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col justify-between p-7 lg:p-9">
                <div className="flex flex-col gap-5 pb-6 lg:pb-8">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
                        <h3 className="text-[24px] font-extrabold leading-[32px] text-[#181D1B] group-hover:text-[#005B5B] transition-colors duration-300 lg:text-[28px] lg:leading-[36px]">
                            {event.title}
                        </h3>
                        <span className={`shrink-0 px-3 py-1 rounded-xl text-[12px] font-bold shadow-xs select-none border ${
                            isOnline 
                                ? "bg-[#005B5B]/5 border-[#005B5B]/15 text-[#005B5B]" 
                                : "bg-[#923118]/6 border-[#923118]/12 text-[#923118]"
                        }`}>
                            {isOnline ? "オンライン" : "対面"}
                        </span>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8 text-[#6E7979]">
                        <div className="flex items-center gap-2">
                            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" aria-hidden>
                                <path
                                    d="M11.5 1.5H12.5C12.7652 1.5 13.0196 1.60536 13.2071 1.79289C13.3946 1.98043 13.5 2.23478 13.5 2.5V13.5C13.5 13.7652 13.3946 14.0196 13.2071 14.2071C13.0196 14.3946 12.7652 14.5 12.5 14.5H1.5C1.23478 14.5 0.98043 14.3946 0.79289 14.2071C0.60536 14.0196 0.5 13.7652 0.5 13.5V2.5C0.5 2.23478 0.60536 1.98043 0.79289 1.79289C0.98043 1.60536 1.23478 1.5 1.5 1.5H2.5M10.5 1.5V3.5M3.5 1.5V3.5M0.5 6.5H13.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span className="text-[14px] font-semibold" style={{ fontFamily: "Manrope, sans-serif" }}>
                                {formatEventDate(event.eventTime)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
                                <path
                                    d="M7.5 3.5V7.5L10 9M14 7.5C14 11.0899 11.0899 14 7.5 14C3.91015 14 1 11.0899 1 7.5C1 3.91015 3.91015 1 7.5 1C11.0899 1 14 3.91015 14 7.5Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span className="text-[14px] font-semibold" style={{ fontFamily: "Manrope, sans-serif" }}>
                                {formatEventTime(event.eventTime)}
                            </span>
                        </div>
                        <div className="flex w-full items-center gap-2 sm:w-auto">
                            <svg width="12" height="15" viewBox="0 0 12 15" fill="none" aria-hidden>
                                <path
                                    d="M6 7.5C6.82843 7.5 7.5 6.82843 7.5 6C7.5 5.17157 6.82843 4.5 6 4.5C5.17157 4.5 4.5 5.17157 4.5 6C4.5 6.82843 5.17157 7.5 6 7.5Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M6 13.5C8.5 10.5 10.5 8.5 10.5 6C10.5 3.51472 8.48528 1.5 6 1.5C3.51472 1.5 1.5 3.51472 1.5 6C1.5 8.5 3.5 10.5 6 13.5Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                            </svg>
                            {isOnline && event.urlLink ? (
                                <a
                                    href={event.urlLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate text-[14px] font-semibold text-[#005B5B] underline hover:text-[#004A4A]"
                                >
                                    {event.urlLink}
                                </a>
                            ) : (
                                <span className="text-[14px] font-semibold">{event.address || "会場未定"}</span>
                            )}
                        </div>
                    </div>

                    <p className="text-[15px] leading-[26px] text-[#3E4948] font-medium">{event.description}</p>

                    {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {event.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-xl bg-white border border-[#DFE3E1]/70 px-3 py-1.5 text-[12px] font-bold text-[#3E4948] shadow-xs"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4 border-t border-[rgba(169,180,177,0.15)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center">
                        {event.memberAvatars.slice(0, 3).map((avatar, i) => (
                            <div
                                key={`${avatar}-${i}`}
                                className="relative -ml-2.5 h-8.5 w-8.5 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm first:ml-0"
                            >
                                <Image src={avatar} alt="" fill className="object-cover" />
                            </div>
                        ))}
                        {event.extraMemberCount > 0 && (
                            <div className="relative -ml-2.5 flex h-8.5 w-8.5 items-center justify-center rounded-full bg-[#A0F0F0] text-[11px] font-black text-[#005C5C] border-2 border-white shadow-sm">
                                +{event.extraMemberCount}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => onJoin?.(event.id)}
                        disabled={isJoining || event.isJoined}
                        className={`rounded-xl px-8 py-3 text-[15px] font-bold transition-all duration-300 ease-out active:scale-95 ${
                            event.isJoined
                                ? "bg-[#005B5B]/8 text-[#005B5B] border border-[#005B5B]/20 cursor-default"
                                : "bg-gradient-to-r from-[#005B5B] to-[#1B7575] hover:from-[#004a4a] hover:to-[#134e4a] text-white shadow-[0_4px_12px_rgba(0,91,91,0.15)] hover:shadow-[0_8px_20px_rgba(0,91,91,0.25)] hover:-translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        }`}
                    >
                        {event.isJoined ? "参加済み" : isJoining ? "処理中…" : "参加する"}
                    </button>
                </div>
            </div>
        </article>
    );
}
