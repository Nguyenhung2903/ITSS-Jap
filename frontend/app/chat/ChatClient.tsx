"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/layouts/Sidebar";
import {
    sendMessageWithAttachmentAction,
    type ChatBlockStatus,
    type ChatMessage,
    type ChatSessionItem,
} from "@/app/actions/chat";
import { blockUserAction, unblockUserAction } from "@/app/actions/matching";
import {
    bumpChatInboxAfterSend,
    fetchChatInboxClient,
    fetchChatMessagesClient,
    patchChatInboxCacheAfterSend,
    patchChatInboxCacheAfterBlock,
    readChatInboxCache,
    sendChatMessageClient,
} from "@/lib/chat-client";
import { useChatSocket } from "@/hooks/useChatSocket";
import { resolveTranslatedText } from "@/lib/chat-translation";
import { useAuth } from "@/lib/auth-context";
import ChatImagePreview from "@/components/chat/ChatImagePreview";

const DEFAULT_AVATAR = "/image/avatar-1.jpg";

type SessionUser = {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
};

function getDisplayName(user?: { firstName?: string | null; lastName?: string | null } | null) {
    if (!user) return "ユーザー";
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return name || "ユーザー";
}

function getAvatarUrl(url?: string | null) {
    return url || DEFAULT_AVATAR;
}

function formatMessageTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatChatListTime(dateStr?: string | null) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
        return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "昨日";
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays < 7) return `${diffDays}日前`;
    return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

function isSameDay(a: string, b: string) {
    return new Date(a).toDateString() === new Date(b).toDateString();
}

function getMessagePreview(msg?: ChatMessage | null) {
    if (!msg) return "（メッセージなし）";
    if (msg.content?.trim()) return msg.content;
    if (msg.messageType === "IMAGE") return "📷 画像";
    if (msg.messageType === "FILE") return "📎 ファイル";
    return "（メッセージなし）";
}

function getAttachmentFileName(url: string, fallback?: string | null) {
    if (fallback?.trim()) return fallback.trim();
    try {
        const pathname = new URL(url).pathname;
        const name = pathname.split("/").pop();
        return name || "ファイル";
    } catch {
        return "ファイル";
    }
}

function isComposerLockedByBlock(blockStatus?: ChatBlockStatus | null) {
    return Boolean(blockStatus?.blockedByMe || blockStatus?.blockedByThem);
}

function isBlockActive(blockStatus?: ChatBlockStatus | null) {
    return Boolean(blockStatus?.blockedByMe || blockStatus?.blockedByThem);
}

function getBlockBannerMessage(blockStatus?: ChatBlockStatus | null) {
    if (blockStatus?.blockedByMe) {
        return "このユーザーをブロックしました。会話を続けるにはブロックを解除してください。";
    }
    if (blockStatus?.blockedByThem) {
        return "相手にブロックされました。これ以上メッセージを送ることはできません。";
    }
    return null;
}

function resolveBlockStatusFromPayload(
    payload: { blockedByUserId: number; blockedTargetUserId: number },
    viewerId: number
): ChatBlockStatus {
    if (payload.blockedByUserId === viewerId) {
        return { blockedByMe: true, blockedByThem: false };
    }
    if (payload.blockedTargetUserId === viewerId) {
        return { blockedByMe: false, blockedByThem: true };
    }
    return { blockedByMe: false, blockedByThem: false };
}

