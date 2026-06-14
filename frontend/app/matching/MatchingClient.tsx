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
        <div className="flex w-full h-screen bg-[#F6FAF8] overflow-hidden" style={{ fontFamily: "'Manrope', 'Plus Jakarta Sans', 'Noto Sans JP', sans-serif" }}>
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
                    <aside className="w-[240px] bg-[#F0F5F2] border-r border-[#DFE3E1]/60 flex flex-col pt-8 pb-8 px-8 gap-10 overflow-y-auto hide-scrollbar shrink-0">
                        <div className="flex flex-col gap-6">
                            <h3 className="text-[11px] font-medium text-[#3E4948] uppercase tracking-[1.1px]">言語レベル</h3>
                            <div className="flex flex-col gap-4">
                                {JLPT_OPTIONS.map(({ label, value }) => (
                                    <label key={value} className="flex items-center gap-3 cursor-pointer group">
                                        <button
                                            type="button"
                                            onClick={() => toggleLevel(value)}
                                            className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors ${selectedLevels.includes(value) ? "bg-[#005B5B] border-[#005B5B]" : "bg-white border-[#BEC9C8] group-hover:border-[#005B5B]"}`}
                                        >
                                            {selectedLevels.includes(value) && (
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>
                                        <span className="text-[14px] font-bold text-[#3E4948]">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <h3 className="text-[11px] font-medium text-[#3E4948] uppercase tracking-[1.1px]">目的</h3>
                            <div className="flex flex-wrap gap-2">
                                {isLoadingFilterOptions ? (
                                    <>
                                        {[1, 2, 3].map((i) => (
                                            <span
                                                key={i}
                                                className="h-[34px] w-16 animate-pulse rounded-full bg-[#DFE3E1]"
                                            />
                                        ))}
                                    </>
                                ) : purposeOptions.length === 0 ? (
                                    <p className="text-[12px] text-[#727D7A]">登録済みの目的がありません</p>
                                ) : null}
                                {purposeOptions.map((purpose) => (
                                    <button
                                        key={purpose}
                                        type="button"
                                        onClick={() => selectPurpose(purpose)}
                                        className={`px-5 py-2 rounded-full text-[12px] font-medium transition-colors ${selectedPurpose === purpose ? "bg-[#005B5B] text-white" : "bg-[#DFE3E1] text-[#3E4948] hover:bg-[#d4d9d6]"}`}
                                    >
                                        {purpose}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCustomPurpose((prev) => !prev);
                                        if (showCustomPurpose && isCustomPurpose) {
                                            setSelectedPurpose("");
                                            setCustomPurposeInput("");
                                        }
                                    }}
                                    className={`px-5 py-2 rounded-full text-[12px] font-medium transition-colors border border-dashed ${showCustomPurpose || isCustomPurpose ? "bg-[#005B5B] border-[#005B5B] text-white" : "border-[#BEC9C8] bg-white/50 text-[#3E4948] hover:bg-white"}`}
                                >
                                    {OTHER_OPTION_LABEL}
                                </button>
                            </div>
                            {showCustomPurpose && (
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="text"
                                        value={customPurposeInput}
                                        onChange={(e) => setCustomPurposeInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") applyCustomPurpose();
                                        }}
                                        placeholder="目的を入力"
                                        className="w-full rounded-lg border border-[#BEC9C8] bg-white px-3 py-2 text-[12px] text-[#3E4948] outline-none focus:border-[#005B5B]"
                                    />
                                    <button
                                        type="button"
                                        onClick={applyCustomPurpose}
                                        disabled={!customPurposeInput.trim()}
                                        className="self-start rounded-lg bg-[#005B5B] px-4 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
                                    >
                                        適用
                                    </button>
                                </div>
                            )}
                            {isCustomPurpose && !showCustomPurpose && (
                                <p className="text-[11px] text-[#005B5B]">選択中: {selectedPurpose}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-6">
                            <h3 className="text-[11px] font-medium text-[#3E4948] uppercase tracking-[1.1px]">国籍</h3>
                            <div className="flex flex-wrap gap-2">
                                {NATIONALITY_OPTIONS.map((nat) => (
                                    <button
                                        key={nat}
                                        type="button"
                                        onClick={() => setSelectedNationality((prev) => (prev === nat ? "" : nat))}
                                        className={`px-5 py-2 rounded-full text-[12px] font-medium transition-colors ${selectedNationality === nat ? "bg-[#005B5B] text-white" : "bg-[#DFE3E1] text-[#3E4948] hover:bg-[#d4d9d6]"}`}
                                    >
                                        {nat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <h3 className="text-[11px] font-medium text-[#3E4948] uppercase tracking-[1.1px]">興味・関心</h3>
                            <div className="flex flex-wrap gap-2">
                                {hobbyOptions.map((interest) => (
                                    <button
                                        key={interest}
                                        type="button"
                                        onClick={() => selectHobby(interest)}
                                        className={`px-4 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${selectedHobby === interest ? "bg-[#005B5B] border-[#005B5B] text-white" : "border-[#BEC9C8] bg-white/50 text-[#3E4948] hover:bg-white"}`}
                                    >
                                        {interest}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCustomHobby((prev) => !prev);
                                        if (showCustomHobby && isCustomHobby) {
                                            setSelectedHobby("");
                                            setCustomHobbyInput("");
                                        }
                                    }}
                                    className={`px-4 py-1.5 rounded-lg border text-[12px] font-medium transition-colors border-dashed ${showCustomHobby || isCustomHobby ? "bg-[#005B5B] border-[#005B5B] text-white" : "border-[#BEC9C8] bg-white/50 text-[#3E4948] hover:bg-white"}`}
                                >
                                    {OTHER_OPTION_LABEL}
                                </button>
                            </div>
                            {showCustomHobby && (
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="text"
                                        value={customHobbyInput}
                                        onChange={(e) => setCustomHobbyInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") applyCustomHobby();
                                        }}
                                        placeholder="興味・関心を入力"
                                        className="w-full rounded-lg border border-[#BEC9C8] bg-white px-3 py-2 text-[12px] text-[#3E4948] outline-none focus:border-[#005B5B]"
                                    />
                                    <button
                                        type="button"
                                        onClick={applyCustomHobby}
                                        disabled={!customHobbyInput.trim()}
                                        className="self-start rounded-lg bg-[#005B5B] px-4 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
                                    >
                                        適用
                                    </button>
                                </div>
                            )}
                            {isCustomHobby && !showCustomHobby && (
                                <p className="text-[11px] text-[#005B5B]">選択中: {selectedHobby}</p>
                            )}
                        </div>

                        <div className="mt-auto pt-8">
                            <button
                                type="button"
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className="w-full h-[52px] bg-[#DFE3E1] rounded-xl text-[#181D1B] text-[14px] font-medium hover:bg-[#d4d9d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                フィルターをクリア
                            </button>
                        </div>
                    </aside>

                    <main className="flex-1 overflow-y-auto p-12 hide-scrollbar">
                        <div className="max-w-[1152px] mx-auto flex flex-col gap-12">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-[36px] font-medium text-[#005B5B] tracking-[-0.9px] leading-[45px]">マッチング候補</h2>
                                    <p className="text-[18px] font-medium text-[#3E4948]">あなたの興味や学習目標に基づいたパートナーです。</p>
                                </div>
                                <span className="text-[14px] font-medium text-[#3E4948] pb-1">
                                    {hasPendingSearch
                                        ? `${MIN_SEARCH_LENGTH}文字以上で検索`
                                        : isLoading || isRefreshing
                                          ? "検索中..."
                                          : `${total}名が見つかりました`}
                                </span>
                            </div>

                            {error && (
                                <div className="w-full text-center text-[#923118] text-[14px] font-medium bg-[#FFDAD6]/50 py-3 rounded-xl">
                                    {error}
                                </div>
                            )}

                            {isBootstrapping || (isLoading && candidates.length === 0) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="bg-white border border-[#DFE3E1]/60 rounded-[24px] p-8 h-[420px] animate-pulse" />
                                    ))}
                                </div>
                            ) : candidates.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <p className="text-[18px] font-medium text-[#3E4948]">条件に一致するパートナーが見つかりませんでした。</p>
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="px-8 py-3 bg-[#005B5B] text-white rounded-full text-[14px] font-medium hover:bg-[#004a4a] transition-colors"
                                        >
                                            フィルターをクリア
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className={`relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8 transition-opacity ${isRefreshing ? "opacity-60 pointer-events-none" : ""}`}>
                                        {candidates.map((user) => {
                                            const nativeLang = getNativeLanguage(user);
                                            const purposes = getPurposes(user);
                                            const hobbies = user.hobbies.map((h) => h.hobbyName);

                                            return (
                                                <div
                                                    key={user.id}
                                                    className="bg-white border border-[#DFE3E1]/60 rounded-[24px] p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300"
                                                >
                                                    <div className="flex justify-between items-start mb-8">
                                                        <div className="relative">
                                                            <div className="w-[96px] h-[96px] rounded-[32px] border-4 border-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),_0_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden relative bg-gray-200">
                                                                <Image
                                                                    src={resolveImageUrl(user.avatarUrl)}
                                                                    alt={getDisplayName(user)}
                                                                    fill
                                                                    sizes="96px"
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                            <div className="absolute -right-2 -bottom-2 w-[34px] h-[34px] bg-white border border-[#DFE3E1]/50 shadow-sm rounded-full flex items-center justify-center text-[18px] leading-none">
                                                                {getNationalityFlagEmoji(nativeLang)}
                                                            </div>
                                                        </div>

                                                        <div className="bg-[#EAEFEC] rounded-2xl w-[60px] h-[51px] flex flex-col justify-center items-center">
                                                            <span className="text-[10px] font-medium text-[#3E4948] uppercase tracking-[-0.5px]">Level</span>
                                                            <span className="text-[14px] font-bold text-[#005B5B]">{getJlptLevel(user)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-1 mb-6">
                                                        <h3 className="text-[24px] font-medium text-[#181D1B] leading-[32px]">{getDisplayName(user)}</h3>
                                                        <div className="flex items-center gap-2 text-[#3E4948]">
                                                            <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M6 0C2.68629 0 0 2.68629 0 6C0 10.5 6 15 6 15C6 15 12 10.5 12 6C12 2.68629 9.31371 0 6 0ZM6 8.5C4.61929 8.5 3.5 7.38071 3.5 6C3.5 4.61929 4.61929 3.5 6 3.5C7.38071 3.5 8.5 4.61929 8.5 6C8.5 7.38071 7.38071 8.5 6 8.5Z" fill="#3E4948" />
                                                            </svg>
                                                            <span className="text-[14px] font-medium">{user.location || "—"}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-4 mb-8">
                                                        <div className="flex justify-between items-center pr-2">
                                                            <span className="text-[11px] font-medium text-[#BEC9C8] uppercase">母国語:</span>
                                                            <div className="bg-[#EAEFEC] px-6 py-1.5 rounded-lg min-w-[117px] text-center">
                                                                <span className="text-[14px] font-medium text-[#181D1B]">{nativeLang}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center pr-2">
                                                            <span className="text-[11px] font-medium text-[#BEC9C8] uppercase">学習中:</span>
                                                            <div className="bg-[#EAEFEC] px-6 py-1.5 rounded-lg min-w-[117px] text-center">
                                                                <span className="text-[14px] font-medium text-[#181D1B]">{getLearningLanguage(user)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {hobbies.length > 0 && (
                                                        <div className="flex flex-wrap gap-3 mb-4">
                                                            {hobbies.slice(0, 4).map((hobby) => (
                                                                <span key={hobby} className="bg-[#FFDAD6] text-[#83260E] px-3 py-1.5 rounded-md text-[10px] font-medium uppercase tracking-[0.25px]">
                                                                    {hobby}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {purposes.length > 0 && (
                                                        <div className="flex flex-wrap gap-3 mb-10">
                                                            {purposes.slice(0, 3).map((purpose) => (
                                                                <span key={purpose} className="bg-[#F0F5F2] text-[#3E4948] px-3 py-2 rounded-lg text-[12px] font-bold">
                                                                    {purpose}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <Link
                                                        href={`/profile/${user.id}`}
                                                        className="w-full h-[56px] bg-[#005B5B] hover:bg-[#004a4a] text-white text-[16px] font-medium rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),_0_2px_4px_-2px_rgba(0,0,0,0.1)] transition-colors mt-auto flex items-center justify-center"
                                                    >
                                                        詳細を見る
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
                                                className={`h-[60px] px-14 bg-[#923118] text-white text-[14px] font-medium uppercase tracking-[2.8px] rounded-full shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),_0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-all flex items-center justify-center gap-3 ${isLoadingMore ? "opacity-80 cursor-wait" : "hover:bg-[#7a2813] transform hover:-translate-y-1"}`}
                                            >
                                                {isLoadingMore ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        読み込み中...
                                                    </>
                                                ) : (
                                                    "もっと見る"
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
