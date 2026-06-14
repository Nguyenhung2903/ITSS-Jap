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
    { label: "JLPT N1 (上級)", value: "N1" },
    { label: "JLPT N2 (中上級)", value: "N2" },
    { label: "JLPT N3 (中級)", value: "N3" },
    { label: "JLPT N4/N5 (初級)", value: "N4,N5" },
] as const;

const NATIONALITY_OPTIONS = ["日本", "ベトナム"] as const;
const OTHER_OPTION_LABEL = "その他";

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

function getDisplayName(user: MatchingUser) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return name || "ユーザー";
}

function getNativeLanguage(user: MatchingUser) {
    const native = user.languages.find((l) => l.type === "native");
    if (native) return native.language;
    return user.languages[0]?.language ?? "—";
}

function getLearningLanguage(user: MatchingUser) {
    const learning = user.languages.find((l) => l.type === "learning" || l.level);
    if (learning) return learning.language;
    return user.languages[1]?.language ?? user.languages[0]?.language ?? "—";
}

function getJlptLevel(user: MatchingUser) {
    const withLevel = user.languages.find((l) => l.level);
    return withLevel?.level ?? "—";
}

function getPurposes(user: MatchingUser) {
    return user.purposes.flatMap((p) =>
        p.purpose.split(/[,、]/).map((s) => s.trim()).filter(Boolean)
    );
}

function getNationalityFlagEmoji(language: string) {
    if (language.includes("ベトナム") || language.includes("Vietnam")) {
        return "🇻🇳";
    }
    return "🇯🇵";
}

