"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopNav from "@/components/layouts/TopNav";
import {
    fetchMatchingHomeClient,
    readMatchingHomeCache,
    searchMatchingUsers,
} from "@/lib/matching-client";
import { resolveImageUrl } from "@/lib/image";
import { MIN_SEARCH_LENGTH, normalizeSearchQuery, SEARCH_DEBOUNCE_MS } from "@/lib/search";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const JLPT_OPTIONS = [
    { label: "JLPT N1（上級）", value: "N1" },
    { label: "JLPT N2（中上級）", value: "N2" },
    { label: "JLPT N3（中級）", value: "N3" },
    { label: "JLPT N4/N5（初級）", value: "N4,N5" },
] as const;

const NATIONALITY_OPTIONS = ["日本", "ベトナム"] as const;

export type MatchingUser = {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    location?: string | null;
    avatarUrl?: string | null;
    hobbies: { hobbyName: string }[];
    languages: { language: string; type?: string | null; level?: string | null }[];
    purposes: { purpose: string }[];
};

type MatchingClientProps = {
    initialPurposeOptions?: string[];
    initialHobbyOptions?: string[];
    initialCandidates?: MatchingUser[];
    initialTotal?: number;
    initialHasMore?: boolean;
    initialError?: string | null;
};

function getDisplayName(user: MatchingUser) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return name || "ユーザー";
}

function formatLanguageName(language: string) {
    if (language === "日本") return "日本語";
    if (language === "ベトナム") return "ベトナム語";
    return language;
}

function getNativeLanguage(user: MatchingUser) {
    const native = user.languages.find((language) => language.type === "native");
    if (native) return native.language;
    return user.languages[0]?.language ?? "未設定";
}

function getLearningLanguage(user: MatchingUser) {
    const learning = user.languages.find(
        (language) => language.type === "learning" || language.level
    );
    if (learning) return learning.language;
    return user.languages[1]?.language ?? user.languages[0]?.language ?? "未設定";
}

function getJlptLevel(user: MatchingUser) {
    const withLevel = user.languages.find((language) => language.level);
    return withLevel?.level ?? "未設定";
}

function getPurposes(user: MatchingUser) {
    return user.purposes.flatMap((purpose) =>
        purpose.purpose
            .split(/[,、]/)
            .map((item) => item.trim())
            .filter(Boolean)
    );
}

function getNationalityFlagEmoji(language: string) {
    if (language.includes("ベトナム") || language.includes("Vietnam")) {
        return "🇻🇳";
    }

    return "🇯🇵";
}

