"use client";

import Image from "next/image";
import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAuth } from "@/lib/auth-context";

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
    const avatarUrl = user?.avatarUrl || "/image/avatar.jpg";

    return (
        <header className="relative w-full h-18 bg-[rgba(255,255,255,0.7)] backdrop-blur-[6px] flex justify-between items-center px-8 top-0 z-40">
            <div className="flex items-center gap-6">
                {backLink && (
                    <Link href={backLink} className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#005B5B]/10 transition-colors shrink-0">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 14L4 8L10 2" stroke="#005B5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                )}

                {showSearch ? (
                    <div className="relative w-[320px]">
                        <svg className="absolute left-5 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.8333 15L8.58333 9.75C8.16667 10.0833 7.6875 10.3472 7.14583 10.5417C6.60417 10.7361 6.02778 10.8333 5.41667 10.8333C3.90278 10.8333 2.62153 10.309 1.57292 9.26042C0.524305 8.21181 0 6.93056 0 5.41667C0 3.90278 0.524305 2.62153 1.57292 1.57292C2.62153 0.524305 3.90278 0 5.41667 0C6.93056 0 8.21181 0.524305 9.26042 1.57292C10.309 2.62153 10.8333 3.90278 10.8333 5.41667C10.8333 6.02778 10.7361 6.60417 10.5417 7.14583C10.3472 7.6875 10.0833 8.16667 9.75 8.58333L15 13.8333L13.8333 15ZM5.41667 9.16667C6.45833 9.16667 7.34375 8.80208 8.07292 8.07292C8.80208 7.34375 9.16667 6.45833 9.16667 5.41667C9.16667 4.375 8.80208 3.48958 8.07292 2.76042C7.34375 2.03125 6.45833 1.66667 5.41667 1.66667C4.375 1.66667 3.48958 2.03125 2.76042 2.76042C2.03125 3.48958 1.66667 4.375 1.66667 5.41667C1.66667 6.45833 2.03125 7.34375 2.76042 8.07292C3.48958 8.80208 4.375 9.16667 5.41667 9.16667Z" fill="#6E7979" />
                        </svg>
                        <input
                            type="text"
                            value={searchValue}
                            placeholder={searchPlaceholder}
                            onChange={(e) => onSearch?.(e.target.value)}
                            className="w-full h-[41px] bg-[#EAEFEC] rounded-full pl-12 pr-6 text-[14px] text-[#181D1B] placeholder:text-[#BEC9C8] focus:outline-none focus:ring-2 focus:ring-[#005B5B]/20 transition-all"
                        />
                    </div>
                ) : (
                    title && (
                        <h2 className="text-[20px] font-medium text-[#005B5B] leading-7">{title}</h2>
                    )
                )}
            </div>
            <div className="flex flex-row items-center gap-6">
                <div className="flex flex-row items-center gap-4">
                    <NotificationBell />

                    <div className="w-px h-8 bg-[rgba(190,201,200,0.3)]"></div>
                </div>

                <button className="w-8 h-8 rounded-full shadow-[0_0_0_2px_rgba(0,91,91,0.1)] overflow-hidden relative hover:opacity-80 transition-opacity">
                    <Image
                        src={avatarUrl}
                        alt="Profile"
                        fill
                        sizes="32px"
                        className="object-cover"
                    />
                </button>
            </div>

            <div className="absolute bottom-0 left-8 right-0 h-px bg-[#F1F5F9] opacity-15"></div>

        </header>
    );
}