type MatchingClientProps = {
    initialPurposeOptions?: string[];
    initialHobbyOptions?: string[];
    initialCandidates?: MatchingUser[];
    initialTotal?: number;
    initialHasMore?: boolean;
    initialError?: string | null;
};

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
    const [isLoadingFilterOptions] = useState(false);
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
    const [isBootstrapping, setIsBootstrapping] = useState(!cachedHome && initialCandidates.length === 0);

    const prevFiltersRef = useRef<string | null>(null);
    const fetchCandidatesRef = useRef<((targetPage: number, append: boolean) => Promise<void>) | null>(null);
    const hasCandidatesRef = useRef(initialCandidates.length > 0);
    const fetchRequestIdRef = useRef(0);

    hasCandidatesRef.current = candidates.length > 0;

    const isCustomPurpose =
        !!selectedPurpose && !purposeOptions.includes(selectedPurpose);
    const isCustomHobby = !!selectedHobby && !hobbyOptions.includes(selectedHobby);

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
    }, []);

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
        searchQuery.trim().length > 0 &&
        normalizeSearchQuery(searchQuery) === undefined;

    const hasActiveFilters =
        selectedLevels.length > 0 ||
        !!selectedPurpose ||
        !!selectedNationality ||
        !!selectedHobby ||
        !!normalizeSearchQuery(searchQuery);

    const toggleLevel = (value: string) => {
        setSelectedLevels((prev) =>
            prev.includes(value) ? prev.filter((l) => l !== value) : [...prev, value]
        );
    };

    const handleLoadMore = () => {
        if (!hasMore || isLoadingMore) return;
        fetchCandidates(page + 1, true);
    };

    const selectPurpose = (purpose: string) => {
        setShowCustomPurpose(false);
        setCustomPurposeInput("");
        setSelectedPurpose((prev) => (prev === purpose ? "" : purpose));
    };

    const selectHobby = (hobby: string) => {
        setShowCustomHobby(false);
        setCustomHobbyInput("");
        setSelectedHobby((prev) => (prev === hobby ? "" : hobby));
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
        <div className="flex w-full h-screen bg-[#F6FAF8] overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', 'Noto Sans JP', sans-serif" }}>
            <Sidebar />

            <div className="flex flex-col flex-1 overflow-hidden relative">
                <TopNav
                    backLink="/community"
                    showSearch
                    searchPlaceholder="キーワードで検索..."
                    searchValue={searchQuery}
                    onSearch={setSearchQuery}
                />

                <div className="flex flex-1 overflow-hidden">
                    <main className="flex-1 overflow-y-auto p-8 lg:p-12 hide-scrollbar">
                        <div className="max-w-[1280px] mx-auto flex flex-col gap-8">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <h2 className="text-[30px] font-extrabold text-[#005B5B] tracking-[-0.8px] leading-[38px]">マッチング候補</h2>
                                    <p className="text-[14px] font-medium text-[#6E7979]">あなたの興味や学習目標 dựa trên các kết nối.</p>
                                </div>
                                <span className="text-[13px] font-bold text-[#6E7979] pb-1 bg-[#F0F5F2] px-4 py-1.5 rounded-full select-none shadow-xs shrink-0 self-start sm:self-auto border border-[#DFE3E1]/40">
                                    {hasPendingSearch
                                        ? `${MIN_SEARCH_LENGTH}文字以上で検索`
                                        : isLoading || isRefreshing
                                          ? "検索中..."
                                          : `${total} 名が見つかりました`}
                                </span>
                            </div>

                            {/* Horizontal Filter Bar */}
                            <div className="flex flex-wrap items-center gap-5 bg-white border border-[#DFE3E1]/40 rounded-[20px] p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                                {/* Level Toggle Pills */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-black text-[#005B5B] uppercase tracking-wider mr-1">レベル:</span>
                                    {JLPT_OPTIONS.map(({ label, value }) => {
                                        const active = selectedLevels.includes(value);
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => toggleLevel(value)}
                                                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all active:scale-95 cursor-pointer ${
                                                    active
                                                        ? "bg-[#005B5B] text-white shadow-xs"
                                                        : "bg-white border border-[#DFE3E1] text-[#3E4948] hover:bg-[#F0F5F2]"
                                                }`}
                                            >
                                                {value}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="h-5 w-px bg-[#DFE3E1]/60 hidden xl:block" />

                                {/* Nationality Toggle Pills */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-black text-[#005B5B] uppercase tracking-wider mr-1">国籍:</span>
                                    {NATIONALITY_OPTIONS.map((nat) => {
                                        const active = selectedNationality === nat;
                                        return (
                                            <button
                                                key={nat}
                                                type="button"
                                                onClick={() => setSelectedNationality((prev) => (prev === nat ? "" : nat))}
                                                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all active:scale-95 cursor-pointer ${
                                                    active
                                                        ? "bg-[#005B5B] text-white shadow-xs"
                                                        : "bg-white border border-[#DFE3E1] text-[#3E4948] hover:bg-[#F0F5F2]"
                                                }`}
                                            >
                                                {nat}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="h-5 w-px bg-[#DFE3E1]/60 hidden xl:block" />

                                {/* Purpose Select Dropdown / Custom Input */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black text-[#005B5B] uppercase tracking-wider">目的:</span>
                                    {isCustomPurpose ? (
                                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#005B5B] to-[#0D7A7A] text-white px-3 py-1.5 rounded-xl text-[12px] font-bold shadow-xs">
                                            <span>{selectedPurpose}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPurpose("");
                                                    setCustomPurposeInput("");
                                                }}
                                                className="text-white/80 hover:text-white font-extrabold text-[14px] leading-none ml-1 cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : showCustomPurpose ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={customPurposeInput}
                                                onChange={(e) => setCustomPurposeInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") applyCustomPurpose();
                                                }}
                                                placeholder="目的を入力"
                                                className="rounded-xl border border-[#BEC9C8] bg-white px-3 py-1 text-[12px] text-[#3E4948] outline-none focus:border-[#005B5B] shadow-xs w-28"
                                            />
                                            <button
                                                type="button"
                                                onClick={applyCustomPurpose}
                                                className="rounded-xl bg-[#005B5B] hover:bg-[#004A4A] text-white px-2.5 py-1 text-[12px] font-bold active:scale-95 transition-all cursor-pointer"
                                            >
                                                適用
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCustomPurpose(false);
                                                    setCustomPurposeInput("");
                                                }}
                                                className="text-[#6E7979] hover:text-[#3E4948] text-[12px] font-medium cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedPurpose}
                                            onChange={(e) => {
                                                if (e.target.value === "__custom__") {
                                                    setShowCustomPurpose(true);
                                                } else {
                                                    setSelectedPurpose(e.target.value);
                                                }
                                            }}
                                            className="bg-white border border-[#DFE3E1] rounded-xl px-3 py-1.5 text-[12px] font-bold text-[#3E4948] focus:border-[#005B5B] outline-none cursor-pointer hover:bg-[#F0F5F2] transition-colors"
                                        >
                                            <option value="">全て</option>
                                            {purposeOptions.map((purpose) => (
                                                <option key={purpose} value={purpose}>{purpose}</option>
                                            ))}
                                            <option value="__custom__">その他...</option>
                                        </select>
                                    )}
                                </div>

                                <div className="h-5 w-px bg-[#DFE3E1]/60 hidden xl:block" />

                                {/* Hobby Select Dropdown / Custom Input */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black text-[#005B5B] uppercase tracking-wider">興味:</span>
                                    {isCustomHobby ? (
                                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#005B5B] to-[#0D7A7A] text-white px-3 py-1.5 rounded-xl text-[12px] font-bold shadow-xs">
                                            <span>{selectedHobby}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedHobby("");
                                                    setCustomHobbyInput("");
                                                }}
                                                className="text-white/80 hover:text-white font-extrabold text-[14px] leading-none ml-1 cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : showCustomHobby ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={customHobbyInput}
                                                onChange={(e) => setCustomHobbyInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") applyCustomHobby();
                                                }}
                                                placeholder="興味を入力"
                                                className="rounded-xl border border-[#BEC9C8] bg-white px-3 py-1 text-[12px] text-[#3E4948] outline-none focus:border-[#005B5B] shadow-xs w-28"
                                            />
                                            <button
                                                type="button"
                                                onClick={applyCustomHobby}
                                                className="rounded-xl bg-[#005B5B] hover:bg-[#004A4A] text-white px-2.5 py-1 text-[12px] font-bold active:scale-95 transition-all cursor-pointer"
                                            >
                                                適用
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCustomHobby(false);
                                                    setCustomHobbyInput("");
                                                }}
                                                className="text-[#6E7979] hover:text-[#3E4948] text-[12px] font-medium cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedHobby}
                                            onChange={(e) => {
                                                if (e.target.value === "__custom__") {
                                                    setShowCustomHobby(true);
                                                } else {
                                                    setSelectedHobby(e.target.value);
                                                }
                                            }}
                                            className="bg-white border border-[#DFE3E1] rounded-xl px-3 py-1.5 text-[12px] font-bold text-[#3E4948] focus:border-[#005B5B] outline-none cursor-pointer hover:bg-[#F0F5F2] transition-colors"
                                        >
                                            <option value="">全て</option>
                                            {hobbyOptions.map((hobby) => (
                                                <option key={hobby} value={hobby}>{hobby}</option>
                                            ))}
                                            <option value="__custom__">その他...</option>
                                        </select>
                                    )}
                                </div>

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="ml-auto px-4 py-1.5 rounded-xl text-[12px] font-bold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 active:scale-95 transition-all duration-200 border border-red-200/40 cursor-pointer"
                                    >
                                        クリア
                                    </button>
                                )}
                            </div>

                            {error && (
                                <div className="w-full text-center text-[#923118] text-[14px] font-bold bg-[#FFDAD6]/50 border border-[#923118]/15 py-3.5 rounded-xl animate-fade-in">
                                    {error}
                                </div>
                            )}

                            {isBootstrapping || (isLoading && candidates.length === 0) ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pb-8">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="bg-white border border-[#DFE3E1]/50 rounded-[24px] p-6 h-[380px] animate-pulse" />
                                    ))}
                                </div>
                            ) : candidates.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white border border-[#DFE3E1]/40 rounded-[24px] shadow-xs">
                                    <p className="text-[16px] font-semibold text-[#6E7979]">条件に一致するパートナーが見つかりませんでした。</p>
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="px-6 py-3 bg-[#005B5B] hover:bg-[#004A4A] text-white rounded-xl text-[13px] font-bold shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 cursor-pointer"
                                        >
                                            フィルターをクリア
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className={`relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pb-8 transition-opacity duration-300 ${isRefreshing ? "opacity-60 pointer-events-none" : ""}`}>
                                        {candidates.map((user) => {
                                            const nativeLang = getNativeLanguage(user);
                                            const purposes = getPurposes(user);
                                            const hobbies = user.hobbies.map((h) => h.hobbyName);

                                            return (
                                                <div
                                                    key={user.id}
                                                    className="bg-white border border-[#DFE3E1]/40 rounded-[24px] p-4 flex flex-col justify-between hover:shadow-[0_20px_40px_rgba(0,91,91,0.06)] hover:-translate-y-1 transition-all duration-300 ease-out relative overflow-hidden group/card shadow-[0_2px_12px_rgba(0,0,0,0.005)]"
                                                >
                                                    <div className="flex justify-between items-start mb-3.5">
                                                        <div className="relative">
                                                             <div className="w-[80px] h-[80px] rounded-2xl border-2 border-white shadow-[0_8px_16px_rgba(0,0,0,0.06)] overflow-hidden relative bg-gray-100 transition-all duration-300 group-hover/card:scale-105 ring-2 ring-[#005B5B]/5 group-hover/card:ring-[#005B5B]/15">
                                                                <Image
                                                                    src={resolveImageUrl(user.avatarUrl)}
                                                                    alt={getDisplayName(user)}
                                                                    fill
                                                                    sizes="80px"
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                            <div className="absolute -right-1 -bottom-1 w-[28px] h-[28px] bg-white border border-[#DFE3E1]/60 shadow-[0_2px_4px_rgba(0,0,0,0.05)] rounded-full flex items-center justify-center text-[14px] leading-none z-10 select-none">
                                                                {getNationalityFlagEmoji(nativeLang)}
                                                            </div>
                                                        </div>

                                                        <div className="bg-[#005B5B]/5 border border-[#005B5B]/12 rounded-xl w-[54px] h-[46px] flex flex-col justify-center items-center shadow-2xs select-none">
                                                            <span className="text-[9px] font-bold text-[#6E7979] uppercase tracking-wide">Level</span>
                                                            <span className="text-[13px] font-black text-[#005B5B]">{getJlptLevel(user)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-0.5 mb-3">
                                                        <h3 className="text-[17px] font-extrabold text-[#181D1B] leading-[22px] group-hover/card:text-[#005B5B] transition-colors duration-300 truncate">{getDisplayName(user)}</h3>
                                                        <div className="flex items-center gap-1 text-[#6E7979]">
                                                            <svg width="10" height="12" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M6 0C2.68629 0 0 2.68629 0 6C0 10.5 6 15 6 15C6 15 12 10.5 12 6C12 2.68629 9.31371 0 6 0ZM6 8.5C4.61929 8.5 3.5 7.38071 3.5 6C3.5 4.61929 4.61929 3.5 6 3.5C7.38071 3.5 8.5 4.61929 8.5 6C8.5 7.38071 7.38071 8.5 6 8.5Z" fill="currentColor" />
                                                            </svg>
                                                            <span className="text-[11px] font-medium">{user.location || "—"}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center mb-3 bg-[#F6FAF8]/50 px-3.5 py-2.5 rounded-xl border border-[#DFE3E1]/20 text-[12px] select-none">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className="text-[9px] font-black text-[#BEC9C8] uppercase tracking-wider shrink-0">母国語</span>
                                                            <span className="font-bold text-[#181D1B] text-[11px] truncate">{nativeLang}</span>
                                                        </div>
                                                        <div className="w-px h-3.5 bg-[#DFE3E1]/60 shrink-0 mx-1.5" />
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className="text-[9px] font-black text-[#BEC9C8] uppercase tracking-wider shrink-0">学習中</span>
                                                            <span className="font-bold text-[#181D1B] text-[11px] truncate">{getLearningLanguage(user)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1.5 mb-3.5 min-h-[52px] content-start select-none">
                                                        {hobbies.slice(0, 2).map((hobby) => (
                                                            <span key={hobby} className="bg-[#923118]/8 text-[#923118] border border-[#923118]/15 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wide hover:scale-105 transition-transform duration-200">
                                                                {hobby}
                                                            </span>
                                                        ))}
                                                        {purposes.slice(0, 2).map((purpose) => (
                                                             <span key={purpose} className="bg-[#005B5B]/6 text-[#005B5B] border border-[#005B5B]/12 px-2 py-0.5 rounded-lg text-[9px] font-bold hover:scale-105 transition-transform duration-200">
                                                                {purpose}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <Link
                                                        href={`/profile/${user.id}`}
                                                        className="w-full h-[40px] bg-gradient-to-r from-[#005B5B] to-[#1B7575] hover:from-[#004a4a] hover:to-[#134e4a] text-white text-[13px] font-bold rounded-xl shadow-[0_4px_12px_rgba(0,91,91,0.12)] hover:shadow-[0_8px_20px_rgba(0,91,91,0.22)] active:scale-98 transition-all duration-300 ease-out mt-auto flex items-center justify-center gap-2"
                                                    >
                                                        <span>詳細を見る</span>
                                                        <svg className="transition-transform duration-300 group-hover/card:translate-x-0.5" width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M10.1458 7.5H0V5.83333H10.1458L5.475 1.16667L6.66667 0L13.3333 6.66667L6.66667 13.3333L5.475 12.1667L10.1458 7.5Z" fill="white" />
                                                        </svg>
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {hasMore && (
                                        <div className="w-full flex justify-center pb-12">
                                            <button
                                                type="button"
                                                onClick={handleLoadMore}
                                                disabled={isLoadingMore}
                                                className={`h-[56px] px-12 bg-[#923118] text-white text-[13px] font-extrabold uppercase tracking-[2.5px] rounded-2xl shadow-[0_12px_24px_-6px_rgba(146,49,24,0.3)] hover:shadow-[0_16px_32px_-6px_rgba(146,49,24,0.45)] transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer ${isLoadingMore ? "opacity-80 cursor-wait" : "hover:-translate-y-0.5 active:scale-95"}`}
                                            >
                                                {isLoadingMore ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
