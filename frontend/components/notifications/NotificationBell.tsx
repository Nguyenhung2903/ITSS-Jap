"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    getNotificationsAction,
    markNotificationReadAction,
    type AppNotification,
} from "@/app/actions/notification";

function getNotificationLink(notification: AppNotification): string | null {
    if (notification.type === "MATCH" && notification.sessionId) {
        return `/chat?session=${notification.sessionId}`;
    }
    if (notification.type === "PROFILE_LIKE" && notification.relatedUserId) {
        return `/profile/${notification.relatedUserId}`;
    }
    if (notification.relatedUserId) {
        return `/profile/${notification.relatedUserId}`;
    }
    return null;
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
        return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

export default function NotificationBell() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const loadNotifications = useCallback(async () => {
        setIsLoading(true);
        const res = await getNotificationsAction();
        setIsLoading(false);
        if (res.success) {
            setNotifications(res.data);
        }
    }, []);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const handleNotificationClick = async (notification: AppNotification) => {
        if (!notification.isRead) {
            await markNotificationReadAction(notification.id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
            );
        }

        const href = getNotificationLink(notification);
        setOpen(false);
        if (href) {
            router.push(href);
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                type="button"
                onClick={() => {
                    setOpen((prev) => !prev);
                    if (!open) loadNotifications();
                }}
                className="relative w-10 h-10 rounded-full flex justify-center items-center hover:bg-black/5 transition-colors"
                aria-label="通知"
            >
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden>
                    <path
                        d="M0 17V15H2V8C2 6.61667 2.41667 5.3875 3.25 4.3125C4.08333 3.2375 5.16667 2.53333 6.5 2.2V1.5C6.5 1.08333 6.64583 0.729167 6.9375 0.4375C7.22917 0.145833 7.58333 0 8 0C8.41667 0 8.77083 0.145833 9.0625 0.4375C9.35417 0.729167 9.5 1.08333 9.5 1.5V2.2C10.8333 2.53333 11.9167 3.2375 12.75 4.3125C13.5833 5.3875 14 6.61667 14 8V15H16V17H0ZM8 20C7.45 20 6.97917 19.8042 6.5875 19.4125C6.19583 19.0208 6 18.55 6 18H10C10 18.55 9.80417 19.0208 9.4125 19.4125C9.02083 19.8042 8.55 20 8 20ZM4 15H12V8C12 6.9 11.6083 5.95833 10.825 5.175C10.0417 4.39167 9.1 4 8 4C6.9 4 5.95833 4.39167 5.175 5.175C4.39167 5.95833 4 6.9 4 8V15Z"
                        fill="#64748B"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 min-w-[8px] h-2 px-0.5 bg-[#BA1A1A] rounded-full" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-[360px] max-h-[420px] bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-[#BEC9C8]/30 overflow-hidden z-50 flex flex-col">
                    <div className="px-5 py-4 border-b border-[#BEC9C8]/20">
                        <h3 className="text-[14px] font-bold text-[#181D1B]">通知</h3>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {isLoading ? (
                            <p className="px-5 py-8 text-[13px] text-[#6E7979] text-center">読み込み中...</p>
                        ) : notifications.length === 0 ? (
                            <p className="px-5 py-8 text-[13px] text-[#6E7979] text-center">通知はありません</p>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    type="button"
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full text-left px-5 py-4 border-b border-[#BEC9C8]/10 hover:bg-[#F0F5F2] transition-colors ${!notification.isRead ? "bg-[#F0FDFA]/50" : ""}`}
                                >
                                    <p className="text-[13px] font-medium text-[#181D1B] leading-snug">
                                        {notification.message}
                                    </p>
                                    <p className="text-[11px] text-[#6E7979] mt-1">
                                        {formatTime(notification.createdAt)}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
