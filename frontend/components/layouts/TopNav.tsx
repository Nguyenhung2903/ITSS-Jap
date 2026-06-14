"use client";

import Image from "next/image";
import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAuth } from "@/lib/auth-context";
import { resolveImageUrl } from "@/lib/image";

interface TopNavProps {
    title?: string;
    backLink?: string;
    showSearch?: boolean;
    searchPlaceholder?: string;
    searchValue?: string;
    onSearch?: (query: string) => void;
}

export default function TopNav({
    title,
    backLink,
    showSearch = false,
    searchPlaceholder,
    searchValue = "",
    onSearch,
}: TopNavProps) {
    const { user } = useAuth();
    const avatarUrl = resolveImageUrl(user?.avatarUrl);

    return (
        <header className="relative w-full h-18 bg-white/75 backdrop-blur-xl flex justify-between items-center px-8 top-0 z-40 border-b border-[#DFE3E1]/40 shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
            <div className="flex items-center gap-6">
                {backLink && (
                    <Link
                        href={backLink}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-[#DFE3E1]/70 hover:bg-[#005B5B]/10 hover:border-[#005B5B]/25 active:scale-90 transition-all duration-300 shrink-0 shadow-xs group"
                    >
                        <svg className="transition-transform duration-300 group-hover:-translate-x-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 14L4 8L10 2" stroke="#005B5B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                )}

                {showSearch ? (
                    <div className="relative w-[340px] group">
                        <svg className="absolute left-5 top-1/2 -translate-y-1/2 text-[#BEC9C8] transition-all duration-300 group-focus-within:text-[#005B5B] group-focus-within:scale-105" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.8333 15L8.58333 9.75C8.16667 10.0833 7.6875 10.3472 7.14583 10.5417C6.60417 10.7361 6.02778 10.8333 5.41667 10.8333C3.90278 10.8333 2.62153 10.309 1.57292 9.26042C0.524305 8.21181 0 6.93056 0 5.41667C0 3.90278 0.524305 2.62153 1.57292 1.57292C2.62153 0.524305 3.90278 0 5.41667 0C6.93056 0 8.21181 0.524305 9.26042 1.57292C10.309 2.62153 10.8333 3.90278 10.8333 5.41667C10.8333 6.02778 10.7361 6.60417 10.5417 7.14583C10.3472 7.6875 10.0833 8.16667 9.75 8.58333L15 13.8333L13.8333 15ZM5.41667 9.16667C6.45833 9.16667 7.34375 8.80208 8.07292 8.07292C8.80208 7.34375 9.16667 6.45833 9.16667 5.41667C9.16667 4.375 8.80208 3.48958 8.07292 2.76042C7.34375 2.03125 6.45833 1.66667 5.41667 1.66667C4.375 1.66667 3.48958 2.03125 2.76042 2.76042C2.03125 3.48958 1.66667 4.375 1.66667 5.41667C1.66667 6.45833 2.03125 7.34375 2.76042 8.07292C3.48958 8.80208 4.375 9.16667 5.41667 9.16667Z" fill="currentColor" />
                        </svg>
                        <input
                            type="text"
                            value={searchValue}
                            placeholder={searchPlaceholder}
                            onChange={(e) => onSearch?.(e.target.value)}
                            className="w-full h-[42px] bg-[#F0F5F2]/80 hover:bg-[#E5EAE7] focus:bg-white rounded-2xl pl-12 pr-6 text-[14px] text-[#181D1B] placeholder:text-[#BEC9C8] outline-none border border-transparent focus:border-[#005B5B]/25 focus:ring-4 focus:ring-[#005B5B]/8 transition-all duration-300 shadow-xs"
                        />
                    </div>
                ) : (
                    title && (
                        <h2 className="text-[20px] font-extrabold text-[#005B5B] leading-7 tracking-tight">{title}</h2>
                    )
                )}
            </div>
            <div className="flex flex-row items-center gap-6">
                <div className="flex flex-row items-center gap-4">
                    <NotificationBell />

                    <div className="w-px h-6 bg-[#DFE3E1]/70"></div>
                </div>

                <Link
                    href="/profile"
                    className="w-9 h-9 rounded-full ring-2 ring-[#005B5B]/10 hover:ring-[#005B5B]/40 overflow-hidden relative hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer shadow-sm"
                >
                    <Image
                        src={avatarUrl}
                        alt="Profile"
                        fill
                        sizes="36px"
                        className="object-cover"
                    />
                </Link>
            </div>

            <div className="absolute bottom-0 left-8 right-0 h-px bg-[#F1F5F9] opacity-10"></div>
        </header>
    );
}