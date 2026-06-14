"use client";

import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAuth } from "@/lib/auth-context";
import SearchInput from "@/components/ui/SearchInput";
import UserAvatar from "@/components/ui/UserAvatar";

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
    const profileHref = user?.id ? `/profile/${user.id}` : "/profile";
    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "ユーザー";

    return (
        <header className="relative top-0 z-40 flex h-18 w-full items-center justify-between border-b border-[#DFE3E1]/40 bg-white/80 px-4 shadow-[0_4px_30px_rgba(0,0,0,0.015)] backdrop-blur-xl md:px-8">
            <div className="flex min-w-0 items-center gap-4 md:gap-6">
                {backLink && (
                    <Link
                        href={backLink}
                        aria-label="前のページへ戻る"
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-[#DFE3E1]/70 hover:bg-[#005B5B]/10 hover:border-[#005B5B]/25 active:scale-90 transition-all duration-300 shrink-0 shadow-xs group"
                    >
                        <svg className="transition-transform duration-300 group-hover:-translate-x-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 14L4 8L10 2" stroke="#005B5B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                )}

                {showSearch ? (
                    <SearchInput
                        value={searchValue}
                        placeholder={searchPlaceholder || "検索"}
                        onValueChange={(value) => onSearch?.(value)}
                        className="w-[min(60vw,340px)]"
                    />
                ) : (
                    title && (
                        <h2 className="truncate text-[18px] font-extrabold leading-7 tracking-tight text-[#005B5B] md:text-[20px]">{title}</h2>
                    )
                )}
            </div>
            <div className="flex flex-row items-center gap-4 md:gap-6">
                <div className="flex flex-row items-center gap-3 md:gap-4">
                    <NotificationBell />

                    <div className="hidden h-6 w-px bg-[#DFE3E1]/70 sm:block"></div>
                </div>

                <Link
                    href={profileHref}
                    aria-label="プロフィールを開く"
                    className="rounded-full ring-2 ring-[#005B5B]/10 transition-all duration-300 hover:scale-105 hover:ring-[#005B5B]/40 active:scale-95"
                >
                    <UserAvatar name={displayName} src={user?.avatarUrl} size={36} />
                </Link>
            </div>

            <div className="absolute bottom-0 left-8 right-0 h-px bg-[#F1F5F9] opacity-10"></div>
        </header>
    );
}
