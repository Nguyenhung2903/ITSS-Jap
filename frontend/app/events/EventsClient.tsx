"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopNav from "@/components/layouts/TopNav";
import EventCard, { type EventCardData } from "@/components/events/EventCard";
import { engageEventAction } from "@/app/actions/event";
import { formatApiEvent } from "@/lib/events-format";
import { MIN_SEARCH_LENGTH, normalizeSearchQuery, SEARCH_DEBOUNCE_MS } from "@/lib/search";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useAuth } from "@/lib/auth-context";
import {
    fetchEventsListClient,
    readEventsCache,
    type EventFormat,
} from "@/lib/events-client";

const CreateEventModal = dynamic(
    () => import("@/components/events/CreateEventModal"),
    { ssr: false }
);

type TabFilter = "all" | "offline" | "online";

const TAB_OPTIONS: { id: TabFilter; label: string }[] = [
    { id: "all", label: "全て" },
    { id: "offline", label: "対面のみ" },
    { id: "online", label: "オンラインのみ" },
];

type EventsClientProps = {
    initialEvents?: EventCardData[];
    initialHasMore?: boolean;
    initialError?: string | null;
    currentUserId?: number;
    isAuthenticated?: boolean;
};

export default function EventsClient({
    initialEvents = [],
    initialHasMore = false,
    initialError = null,
}: EventsClientProps = {}) {
    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
    const currentUserId = user?.id;

    const [events, setEvents] = useState<EventCardData[]>(initialEvents);
    const [activeTab, setActiveTab] = useState<TabFilter>("all");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isBootstrapping, setIsBootstrapping] = useState(!initialError);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [joiningId, setJoiningId] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createSuccess, setCreateSuccess] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
    const prevFiltersRef = useRef<string | null>(null);
    const fetchRequestIdRef = useRef(0);
    const hasEventsRef = useRef(events.length > 0);
    hasEventsRef.current = events.length > 0;

    const loadEvents = useCallback(
        async (pageNum: number, tab: TabFilter, search: string, append = false) => {
            const requestId = ++fetchRequestIdRef.current;
            const format: EventFormat = tab === "all" ? "all" : tab;

            if (append) {
                setIsLoadingMore(true);
            } else if (hasEventsRef.current) {
                setIsRefreshing(true);
                setErrorMessage(null);
            } else {
                setIsLoading(true);
                setErrorMessage(null);
            }

            const result = await fetchEventsListClient({
                page: pageNum,
                format,
                search: normalizeSearchQuery(search),
            });

            if (requestId !== fetchRequestIdRef.current) return;

            if (result.success) {
                const formatted = result.data.data.map((e) => formatApiEvent(e, currentUserId));
                setEvents((prev) => (append ? [...prev, ...formatted] : formatted));
                setHasMore(result.data.hasMore);
                if (pageNum === 1) setPage(1);
            } else if (pageNum === 1) {
                setEvents([]);
                setHasMore(false);
                setErrorMessage(result.message ?? "イベントの取得に失敗しました。");
            }

            setIsLoading(false);
            setIsRefreshing(false);
            if (pageNum === 1) setIsBootstrapping(false);
            else setIsLoadingMore(false);
        },
        [currentUserId]
    );

    useEffect(() => {
        if (isAuthLoading) return;
        if (!isAuthenticated || !currentUserId) {
            setEvents([]);
            setErrorMessage("ログインしてください。");
            setIsBootstrapping(false);
            return;
        }

        const cached = readEventsCache("all", 1);
        if (cached) {
            setEvents(cached.data.map((e) => formatApiEvent(e, currentUserId)));
            setHasMore(cached.hasMore);
            setIsBootstrapping(false);
            return;
        }

        void loadEvents(1, "all", "");
    }, [isAuthLoading, isAuthenticated, currentUserId, loadEvents]);

    const filterKey = JSON.stringify({ activeTab, debouncedSearchQuery });

    useEffect(() => {
        if (isAuthLoading || !isAuthenticated || isBootstrapping) return;

        if (prevFiltersRef.current === null) {
            prevFiltersRef.current = filterKey;
            return;
        }
        if (prevFiltersRef.current === filterKey) return;

        prevFiltersRef.current = filterKey;
        setPage(1);
        void loadEvents(1, activeTab, debouncedSearchQuery);
    }, [filterKey, isAuthLoading, isAuthenticated, isBootstrapping, activeTab, debouncedSearchQuery, loadEvents]);

    const hasPendingSearch =
        searchQuery.trim().length > 0 &&
        normalizeSearchQuery(searchQuery) === undefined;

    const handleJoin = useCallback(async (eventId: number) => {
        setJoiningId(eventId);
        setJoinError(null);

        const result = await engageEventAction(eventId);
        if (result.success) {
            setEvents((prev) =>
                prev.map((e) =>
                    e.id === eventId
                        ? {
                              ...e,
                              isJoined: true,
                              extraMemberCount: e.extraMemberCount + (e.isJoined ? 0 : 1),
                          }
                        : e
                )
            );
        } else {
            setJoinError(result.message ?? "参加に失敗しました。");
        }

        setJoiningId(null);
    }, []);

    const handleTabChange = (tab: TabFilter) => {
        if (tab === activeTab) return;
        setPage(1);
        setActiveTab(tab);
    };

    const handleLoadMore = () => {
        if (!hasMore || isLoadingMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadEvents(nextPage, activeTab, debouncedSearchQuery, true);
    };

    return (
        <div className="flex min-h-screen w-full flex-row bg-[#F6FAF8]" style={{ fontFamily: "Manrope, 'Noto Sans JP', sans-serif" }}>
            <Sidebar />
            <main className="flex flex-1 flex-col items-stretch">
                <div className="bg-[#EEF5F2] [&_h2]:text-[24px] [&_h2]:font-bold [&_h2]:text-[#036A6A] [&_h2]:leading-8 [&_h2]:tracking-[-0.6px]">
                    <TopNav
                        title="イベント一覧"
                        backLink="/community"
                        showSearch
                        searchPlaceholder="イベントを検索..."
                        searchValue={searchQuery}
                        onSearch={setSearchQuery}
                    />
                </div>

                <div className="flex w-full flex-col items-center px-8 py-12">
                    <div className="flex w-full max-w-[960px] flex-col gap-[15px]">
                        <header className="flex flex-col gap-6 border-b border-[rgba(169,180,177,0.15)] pb-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-1">
                                <h1 className="text-[24px] font-bold leading-8 text-[#2A3432]">コミュニティイベント</h1>
                                <p className="text-[14px] leading-5 text-[#727D7A]">
                                    言語と文化をつなぐ、特別な体験に参加しましょう
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCreateModalOpen(true)}
                                className="flex shrink-0 items-center gap-2 rounded-full bg-[#036A6A] px-6 py-2.5 text-[14px] font-bold text-[#E0FFFE] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-90"
                            >
                                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                                    <path d="M4.5 0V9M0 4.5H9" stroke="#E0FFFE" strokeWidth="1.5" />
                                </svg>
                                イベントを作成
                            </button>
                        </header>

                        <div className="flex flex-wrap gap-2">
                            {TAB_OPTIONS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
                                        activeTab === tab.id
                                            ? "bg-[#E1EAE7] text-[#536261]"
                                            : "text-[#56615F] hover:bg-[#E1EAE7]/50"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {createSuccess && (
                            <div className="rounded-lg border border-[rgba(3,106,106,0.2)] bg-[rgba(3,106,106,0.06)] px-4 py-3 text-[14px] text-[#036A6A]">
                                {createSuccess}
                            </div>
                        )}

                        {errorMessage && (
                            <div className="rounded-lg border border-[#E8B4B0] bg-[#FFF7F6] px-4 py-3 text-[14px] text-[#A43E24]">
                                <p>{errorMessage}</p>
                                {isAuthenticated === false && (
                                    <Link
                                        href="/login"
                                        className="mt-2 inline-block font-bold text-[#036A6A] underline"
                                    >
                                        ログインページへ
                                    </Link>
                                )}
                            </div>
                        )}

                        {joinError && (
                            <div className="rounded-lg border border-[#E8B4B0] bg-[#FFF7F6] px-4 py-3 text-[14px] text-[#A43E24]">
                                {joinError}
                            </div>
                        )}

                        <div className="flex flex-col gap-12 pt-4">
                            {isBootstrapping || (isLoading && events.length === 0) ? (
                                [1, 2, 3].map((s) => (
                                    <div
                                        key={s}
                                        className="h-[400px] w-full animate-pulse rounded-xl bg-white/80"
                                    />
                                ))
                            ) : events.length > 0 ? (
                                <div className={`flex flex-col gap-12 transition-opacity ${isRefreshing ? "opacity-60" : ""}`}>
                                {events.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        onJoin={handleJoin}
                                        isJoining={joiningId === event.id}
                                    />
                                ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-[rgba(169,180,177,0.3)] bg-white px-6 py-16 text-center text-[14px] text-[#727D7A]">
                                    {errorMessage ? (
                                        "イベントを読み込めませんでした。"
                                    ) : (
                                        <>
                                            <p>
                                                {hasPendingSearch
                                                    ? `${MIN_SEARCH_LENGTH}文字以上入力してください。`
                                                    : normalizeSearchQuery(searchQuery)
                                                      ? `「${normalizeSearchQuery(searchQuery)}」に一致するイベントはありません。`
                                                      : activeTab === "offline"
                                                        ? "対面のイベントはありません。"
                                                        : activeTab === "online"
                                                          ? "オンラインのイベントはありません。"
                                                          : "表示できるイベントがありません。"}
                                            </p>
                                            {activeTab === "all" && !normalizeSearchQuery(searchQuery) && !hasPendingSearch && (
                                                <p className="mt-2 text-[13px] leading-5">
                                                    一覧には「承認済み（APPROVED）」かつ「開催日が未来」のイベントのみ表示されます。
                                                    作成直後は承認待ち（PENDING）のため表示されません。
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {!isBootstrapping && !isLoading && events.length > 0 && hasMore && (
                            <div className="flex justify-center pt-10">
                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                    className="flex items-center gap-2 rounded-full bg-[#E1EAE7] px-6 py-3 text-[14px] font-bold text-[#036A6A] transition-opacity hover:opacity-90 disabled:opacity-60"
                                >
                                    {isLoadingMore ? "読み込み中…" : "もっとイベントを表示"}
                                    <svg width="7" height="5" viewBox="0 0 7 5" fill="none" aria-hidden>
                                        <path d="M3.5 5L0 0.5H7L3.5 5Z" fill="#036A6A" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <CreateEventModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreated={() => {
                    setCreateSuccess("イベントを作成しました。管理者の承認後に公開されます。");
                    setPage(1);
                    loadEvents(1, activeTab, debouncedSearchQuery);
                }}
            />
        </div>
    );
}
