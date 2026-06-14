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
        <article className="flex w-full min-h-[400px] flex-col overflow-hidden rounded-xl border border-[rgba(169,180,177,0.1)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] lg:flex-row">
            <div className="relative isolate flex w-full shrink-0 flex-col justify-center lg:w-[40%] lg:min-w-[280px] lg:max-w-[383px]">
                <div className="relative h-[240px] w-full lg:h-full lg:min-h-[280px] lg:flex-1">
                    <Image src={imageSrc} alt={event.title} fill className="object-cover" sizes="383px" />
                </div>
                {event.isNew && (
                    <span className="absolute left-4 top-2.5 z-10 rounded-full bg-[#A43E24] px-4 py-1.5 text-[12px] font-bold tracking-[0.6px] text-[#FFF7F6]">
                        NEW
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col justify-between p-6 lg:p-8">
                <div className="flex flex-col gap-4 pb-6 lg:pb-8">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
                        <h3 className="text-[24px] font-extrabold leading-[32px] text-[#036A6A] lg:text-[30px] lg:leading-[38px]">
                            {event.title}
                        </h3>
                        <span className="shrink-0 rounded-lg bg-[#D6E6E4] px-3 py-1 text-[12px] text-[#465554]">
                            {isOnline ? "オンライン" : "対面"}
                        </span>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-10">
                        <div className="flex items-center gap-2">
                            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" aria-hidden>
                                <path
                                    d="M11.5 1.5H12.5C12.7652 1.5 13.0196 1.60536 13.2071 1.79289C13.3946 1.98043 13.5 2.23478 13.5 2.5V13.5C13.5 13.7652 13.3946 14.0196 13.2071 14.2071C13.0196 14.3946 12.7652 14.5 12.5 14.5H1.5C1.23478 14.5 0.98043 14.3946 0.79289 14.2071C0.60536 14.0196 0.5 13.7652 0.5 13.5V2.5C0.5 2.23478 0.60536 1.98043 0.79289 1.79289C0.98043 1.60536 1.23478 1.5 1.5 1.5H2.5M10.5 1.5V3.5M3.5 1.5V3.5M0.5 6.5H13.5"
                                    stroke="#036A6A"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span className="text-[14px] font-medium text-[#56615F]" style={{ fontFamily: "Manrope, sans-serif" }}>
                                {formatEventDate(event.eventTime)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
                                <path
                                    d="M7.5 3.5V7.5L10 9M14 7.5C14 11.0899 11.0899 14 7.5 14C3.91015 14 1 11.0899 1 7.5C1 3.91015 3.91015 1 7.5 1C11.0899 1 14 3.91015 14 7.5Z"
                                    stroke="#036A6A"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span className="text-[14px] font-medium text-[#56615F]" style={{ fontFamily: "Manrope, sans-serif" }}>
                                {formatEventTime(event.eventTime)}
                            </span>
                        </div>
                        <div className="flex w-full items-center gap-2 sm:w-auto">
                            <svg width="12" height="15" viewBox="0 0 12 15" fill="none" aria-hidden>
                                <path
                                    d="M6 7.5C6.82843 7.5 7.5 6.82843 7.5 6C7.5 5.17157 6.82843 4.5 6 4.5C5.17157 4.5 4.5 5.17157 4.5 6C4.5 6.82843 5.17157 7.5 6 7.5Z"
                                    stroke="#036A6A"
                                    strokeWidth="1.2"
                                />
                                <path
                                    d="M6 13.5C8.5 10.5 10.5 8.5 10.5 6C10.5 3.51472 8.48528 1.5 6 1.5C3.51472 1.5 1.5 3.51472 1.5 6C1.5 8.5 3.5 10.5 6 13.5Z"
                                    stroke="#036A6A"
                                    strokeWidth="1.2"
                                />
                            </svg>
                            {isOnline && event.urlLink ? (
                                <a
                                    href={event.urlLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate text-[14px] font-medium text-[#036A6A] underline"
                                >
                                    {event.urlLink}
                                </a>
                            ) : (
                                <span className="text-[14px] font-medium text-[#56615F]">{event.address || "会場未定"}</span>
                            )}
                        </div>
                    </div>

                    <p className="text-[16px] leading-[26px] text-[#2A3432]">{event.description}</p>

                    {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {event.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-md bg-[#E1EAE7] px-3 py-1 text-[12px] text-[#465554]"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4 border-t border-[rgba(169,180,177,0.1)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center">
                        {event.memberAvatars.slice(0, 3).map((avatar, i) => (
                            <div
                                key={`${avatar}-${i}`}
                                className="relative -ml-3 h-8 w-8 shrink-0 overflow-hidden rounded-full shadow-[0_0_0_2px_#FFFFFF] first:ml-0"
                            >
                                <Image src={avatar} alt="" fill className="object-cover" />
                            </div>
                        ))}
                        {event.extraMemberCount > 0 && (
                            <div className="relative -ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#A0F0F0] text-[12px] font-bold text-[#005C5C] shadow-[0_0_0_2px_#FFFFFF]">
                                +{event.extraMemberCount}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => onJoin?.(event.id)}
                        disabled={isJoining || event.isJoined}
                        className="rounded-full bg-[#036A6A] px-8 py-3 text-[16px] font-bold text-[#E0FFFE] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {event.isJoined ? "参加済み" : isJoining ? "処理中…" : "参加する"}
                    </button>
                </div>
            </div>
        </article>
    );
}