export default function MatchingClient({
    initialPurposeOptions = [],
    initialHobbyOptions = [],
    initialCandidates = [],
    initialTotal = 0,
    initialHasMore = false,
    initialError = null,
}: MatchingClientProps = {}) {
    const cachedHome = readMatchingHomeCache();

    const [purposeOptions, setPurposeOptions] = useState(
        cachedHome?.filterOptions.purposes ?? initialPurposeOptions
    );
    const [hobbyOptions, setHobbyOptions] = useState(
        cachedHome?.filterOptions.hobbies ?? initialHobbyOptions
    );

    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedPurpose, setSelectedPurpose] = useState("");
    const [selectedNationality, setSelectedNationality] = useState("");
    const [selectedHobby, setSelectedHobby] = useState("");
    const [showCustomPurpose, setShowCustomPurpose] = useState(false);
    const [showCustomHobby, setShowCustomHobby] = useState(false);
    const [customPurposeInput, setCustomPurposeInput] = useState("");
    const [customHobbyInput, setCustomHobbyInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

    const [candidates, setCandidates] = useState<MatchingUser[]>(
        () => (cachedHome?.search.data ?? initialCandidates) as MatchingUser[]
    );
    const [total, setTotal] = useState(cachedHome?.search.total ?? initialTotal);
    const [hasMore, setHasMore] = useState(cachedHome?.search.hasMore ?? initialHasMore);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(initialError);
    const [isBootstrapping, setIsBootstrapping] = useState(
        !cachedHome && initialCandidates.length === 0
    );

    const prevFiltersRef = useRef<string | null>(null);
    const fetchCandidatesRef = useRef<
        ((targetPage: number, append: boolean) => Promise<void>) | null
    >(null);
    const hasCandidatesRef = useRef(initialCandidates.length > 0);
    const fetchRequestIdRef = useRef(0);

    hasCandidatesRef.current = candidates.length > 0;

    const isCustomPurpose = Boolean(selectedPurpose) && !purposeOptions.includes(selectedPurpose);
    const isCustomHobby = Boolean(selectedHobby) && !hobbyOptions.includes(selectedHobby);

    const buildParams = useCallback(
        (targetPage: number) => ({
            page: targetPage,
            search: normalizeSearchQuery(debouncedSearchQuery),
            hobby: selectedHobby || undefined,
            language: selectedNationality || undefined,
            purpose: selectedPurpose || undefined,
            jlptLevel: selectedLevels.length > 0 ? selectedLevels.join(",") : undefined,
        }),
        [debouncedSearchQuery, selectedHobby, selectedNationality, selectedPurpose, selectedLevels]
    );

    const fetchCandidates = useCallback(
        async (targetPage: number, append: boolean) => {
            const requestId = ++fetchRequestIdRef.current;

            if (append) {
                setIsLoadingMore(true);
            } else if (hasCandidatesRef.current) {
                setIsRefreshing(true);
                setError(null);
            } else {
                setIsLoading(true);
                setError(null);
            }

            const result = await searchMatchingUsers(buildParams(targetPage));

            if (requestId !== fetchRequestIdRef.current) return;

            if (!result.success) {
                setError(result.message ?? "マッチング候補の取得に失敗しました。");

                if (!append) {
                    setCandidates([]);
                    setTotal(0);
                    setHasMore(false);
                }
            } else {
                const users = (result.data ?? []) as MatchingUser[];
                setCandidates((prev) => (append ? [...prev, ...users] : users));

                if (result.total !== undefined) {
                    setTotal(result.total);
                }

                setHasMore(result.hasMore ?? false);
                setPage(targetPage);
            }

            setIsLoading(false);
            setIsRefreshing(false);
            setIsLoadingMore(false);
        },
        [buildParams]
    );

    fetchCandidatesRef.current = fetchCandidates;

    useEffect(() => {
        if (cachedHome) return;

        let cancelled = false;

        void (async () => {
            const result = await fetchMatchingHomeClient();
            if (cancelled) return;

            if (!result.success) {
                setError(result.message);
                setIsBootstrapping(false);
                return;
            }

            setPurposeOptions(result.data.filterOptions.purposes);
            setHobbyOptions(result.data.filterOptions.hobbies);
            setCandidates((result.data.search.data ?? []) as MatchingUser[]);
            setTotal(result.data.search.total ?? 0);
            setHasMore(result.data.search.hasMore ?? false);
            setPage(1);
            setError(null);
            setIsBootstrapping(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [cachedHome]);

    const filterKey = JSON.stringify({
        selectedLevels,
        selectedPurpose,
        selectedNationality,
        selectedHobby,
        debouncedSearchQuery,
    });

    useEffect(() => {
        if (isBootstrapping) return;

        if (prevFiltersRef.current === null) {
            prevFiltersRef.current = filterKey;
            return;
        }

        if (prevFiltersRef.current === filterKey) return;

        prevFiltersRef.current = filterKey;
        void fetchCandidatesRef.current?.(1, false);
    }, [filterKey, isBootstrapping]);

    const hasPendingSearch =
        searchQuery.trim().length > 0 && normalizeSearchQuery(searchQuery) === undefined;

    const hasActiveFilters =
        selectedLevels.length > 0 ||
        Boolean(selectedPurpose) ||
        Boolean(selectedNationality) ||
        Boolean(selectedHobby) ||
        Boolean(normalizeSearchQuery(searchQuery));

    const toggleLevel = (value: string) => {
        setSelectedLevels((prev) =>
            prev.includes(value) ? prev.filter((level) => level !== value) : [...prev, value]
        );
    };

    const handleLoadMore = () => {
        if (!hasMore || isLoadingMore) return;
        void fetchCandidates(page + 1, true);
    };

    const applyCustomPurpose = () => {
        const value = customPurposeInput.trim();
        if (!value) return;

        setSelectedPurpose(value);
        setShowCustomPurpose(false);
    };

    const applyCustomHobby = () => {
        const value = customHobbyInput.trim();
        if (!value) return;

        setSelectedHobby(value);
        setShowCustomHobby(false);
    };

    const clearFilters = () => {
        setSelectedLevels([]);
        setSelectedPurpose("");
        setSelectedNationality("");
        setSelectedHobby("");
        setSearchQuery("");
        setShowCustomPurpose(false);
        setShowCustomHobby(false);
        setCustomPurposeInput("");
        setCustomHobbyInput("");
    };

    return (
        <div
            className="flex h-screen w-full overflow-hidden bg-[#F6FAF8]"
            style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', 'Noto Sans JP', sans-serif" }}
        >
            <Sidebar />

            <div className="relative flex flex-1 flex-col overflow-hidden">
                <TopNav
                    backLink="/community"
                    showSearch
                    searchPlaceholder="キーワードで検索..."
                    searchValue={searchQuery}
                    onSearch={setSearchQuery}
                />

                <div className="flex flex-1 overflow-hidden">
                    <main className="hide-scrollbar flex-1 overflow-y-auto p-8 lg:p-12">
                        <div className="mx-auto flex max-w-[1280px] flex-col gap-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div className="flex flex-col gap-1.5">
                                    <h2 className="text-[30px] font-extrabold leading-[38px] tracking-[-0.8px] text-[#005B5B]">
                                        マッチング候補
                                    </h2>
                                    <p className="text-[14px] font-medium text-[#6E7979]">
                                        あなたの興味や学習目標に合う交流パートナーを見つけましょう。
                                    </p>
                                </div>

                                <span className="self-start rounded-full border border-[#DFE3E1]/40 bg-[#F0F5F2] px-4 py-1.5 pb-1 text-[13px] font-bold text-[#6E7979] shadow-xs select-none sm:self-auto">
                                    {hasPendingSearch
                                        ? `${MIN_SEARCH_LENGTH}文字以上で検索`
                                        : isLoading || isRefreshing
                                            ? "検索中..."
                                            : `${total}名が見つかりました`}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-5 rounded-[20px] border border-[#DFE3E1]/40 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="mr-1 text-[11px] font-black tracking-wider text-[#005B5B] uppercase">
                                        レベル:
                                    </span>

                                    {JLPT_OPTIONS.map(({ value }) => {
                                        const active = selectedLevels.includes(value);

                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => toggleLevel(value)}
                                                className={`cursor-pointer rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all active:scale-95 ${active
                                                        ? "bg-[#005B5B] text-white shadow-xs"
                                                        : "border border-[#DFE3E1] bg-white text-[#3E4948] hover:bg-[#F0F5F2]"
                                                    }`}
                                            >
                                                {value}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="hidden h-5 w-px bg-[#DFE3E1]/60 xl:block" />

                                <div className="flex items-center gap-1.5">
                                    <span className="mr-1 text-[11px] font-black tracking-wider text-[#005B5B] uppercase">
                                        国籍:
                                    </span>

                                    {NATIONALITY_OPTIONS.map((nationality) => {
                                        const active = selectedNationality === nationality;

                                        return (
                                            <button
                                                key={nationality}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedNationality((prev) =>
                                                        prev === nationality ? "" : nationality
                                                    )
                                                }
                                                className={`cursor-pointer rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all active:scale-95 ${active
                                                        ? "bg-[#005B5B] text-white shadow-xs"
                                                        : "border border-[#DFE3E1] bg-white text-[#3E4948] hover:bg-[#F0F5F2]"
                                                    }`}
                                            >
                                                {nationality}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="hidden h-5 w-px bg-[#DFE3E1]/60 xl:block" />

                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black tracking-wider text-[#005B5B] uppercase">
                                        目的:
                                    </span>

                                    {isCustomPurpose ? (
                                        <div className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#005B5B] to-[#0D7A7A] px-3 py-1.5 text-[12px] font-bold text-white shadow-xs">
                                            <span>{selectedPurpose}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPurpose("");
                                                    setCustomPurposeInput("");
                                                }}
                                                className="ml-1 cursor-pointer text-[14px] leading-none font-extrabold text-white/80 hover:text-white"
                                                aria-label="目的フィルターを削除"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : showCustomPurpose ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={customPurposeInput}
                                                onChange={(event) =>
                                                    setCustomPurposeInput(event.target.value)
                                                }
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") applyCustomPurpose();
                                                }}
                                                placeholder="目的を入力"
                                                className="w-28 rounded-xl border border-[#BEC9C8] bg-white px-3 py-1 text-[12px] text-[#3E4948] shadow-xs outline-none focus:border-[#005B5B]"
                                            />
                                            <button
                                                type="button"
                                                onClick={applyCustomPurpose}
                                                className="cursor-pointer rounded-xl bg-[#005B5B] px-2.5 py-1 text-[12px] font-bold text-white transition-all hover:bg-[#004A4A] active:scale-95"
                                            >
                                                適用
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCustomPurpose(false);
                                                    setCustomPurposeInput("");
                                                }}
                                                className="cursor-pointer text-[12px] font-medium text-[#6E7979] hover:text-[#3E4948]"
                                                aria-label="目的入力を閉じる"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedPurpose}
                                            onChange={(event) => {
                                                if (event.target.value === "__custom__") {
                                                    setShowCustomPurpose(true);
                                                    return;
                                                }

                                                setSelectedPurpose(event.target.value);
                                            }}
                                            className="cursor-pointer rounded-xl border border-[#DFE3E1] bg-white px-3 py-1.5 text-[12px] font-bold text-[#3E4948] outline-none transition-colors hover:bg-[#F0F5F2] focus:border-[#005B5B]"
                                        >
                                            <option value="">全て</option>
                                            {purposeOptions.map((purpose) => (
                                                <option key={purpose} value={purpose}>
                                                    {purpose}
                                                </option>
                                            ))}
                                            <option value="__custom__">その他...</option>
                                        </select>
                                    )}
                                </div>

                                <div className="hidden h-5 w-px bg-[#DFE3E1]/60 xl:block" />

                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black tracking-wider text-[#005B5B] uppercase">
                                        興味:
                                    </span>

                                    {isCustomHobby ? (
                                        <div className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#005B5B] to-[#0D7A7A] px-3 py-1.5 text-[12px] font-bold text-white shadow-xs">
                                            <span>{selectedHobby}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedHobby("");
                                                    setCustomHobbyInput("");
                                                }}
                                                className="ml-1 cursor-pointer text-[14px] leading-none font-extrabold text-white/80 hover:text-white"
                                                aria-label="興味フィルターを削除"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : showCustomHobby ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={customHobbyInput}
                                                onChange={(event) =>
                                                    setCustomHobbyInput(event.target.value)
                                                }
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") applyCustomHobby();
                                                }}
                                                placeholder="興味を入力"
                                                className="w-28 rounded-xl border border-[#BEC9C8] bg-white px-3 py-1 text-[12px] text-[#3E4948] shadow-xs outline-none focus:border-[#005B5B]"
                                            />
                                            <button
                                                type="button"
                                                onClick={applyCustomHobby}
                                                className="cursor-pointer rounded-xl bg-[#005B5B] px-2.5 py-1 text-[12px] font-bold text-white transition-all hover:bg-[#004A4A] active:scale-95"
                                            >
                                                適用
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCustomHobby(false);
                                                    setCustomHobbyInput("");
                                                }}
                                                className="cursor-pointer text-[12px] font-medium text-[#6E7979] hover:text-[#3E4948]"
                                                aria-label="興味入力を閉じる"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedHobby}
                                            onChange={(event) => {
                                                if (event.target.value === "__custom__") {
                                                    setShowCustomHobby(true);
                                                    return;
                                                }

                                                setSelectedHobby(event.target.value);
                                            }}
                                            className="cursor-pointer rounded-xl border border-[#DFE3E1] bg-white px-3 py-1.5 text-[12px] font-bold text-[#3E4948] outline-none transition-colors hover:bg-[#F0F5F2] focus:border-[#005B5B]"
                                        >
                                            <option value="">全て</option>
                                            {hobbyOptions.map((hobby) => (
                                                <option key={hobby} value={hobby}>
                                                    {hobby}
                                                </option>
                                            ))}
                                            <option value="__custom__">その他...</option>
                                        </select>
                                    )}
                                </div>

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="ml-auto cursor-pointer rounded-xl border border-red-200/40 bg-red-50 px-4 py-1.5 text-[12px] font-bold text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 active:scale-95"
                                    >
                                        クリア
                                    </button>
                                )}
                            </div>

                            {error && (
                                <div className="w-full rounded-xl border border-[#923118]/15 bg-[#FFDAD6]/50 py-3.5 text-center text-[14px] font-bold text-[#923118] animate-fade-in">
                                    {error}
                                </div>
                            )}

                            {isBootstrapping || (isLoading && candidates.length === 0) ? (
                                <div className="grid grid-cols-1 gap-5 pb-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                                    {Array.from({ length: 8 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="h-[380px] rounded-[24px] border border-[#DFE3E1]/50 bg-white p-6 animate-pulse"
                                        />
                                    ))}
                                </div>
                            ) : candidates.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-4 rounded-[24px] border border-[#DFE3E1]/40 bg-white py-24 shadow-xs">
                                    <p className="text-[16px] font-semibold text-[#6E7979]">
                                        条件に一致するパートナーが見つかりませんでした。
                                    </p>

                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="cursor-pointer rounded-xl bg-[#005B5B] px-6 py-3 text-[13px] font-bold text-white shadow-md transition-all duration-300 hover:bg-[#004A4A] hover:shadow-lg active:scale-95"
                                        >
                                            フィルターをクリア
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div
                                        className={`relative grid grid-cols-1 gap-5 pb-8 transition-opacity duration-300 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 ${isRefreshing ? "pointer-events-none opacity-60" : ""
                                            }`}
                                    >
                                        {candidates.map((user) => {
                                            const nativeLang = getNativeLanguage(user);
                                            const learningLang = getLearningLanguage(user);
                                            const purposes = getPurposes(user);
                                            const hobbies = user.hobbies.map(
                                                (hobby) => hobby.hobbyName
                                            );

                                            return (
                                                <div
                                                    key={user.id}
                                                    className="group/card relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-[#DFE3E1]/40 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.005)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,91,91,0.06)]"
                                                >
                                                    <div className="mb-3.5 flex items-start justify-between">
                                                        <div className="relative">
                                                            <div className="relative h-[80px] w-[80px] overflow-hidden rounded-2xl border-2 border-white bg-gray-100 shadow-[0_8px_16px_rgba(0,0,0,0.06)] ring-2 ring-[#005B5B]/5 transition-all duration-300 group-hover/card:scale-105 group-hover/card:ring-[#005B5B]/15">
                                                                <Image
                                                                    src={resolveImageUrl(
                                                                        user.avatarUrl
                                                                    )}
                                                                    alt={getDisplayName(user)}
                                                                    fill
                                                                    sizes="80px"
                                                                    className="object-cover"
                                                                />
                                                            </div>

                                                            <div className="absolute -right-1 -bottom-1 z-10 flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[#DFE3E1]/60 bg-white text-[14px] leading-none shadow-[0_2px_4px_rgba(0,0,0,0.05)] select-none">
                                                                {getNationalityFlagEmoji(
                                                                    nativeLang
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex h-[46px] w-[60px] flex-col items-center justify-center rounded-xl border border-[#005B5B]/12 bg-[#005B5B]/5 shadow-2xs select-none">
                                                            <span className="text-[9px] font-bold tracking-wide text-[#6E7979] uppercase">
                                                                レベル
                                                            </span>
                                                            <span className="text-[12px] font-black text-[#005B5B]">
                                                                {getJlptLevel(user)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mb-3 flex flex-col gap-0.5">
                                                        <h3 className="truncate text-[17px] leading-[22px] font-extrabold text-[#181D1B] transition-colors duration-300 group-hover/card:text-[#005B5B]">
                                                            {getDisplayName(user)}
                                                        </h3>

                                                        <div className="flex items-center gap-1 text-[#6E7979]">
                                                            <svg
                                                                width="10"
                                                                height="12"
                                                                viewBox="0 0 12 15"
                                                                fill="none"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                aria-hidden
                                                            >
                                                                <path
                                                                    d="M6 0C2.68629 0 0 2.68629 0 6C0 10.5 6 15 6 15C6 15 12 10.5 12 6C12 2.68629 9.31371 0 6 0ZM6 8.5C4.61929 8.5 3.5 7.38071 3.5 6C3.5 4.61929 4.61929 3.5 6 3.5C7.38071 3.5 8.5 4.61929 8.5 6C8.5 7.38071 7.38071 8.5 6 8.5Z"
                                                                    fill="currentColor"
                                                                />
                                                            </svg>
                                                            <span className="text-[11px] font-medium">
                                                                {user.location || "所在地未設定"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mb-3 flex items-center justify-between rounded-xl border border-[#DFE3E1]/20 bg-[#F6FAF8]/50 px-3.5 py-2.5 text-[12px] select-none">
                                                        <div className="flex min-w-0 items-center gap-1.5">
                                                            <span className="shrink-0 text-[9px] font-black tracking-wider text-[#BEC9C8] uppercase">
                                                                母国語
                                                            </span>
                                                            <span className="truncate text-[11px] font-bold text-[#181D1B]">
                                                                {formatLanguageName(nativeLang)}
                                                            </span>
                                                        </div>

                                                        <div className="mx-1.5 h-3.5 w-px shrink-0 bg-[#DFE3E1]/60" />

                                                        <div className="flex min-w-0 items-center gap-1.5">
                                                            <span className="shrink-0 text-[9px] font-black tracking-wider text-[#BEC9C8] uppercase">
                                                                学習中
                                                            </span>
                                                            <span className="truncate text-[11px] font-bold text-[#181D1B]">
                                                                {formatLanguageName(learningLang)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mb-3.5 flex min-h-[52px] flex-wrap content-start gap-1.5 select-none">
                                                        {hobbies.slice(0, 2).map((hobby) => (
                                                            <span
                                                                key={hobby}
                                                                className="rounded-lg border border-[#923118]/15 bg-[#923118]/8 px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#923118] transition-transform duration-200 hover:scale-105"
                                                            >
                                                                {hobby}
                                                            </span>
                                                        ))}

                                                        {purposes.slice(0, 2).map((purpose) => (
                                                            <span
                                                                key={purpose}
                                                                className="rounded-lg border border-[#005B5B]/12 bg-[#005B5B]/6 px-2 py-0.5 text-[9px] font-bold text-[#005B5B] transition-transform duration-200 hover:scale-105"
                                                            >
                                                                {purpose}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <Link
                                                        href={`/profile/${user.id}`}
                                                        className="mt-auto flex h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#005B5B] to-[#1B7575] text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(0,91,91,0.12)] transition-all duration-300 ease-out hover:from-[#004a4a] hover:to-[#134e4a] hover:shadow-[0_8px_20px_rgba(0,91,91,0.22)] active:scale-[0.98]"
                                                    >
                                                        <span>詳細を見る</span>
                                                        <svg
                                                            className="transition-transform duration-300 group-hover/card:translate-x-0.5"
                                                            width="10"
                                                            height="10"
                                                            viewBox="0 0 14 14"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            aria-hidden
                                                        >
                                                            <path
                                                                d="M10.1458 7.5H0V5.83333H10.1458L5.475 1.16667L6.66667 0L13.3333 6.66667L6.66667 13.3333L5.475 12.1667L10.1458 7.5Z"
                                                                fill="white"
                                                            />
                                                        </svg>
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {hasMore && (
                                        <div className="flex w-full justify-center pb-12">
                                            <button
                                                type="button"
                                                onClick={handleLoadMore}
                                                disabled={isLoadingMore}
                                                className={`flex h-[56px] cursor-pointer items-center justify-center gap-3 rounded-2xl bg-[#923118] px-12 text-[13px] font-extrabold tracking-[2.5px] text-white uppercase shadow-[0_12px_24px_-6px_rgba(146,49,24,0.3)] transition-all duration-300 hover:shadow-[0_16px_32px_-6px_rgba(146,49,24,0.45)] ${isLoadingMore
                                                        ? "cursor-wait opacity-80"
                                                        : "hover:-translate-y-0.5 active:scale-95"
                                                    }`}
                                            >
                                                {isLoadingMore ? (
                                                    <>
                                                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                                        <span>読み込み中...</span>
                                                    </>
                                                ) : (
                                                    <span>もっと見る</span>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}