function BlockConfirmDialog({
    open,
    isBusy,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    isBusy: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <p className="text-[16px] font-medium text-[#181D1B] leading-relaxed text-center">
                    本当にこのユーザーをブロックしますか？
                </p>
                <div className="flex gap-3 justify-center pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isBusy}
                        className="px-8 py-2.5 rounded-xl text-[14px] font-medium text-[#3E4948] bg-[#EAEFEC] hover:bg-[#DFE3E1] disabled:opacity-60"
                    >
                        いいえ
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isBusy}
                        className="px-8 py-2.5 rounded-xl text-[14px] font-bold text-white bg-[#923118] hover:bg-[#7a2813] disabled:opacity-60"
                    >
                        {isBusy ? "処理中..." : "はい"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function isImageAttachment(msg: ChatMessage) {
    if (msg.messageType === "IMAGE") return true;
    if (msg.messageType !== "TEXT" || !msg.attachmentUrl) return false;
    return /\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?|$)/i.test(msg.attachmentUrl);
}

function MessageAttachment({
    msg,
    isMine,
    onImageClick,
}: {
    msg: ChatMessage;
    isMine: boolean;
    onImageClick: (url: string, fileName: string) => void;
}) {
    if (!msg.attachmentUrl) return null;

    if (isImageAttachment(msg)) {
        const fileName = getAttachmentFileName(msg.attachmentUrl, msg.content);
        return (
            <button
                type="button"
                onClick={() => onImageClick(msg.attachmentUrl!, fileName)}
                className="block cursor-zoom-in"
            >
                <div className="relative w-[240px] max-w-full rounded-lg overflow-hidden bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={msg.attachmentUrl}
                        alt="添付画像"
                        className="block w-full h-auto max-h-[320px] object-contain"
                    />
                </div>
            </button>
        );
    }

    if (msg.messageType === "FILE") {
        return (
            <a
                href={msg.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg mb-2 text-[13px] font-medium underline-offset-2 hover:underline ${isMine ? "bg-white/10 text-white" : "bg-[#F0F5F2] text-[#005B5B]"
                    }`}
            >
                <span aria-hidden>📎</span>
                {getAttachmentFileName(msg.attachmentUrl, msg.content)}
            </a>
        );
    }

    return null;
}

type ChatClientProps = {
    initialChats?: ChatSessionItem[];
    initialMessages?: ChatMessage[];
    initialSessionId?: number | null;
};

export default function ChatClient({
    initialChats = [],
    initialMessages = [],
    initialSessionId = null,
}: ChatClientProps = {}) {
    const searchParams = useSearchParams();
    const preferredSessionId = useMemo(() => {
        const raw = searchParams.get("session");
        const parsed = raw ? Number(raw) : null;
        return parsed && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [searchParams]);

    const cachedInbox = readChatInboxCache(preferredSessionId);
    const [chats, setChats] = useState<ChatSessionItem[]>(
        cachedInbox?.chats ?? initialChats
    );
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
        cachedInbox?.activeSessionId ?? initialSessionId
    );
    const [messages, setMessages] = useState<ChatMessage[]>(
        cachedInbox?.messages ?? initialMessages
    );
    const [isBootstrapping, setIsBootstrapping] = useState(
        !cachedInbox && initialChats.length === 0
    );
    const { user: authUser } = useAuth();
    const currentUser = authUser as SessionUser | null;
    const [searchQuery, setSearchQuery] = useState("");
    const [messageText, setMessageText] = useState("");
    const [isTranslationOn, setIsTranslationOn] = useState(true);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const skipSessionFetchRef = useRef(Boolean(cachedInbox || initialMessages.length > 0));
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);
    const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<{ url: string; fileName: string } | null>(
        null
    );
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);
    const [isUnblocking, setIsUnblocking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const selectedSessionIdRef = useRef<number | null>(null);
    const currentUserIdRef = useRef<number | undefined>(undefined);
    selectedSessionIdRef.current = selectedSessionId;
    currentUserIdRef.current = currentUser?.id;

    const selectedChat = useMemo(
        () => chats.find((c) => c.id === selectedSessionId) ?? null,
        [chats, selectedSessionId]
    );

    const selectedBlockStatus = selectedChat?.blockStatus;
    const composerLockedByBlock = isComposerLockedByBlock(selectedBlockStatus);
    const isBlockActiveForSession = isBlockActive(selectedBlockStatus);
    const blockBannerMessage = getBlockBannerMessage(selectedBlockStatus);

    const applyBlockStatusToChat = useCallback(
        (sessionId: number, blockStatus: ChatBlockStatus) => {
            setChats((prev) =>
                prev.map((chat) =>
                    chat.id === sessionId ? { ...chat, blockStatus } : chat
                )
            );
            patchChatInboxCacheAfterBlock(sessionId, blockStatus);
        },
        []
    );

    const filteredChats = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return chats;
        return chats.filter((chat) => {
            const name = getDisplayName(chat.targetUser).toLowerCase();
            const preview = getMessagePreview(chat.lastMessage).toLowerCase();
            return name.includes(q) || preview.includes(q);
        });
    }, [chats, searchQuery]);

    useEffect(() => {
        if (cachedInbox) {
            setIsBootstrapping(false);
            return;
        }

        let cancelled = false;

        void (async () => {
            const result = await fetchChatInboxClient({ sessionId: preferredSessionId });
            if (cancelled) return;

            if (!result.success) {
                setError(result.message);
                setChats([]);
                setMessages([]);
                setSelectedSessionId(null);
                setIsBootstrapping(false);
                return;
            }

            setChats(result.data.chats);
            setMessages(result.data.messages);
            setSelectedSessionId(result.data.activeSessionId);
            skipSessionFetchRef.current = true;
            setError(null);
            setIsBootstrapping(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [cachedInbox, preferredSessionId]);

    const loadMessages = useCallback(async (sessionId: number) => {
        setIsLoadingMessages(true);
        const res = await fetchChatMessagesClient(sessionId);
        setIsLoadingMessages(false);
        if (!res.success) {
            setError(res.message);
            setMessages([]);
            return;
        }
        setMessages(res.data);
        setError(null);
        setChats((prev) =>
            prev.map((c) => (c.id === sessionId ? { ...c, unreadCount: 0 } : c))
        );
    }, []);

    useEffect(() => {
        if (skipSessionFetchRef.current) {
            skipSessionFetchRef.current = false;
            return;
        }
        if (!selectedSessionId) {
            setMessages([]);
            return;
        }
        const cached = readChatInboxCache();
        if (
            cached?.activeSessionId === selectedSessionId &&
            cached.messages.length > 0
        ) {
            setMessages(cached.messages);
            return;
        }
        loadMessages(selectedSessionId);
    }, [selectedSessionId, loadMessages]);

    const handleNewMessage = useCallback((message: ChatMessage) => {
        const activeSessionId = selectedSessionIdRef.current;

        setChats((prev) =>
            prev.map((chat) => {
                if (chat.id !== message.sessionId) return chat;
                const isActiveSession = message.sessionId === activeSessionId;
                return {
                    ...chat,
                    lastMessage: message,
                    unreadCount: isActiveSession ? 0 : chat.unreadCount + 1,
                };
            })
        );

        if (message.sessionId !== activeSessionId) return;

        setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
        });
    }, []);

    const handleSeenMessage = useCallback((payload: { sessionId: number; userId: number }) => {
        if (payload.sessionId !== selectedSessionIdRef.current) return;
        const myId = currentUserIdRef.current;
        if (!myId || payload.userId === myId) return;

        setMessages((prev) =>
            prev.map((m) => (m.senderId === myId ? { ...m, isSeen: true } : m))
        );
    }, []);

    const handleOnlineStatus = useCallback((payload: { userId: number; online: boolean }) => {
        setChats((prev) =>
            prev.map((chat) => {
                if (chat.targetUser?.id !== payload.userId) return chat;
                return {
                    ...chat,
                    targetUser: { ...chat.targetUser!, isOnline: payload.online },
                };
            })
        );
    }, []);

    const handleMessageEdited = useCallback(
        (payload: { messageId: number; newContent: string }) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === payload.messageId ? { ...m, content: payload.newContent } : m
                )
            );
        },
        []
    );

    const handleMessageDeleted = useCallback((payload: { messageId: number }) => {
        setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
    }, []);

    const handleMessageTranslated = useCallback(
        (payload: { messageId: number; translatedText: ChatMessage["translatedText"] }) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === payload.messageId
                        ? { ...m, translatedText: payload.translatedText }
                        : m
                )
            );
        },
        []
    );

    const handleChatBlocked = useCallback(
        (payload: {
            sessionId: number;
            blockedByUserId: number;
            blockedTargetUserId: number;
        }) => {
            const myId = currentUserIdRef.current;
            if (!myId) return;

            const blockStatus = resolveBlockStatusFromPayload(payload, myId);
            applyBlockStatusToChat(payload.sessionId, blockStatus);

            if (payload.sessionId === selectedSessionIdRef.current) {
                setPendingAttachment(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                if (imageInputRef.current) imageInputRef.current.value = "";
            }
        },
        [applyBlockStatusToChat]
    );

    const handleChatUnblocked = useCallback(
        (payload: {
            sessionId: number | null;
            unblockedByUserId: number;
            unblockedTargetUserId: number;
        }) => {
            const myId = currentUserIdRef.current;
            if (!myId) return;

            const clearedStatus: ChatBlockStatus = {
                blockedByMe: false,
                blockedByThem: false,
            };

            if (payload.sessionId) {
                applyBlockStatusToChat(payload.sessionId, clearedStatus);
                return;
            }

            setChats((prev) =>
                prev.map((chat) => {
                    const targetId = chat.targetUser?.id;
                    if (
                        targetId !== payload.unblockedByUserId &&
                        targetId !== payload.unblockedTargetUserId
                    ) {
                        return chat;
                    }
                    patchChatInboxCacheAfterBlock(chat.id, clearedStatus);
                    return { ...chat, blockStatus: clearedStatus };
                })
            );
        },
        [applyBlockStatusToChat]
    );

    useChatSocket({
        userId: currentUser?.id,
        sessionId: selectedSessionId,
        onNewMessage: handleNewMessage,
        onSeenMessage: handleSeenMessage,
        onOnlineStatus: handleOnlineStatus,
        onMessageEdited: handleMessageEdited,
        onMessageDeleted: handleMessageDeleted,
        onMessageTranslated: handleMessageTranslated,
        onChatBlocked: handleChatBlocked,
        onChatUnblocked: handleChatUnblocked,
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, selectedSessionId]);

    const handleSelectChat = (sessionId: number) => {
        setSelectedSessionId(sessionId);
    };

    useEffect(() => {
        if (!pendingAttachment) {
            setAttachmentPreviewUrl(null);
            return;
        }
        if (!pendingAttachment.type.startsWith("image/")) {
            setAttachmentPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(pendingAttachment);
        setAttachmentPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [pendingAttachment]);

    const clearPendingAttachment = () => {
        setPendingAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("ファイルサイズは5MB以下にしてください。");
            e.target.value = "";
            return;
        }
        setError(null);
        setPendingAttachment(file);
    };

    const handleSend = async () => {
        const text = messageText.trim();
        if (
            (!text && !pendingAttachment) ||
            !selectedSessionId ||
            isSending ||
            composerLockedByBlock
        ) {
            return;
        }

        setIsSending(true);
        const res = pendingAttachment
            ? await sendMessageWithAttachmentAction(selectedSessionId, pendingAttachment, text || undefined)
            : await sendChatMessageClient(selectedSessionId, text);
        setIsSending(false);

        if (!res.success) {
            setError(res.message);
            return;
        }

        setMessageText("");
        clearPendingAttachment();
        setMessages((prev) => {
            if (prev.some((m) => m.id === res.data.id)) return prev;
            return [...prev, res.data];
        });
        setChats((prev) => bumpChatInboxAfterSend(prev, res.data, selectedSessionId));
        patchChatInboxCacheAfterSend(res.data, selectedSessionId);
        setError(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleBlock = async () => {
        const targetUserId = selectedChat?.targetUser?.id;
        if (!targetUserId || !selectedSessionId || isBlocking || isBlockActiveForSession) return;

        setIsBlocking(true);
        const res = await blockUserAction(targetUserId);
        setIsBlocking(false);

        if (!res.success) {
            setError(res.message);
            return;
        }

        setBlockDialogOpen(false);
        applyBlockStatusToChat(
            selectedSessionId,
            res.data?.blockStatus ?? { blockedByMe: true, blockedByThem: false }
        );
        clearPendingAttachment();
        setMessageText("");
        setError(null);
    };

    const handleUnblock = async () => {
        const targetUserId = selectedChat?.targetUser?.id;
        if (!targetUserId || !selectedSessionId || isUnblocking) return;

        setIsUnblocking(true);
        const res = await unblockUserAction(targetUserId);
        setIsUnblocking(false);

        if (!res.success) {
            setError(res.message);
            return;
        }

        applyBlockStatusToChat(selectedSessionId, {
            blockedByMe: false,
            blockedByThem: false,
        });
        setError(null);
    };

    return (
        <div
            className={`flex w-full h-screen bg-[#F6FAF8] overflow-hidden ${isBootstrapping ? "opacity-90" : ""}`}
            style={{ fontFamily: "'Manrope', 'Noto Sans JP', 'Plus Jakarta Sans', sans-serif" }}
        >
            <Sidebar />

            <aside className="w-[320px] bg-[#F0F5F2] border-r border-[#BEC9C8]/30 flex flex-col shrink-0">
                <div className="flex flex-col gap-4 p-6 pb-4 shrink-0">
                    <div className="flex justify-between items-center">
                        <h2 className="text-[20px] font-medium text-[#181D1B]">メッセージ</h2>
                    </div>

                    <div className="relative w-full">
                        <svg
                            className="absolute left-3.5 top-1/2 -translate-y-1/2"
                            width="14"
                            height="14"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M16.6 18L10.3 11.7C9.8 12.1 9.225 12.4167 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13C4.68333 13 3.14583 12.3708 1.8875 11.1125C0.629167 9.85417 0 8.31667 0 6.5C0 4.68333 0.629167 3.14583 1.8875 1.8875C3.14583 0.629167 4.68333 0 6.5 0C8.31667 0 9.85417 0.629167 11.1125 1.8875C12.3708 3.14583 13 4.68333 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.4167 9.225 12.1 9.8 11.7 10.3L18 16.6L16.6 18ZM6.5 11C7.75 11 8.8125 10.5625 9.6875 9.6875C10.5625 8.8125 11 7.75 11 6.5C11 5.25 10.5625 4.1875 9.6875 3.3125C8.4375 4.1875 8 5.25 8 6.5C8 7.75 8.4375 8.8125 9.3125 9.6875C10.1875 10.5625 11.25 11 12.5 11Z"
                                fill="#6E7979"
                            />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="メッセージを検索"
                            className="w-full h-[35px] bg-[#DFE3E1] rounded-xl pl-10 pr-4 text-[12px] font-medium text-[#181D1B] placeholder:text-[#6E7979] focus:outline-none focus:ring-1 focus:ring-[#005B5B]/30"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-6 flex flex-col gap-1 hide-scrollbar">
                    {isLoadingChats && (
                        <p className="text-center text-[12px] text-[#6E7979] py-8">読み込み中...</p>
                    )}
                    {!isLoadingChats && filteredChats.length === 0 && (
                        <p className="text-center text-[12px] text-[#6E7979] py-8 px-4">
                            まだメッセージがありません。マッチングから会話を始めましょう。
                        </p>
                    )}
                    {filteredChats.map((chat) => {
                        const isActive = chat.id === selectedSessionId;
                        const target = chat.targetUser;
                        const preview = getMessagePreview(chat.lastMessage);
                        const time = formatChatListTime(chat.lastMessage?.sendAt ?? chat.createdAt);

                        return (
                            <button
                                key={chat.id}
                                type="button"
                                onClick={() => handleSelectChat(chat.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors text-left ${isActive
                                    ? "bg-white border border-[#005B5B]/10 shadow-sm"
                                    : "hover:bg-white/40 border border-transparent"
                                    }`}
                            >
                                <div className="relative w-12 h-12 shrink-0">
                                    <Image
                                        src={getAvatarUrl(target?.avatarUrl)}
                                        alt={getDisplayName(target)}
                                        fill
                                        className="object-cover rounded-full bg-gray-200"
                                    />
                                    {target?.isOnline && (
                                        <div className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-[#22C55E] border-2 border-white rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-[14px] font-bold text-[#181D1B] truncate">
                                            {getDisplayName(target)}
                                        </span>
                                        <span
                                            className={`text-[10px] font-medium shrink-0 ${isActive ? "text-[#923118]" : "text-[#6E7979]"
                                                }`}
                                        >
                                            {time}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-[#3E4948] truncate">{preview}</p>
                                </div>
                                {chat.unreadCount > 0 && (
                                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#923118] text-white text-[10px] font-bold flex items-center justify-center">
                                        {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </aside>

            <main className="flex-1 flex flex-col bg-[#F6FAF8] relative">
                {!selectedChat ? (
                    <div className="flex-1 flex items-center justify-center text-[#6E7979] text-[14px]">
                        {isLoadingChats ? "読み込み中..." : "会話を選択してください"}
                    </div>
                ) : (
                    <>
                        <header className="shrink-0 w-full h-[64px] px-6 flex items-center justify-between bg-white/70 backdrop-blur-[12px] border-b border-[#BEC9C8]/20 z-10">
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 shrink-0">
                                    <Image
                                        src={getAvatarUrl(selectedChat.targetUser?.avatarUrl)}
                                        alt={getDisplayName(selectedChat.targetUser)}
                                        fill
                                        className="object-cover rounded-full bg-gray-200"
                                    />
                                    {selectedChat.targetUser?.isOnline && (
                                        <div className="absolute right-0 bottom-0 w-3 h-3 bg-[#22C55E] border-2 border-white rounded-full" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[14px] font-bold text-[#181D1B] leading-5">
                                        {getDisplayName(selectedChat.targetUser)}
                                    </span>
                                    <span
                                        className={`text-[10px] font-medium leading-tight ${selectedChat.targetUser?.isOnline
                                            ? "text-[#16A34A]"
                                            : "text-[#6E7979]"
                                            }`}
                                    >
                                        {selectedChat.targetUser?.isOnline ? "オンライン" : "オフライン"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsTranslationOn(!isTranslationOn)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#005B5B]/20 rounded-full hover:bg-[#005B5B]/5 transition-colors"
                                >
                                    <span className="text-[12px] font-medium text-[#005B5B]">
                                        翻訳サポート{isTranslationOn ? "ON" : "OFF"}
                                    </span>
                                </button>
                                {selectedChat.targetUser && (
                                    <Link
                                        href={`/profile/${selectedChat.targetUser.id}`}
                                        className="flex items-center justify-center w-10 h-10 border border-[#BEC9C8] rounded-2xl hover:bg-[#F0F5F2] transition-colors"
                                        aria-label="プロフィールを見る"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                                            <circle cx="9" cy="9" r="7.5" stroke="#6E7979" strokeWidth="1.5" />
                                            <path
                                                d="M9 8.25C9.41421 8.25 9.75 7.91421 9.75 7.5C9.75 7.08579 9.41421 6.75 9 6.75C8.58579 6.75 8.25 7.08579 8.25 7.5C8.25 7.91421 8.58579 8.25 9 8.25Z"
                                                fill="#6E7979"
                                            />
                                            <path d="M9 9.75V12" stroke="#6E7979" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </Link>
                                )}
                                {!isBlockActiveForSession && selectedChat.targetUser && (
                                    <button
                                        type="button"
                                        onClick={() => setBlockDialogOpen(true)}
                                        disabled={isBlocking}
                                        className="flex items-center justify-center w-10 h-10 border border-[#BEC9C8] rounded-2xl hover:bg-[#F0F5F2] transition-colors disabled:opacity-40"
                                        aria-label="ブロック"
                                    >
                                        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
                                            <circle cx="8.5" cy="8.5" r="7" stroke="#6E7979" strokeWidth="1.5" />
                                            <path d="M3 8.5H14" stroke="#6E7979" strokeWidth="1.5" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </header>

                        {error && (
                            <div className="mx-6 mt-3 px-4 py-2 bg-red-50 text-red-700 text-[12px] rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col hide-scrollbar relative">
                            {isLoadingMessages && messages.length === 0 && (
                                <p className="text-center text-[12px] text-[#6E7979]">メッセージを読み込み中...</p>
                            )}
                            {!isLoadingMessages && messages.length === 0 && (
                                <p className="text-center text-[12px] text-[#6E7979]">
                                    最初のメッセージを送ってみましょう
                                </p>
                            )}
                            {messages.map((msg, index) => {
                                const isMine = currentUser?.id === msg.senderId;
                                const translatedPreview = resolveTranslatedText(msg.translatedText);
                                const showDateMarker =
                                    index === 0 ||
                                    !isSameDay(msg.sendAt, messages[index - 1].sendAt);
                                const dateLabel = new Date(msg.sendAt).toLocaleDateString("ja-JP", {
                                    month: "long",
                                    day: "numeric",
                                    weekday: "short",
                                });

                                const hasImage = Boolean(msg.attachmentUrl && isImageAttachment(msg));
                                const hasText = Boolean(msg.content?.trim());

                                if (isMine) {
                                    return (
                                        <div key={msg.id}>
                                            {showDateMarker && (
                                                <div className="w-full flex justify-center my-2">
                                                    <span className="bg-[#EAEFEC] text-[#6E7979] text-[10px] font-medium uppercase tracking-[1px] px-3 py-1 rounded-full">
                                                        {dateLabel}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="w-full flex flex-col items-end gap-1 mt-6 pl-12">
                                                {hasText && hasImage ? (
                                                    <div className="flex flex-col items-end gap-2 w-full">
                                                        <div className="bg-[#005B5B] shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1)] rounded-[16px] rounded-tr-none p-4 max-w-[80%]">
                                                            <p className="text-[14px] font-medium text-white leading-[23px] text-right whitespace-pre-wrap">
                                                                {msg.content}
                                                            </p>
                                                        </div>
                                                        <div className="shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1)] rounded-[16px] rounded-tr-none p-1 bg-transparent max-w-[80%]">
                                                            <MessageAttachment
                                                                msg={msg}
                                                                isMine
                                                                onImageClick={(url, fileName) =>
                                                                    setPreviewImage({ url, fileName })
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1)] rounded-[16px] rounded-tr-none max-w-[80%] ${
                                                            hasImage && !hasText
                                                                ? "p-1 bg-transparent"
                                                                : "p-4 bg-[#005B5B]"
                                                        }`}
                                                    >
                                                        <MessageAttachment
                                                            msg={msg}
                                                            isMine
                                                            onImageClick={(url, fileName) =>
                                                                setPreviewImage({ url, fileName })
                                                            }
                                                        />
                                                        {hasText && (
                                                            <p className="text-[14px] font-medium text-white leading-[23px] text-right whitespace-pre-wrap">
                                                                {msg.content}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1.5 mr-1">
                                                    {msg.isSeen && (
                                                        <span className="text-[10px] font-medium text-[#005B5B]">
                                                            既読
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-medium text-[#6E7979]">
                                                        {formatMessageTime(msg.sendAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id}>
                                        {showDateMarker && (
                                            <div className="w-full flex justify-center my-2">
                                                <span className="bg-[#EAEFEC] text-[#6E7979] text-[10px] font-medium uppercase tracking-[1px] px-3 py-1 rounded-full">
                                                    {dateLabel}
                                                </span>
                                            </div>
                                        )}
                                        <div className="w-full flex items-start gap-3 mt-4">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative shrink-0">
                                                <Image
                                                    src={getAvatarUrl(msg.sender.avatarUrl)}
                                                    alt={getDisplayName(msg.sender)}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex flex-col items-start gap-1 max-w-[80%]">
                                                {hasText && hasImage ? (
                                                    <div className="flex flex-col items-start gap-2 w-full">
                                                        <div className="bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-[16px] rounded-tl-none p-4 w-full border border-transparent">
                                                            <p className="text-[14px] font-medium text-[#3E4948] leading-[23px] whitespace-pre-wrap">
                                                                {msg.content}
                                                            </p>
                                                            {isTranslationOn && translatedPreview && msg.messageType === "TEXT" && (
                                                                <>
                                                                    <div className="w-full h-px bg-[#F1F5F9] my-2" />
                                                                    <p className="text-[11px] font-medium italic text-[#005B5B]/60 leading-[18px]">
                                                                        {translatedPreview}
                                                                    </p>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-[16px] rounded-tl-none p-1 w-full bg-transparent border border-transparent">
                                                            <MessageAttachment
                                                                msg={msg}
                                                                isMine={false}
                                                                onImageClick={(url, fileName) =>
                                                                    setPreviewImage({ url, fileName })
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-[16px] rounded-tl-none w-full border border-transparent ${
                                                            hasImage && !hasText
                                                                ? "p-1 bg-transparent"
                                                                : "p-4 bg-white"
                                                        }`}
                                                    >
                                                        <MessageAttachment
                                                            msg={msg}
                                                            isMine={false}
                                                            onImageClick={(url, fileName) =>
                                                                setPreviewImage({ url, fileName })
                                                            }
                                                        />
                                                        {hasText && (
                                                            <p className="text-[14px] font-medium text-[#3E4948] leading-[23px] whitespace-pre-wrap">
                                                                {msg.content}
                                                            </p>
                                                        )}
                                                        {isTranslationOn && translatedPreview && msg.messageType === "TEXT" && (
                                                            <>
                                                                <div className="w-full h-px bg-[#F1F5F9] my-2" />
                                                                <p className="text-[11px] font-medium italic text-[#005B5B]/60 leading-[18px]">
                                                                    {translatedPreview}
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                <span className="text-[10px] font-medium text-[#6E7979] ml-1">
                                                    {formatMessageTime(msg.sendAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="shrink-0 w-full bg-white border-t border-[#BEC9C8]/20 p-6 flex flex-col items-stretch gap-2 box-border z-10">
                            {!composerLockedByBlock && (pendingAttachment || attachmentPreviewUrl) && (
                                attachmentPreviewUrl ? (
                                    <div className="w-full rounded-xl border border-[#BEC9C8]/30 bg-[#F0F5F2] overflow-hidden">
                                        <div className="flex justify-center w-full bg-black/5 p-2">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={attachmentPreviewUrl}
                                                alt="プレビュー"
                                                className="max-w-full w-auto h-auto max-h-[min(60vh,480px)] object-contain rounded-lg"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 px-3 py-2">
                                            <p className="flex-1 min-w-0 text-[13px] font-medium text-[#181D1B] truncate">
                                                {pendingAttachment?.name}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={clearPendingAttachment}
                                                className="shrink-0 text-[12px] font-medium text-[#6E7979] hover:text-[#181D1B] px-2"
                                            >
                                                取消
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 w-full bg-[#F0F5F2] p-2 rounded-lg border border-[#BEC9C8]/30">
                                        <div className="w-10 h-10 rounded-lg bg-[#EAEFEC] flex items-center justify-center text-xl shrink-0">
                                            📎
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium text-[#181D1B] truncate">
                                                {pendingAttachment?.name}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearPendingAttachment}
                                            className="text-[12px] font-medium text-[#6E7979] hover:text-[#181D1B] px-2"
                                        >
                                            取消
                                        </button>
                                    </div>
                                )
                            )}

                            {!composerLockedByBlock && (
                            <div className="flex flex-row items-end gap-3 w-full min-h-[44px]">
                                <div className="flex flex-row items-start gap-1 pb-1 shrink-0 h-[40px]">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt,.zip"
                                        className="hidden"
                                        onChange={handleAttachmentSelect}
                                    />
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAttachmentSelect}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSending || composerLockedByBlock}
                                        className="flex items-center justify-center w-[36px] h-[36px] rounded-[12px] p-[8px] hover:bg-black/5 transition-colors disabled:opacity-40"
                                        aria-label="ファイルを添付"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 15H11V11H15V9H11V5H9V9H5V11H9V15ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z" fill="#005B5B" />
                                        </svg>

                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={isSending || composerLockedByBlock}
                                        className="flex items-center justify-center w-[34px] h-[34px] rounded-[12px] p-[8px] hover:bg-black/5 transition-colors disabled:opacity-40"
                                        aria-label="画像を添付"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979167 18 1.45 18 2V16C18 16.55 17.8042 17.0208 17.4125 17.4125C17.0208 17.8042 16.55 18 16 18H2ZM2 16H16V2H2V16ZM3 14H15L11.25 9L8.25 13L6 10L3 14ZM2 16V2V16Z" fill="#005B5B" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="relative flex-1 h-[44px] min-w-0 isolate">
                                    <textarea
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="メッセージを入力..."
                                        disabled={isSending || composerLockedByBlock}
                                        rows={1}
                                        className="w-full h-[44px] min-h-[44px] max-h-[128px] bg-[#F0F5F2] rounded-[16px] py-3 pl-4 pr-12 text-[14px] font-medium leading-[20px] text-[#181D1B] placeholder:text-[#6E7979] resize-none focus:outline-none focus:ring-1 focus:ring-[#005B5B]/30 disabled:opacity-60 box-border z-0"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSend}
                                        disabled={
                                            (!messageText.trim() && !pendingAttachment) ||
                                            isSending ||
                                            composerLockedByBlock
                                        }
                                        className="absolute right-[12px] bottom-[10px] z-10 flex items-center justify-center w-[23px] h-[21px] rounded-[12px] bg-[#005B5B] hover:opacity-90 transition-opacity disabled:opacity-40"
                                        aria-label="送信"
                                    >
                                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M0 9.33333V5.83333L4.66667 4.66667L0 3.5V0L11.0833 4.66667L0 9.33333Z" fill="white" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            )}

                            {blockBannerMessage && (
                                <div className="w-full px-4 py-3 bg-[#FFF7ED] text-[#9A3412] text-[13px] font-medium text-center rounded-xl border border-[#FDBA74]/40 flex flex-col items-center gap-2">
                                    <p>{blockBannerMessage}</p>
                                    {selectedBlockStatus?.blockedByMe && (
                                        <button
                                            type="button"
                                            onClick={handleUnblock}
                                            disabled={isUnblocking}
                                            className="px-4 py-1.5 rounded-full bg-[#005B5B] text-white text-[12px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                                        >
                                            {isUnblocking ? "処理中..." : "ブロック解除"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            {previewImage && (
                <ChatImagePreview
                    imageUrl={previewImage.url}
                    fileName={previewImage.fileName}
                    onClose={() => setPreviewImage(null)}
                />
            )}

            <BlockConfirmDialog
                open={blockDialogOpen}
                isBusy={isBlocking}
                onConfirm={handleBlock}
                onCancel={() => setBlockDialogOpen(false)}
            />
        </div>
    );
}

