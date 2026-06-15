"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopNav from "@/components/layouts/TopNav";
import UserAvatar from "@/components/ui/UserAvatar";
import {
    fetchMatchingHomeClient,
    readMatchingHomeCache,
    searchMatchingUsers,
} from "@/lib/matching-client";
import { MIN_SEARCH_LENGTH, normalizeSearchQuery, SEARCH_DEBOUNCE_MS } from "@/lib/search";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const JLPT_OPTIONS = [
    { label: "JLPT N1（上級）", value: "N1" },
    { label: "JLPT N2（中上級）", value: "N2" },
    { label: "JLPT N3（中級）", value: "N3" },
    { label: "JLPT N4/N5（初級）", value: "N4,N5" },
] as const;

const NATIONALITY_OPTIONS = ["日本", "ベトナム"] as const;
const MATCHING_PAGE_SIZE = 12;

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

type FilterDropdownProps = {
    value: string;
    options: string[];
    placeholder?: string;
    customPlaceholder: string;
    onChange: (value: string) => void;
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
    return user.languages.find((language) => language.level === "母語" || !language.type)?.language ?? "未設定";
}

function getLearningLanguage(user: MatchingUser) {
    const learning = user.languages.find((language) => language.type === "learning");
    if (learning) return learning.language;
    const fallback = user.languages.find((language) => language.type !== "native" && language.level !== "母語");
    return fallback?.language ?? "未設定";
}

function getJlptLevel(user: MatchingUser) {
    const nativeLanguage = getNativeLanguage(user);
    const learningLanguage = getLearningLanguage(user);
    const learningEntry = user.languages.find(
        (language) => language.type === "learning" || (language.language === learningLanguage && language.type !== "native")
    );

    if (learningLanguage === "日本") {
        if (nativeLanguage === "日本") return "母語";
        return learningEntry?.level ?? "未設定";
    }

    if (learningLanguage === "ベトナム") {
        return formatVietnameseLevel(learningEntry?.level);
    }

    return learningEntry?.level ?? "未設定";
}

function formatVietnameseLevel(level?: string | null) {
    if (!level) return "初級";

    const normalized = level.trim().toLowerCase();

    if (["advanced", "上級", "高級", "cao cấp", "cao cap", "nâng cao", "nang cao"].includes(normalized)) {
        return "上級";
    }

    if (["intermediate", "中級", "trung cấp", "trung cap"].includes(normalized)) {
        return "中級";
    }

    if (["beginner", "初級", "sơ cấp", "so cap", "cơ bản", "co ban"].includes(normalized)) {
        return "初級";
    }

    return level;
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

function FilterDropdown({
    value,
    options,
    placeholder = "全て",
    customPlaceholder,
    onChange,
}: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [customValue, setCustomValue] = useState("");

    const selectedLabel = value || placeholder;

    const handleSelect = (nextValue: string) => {
        onChange(nextValue);
        setIsOpen(false);
        setCustomValue("");
    };

    const handleApplyCustom = () => {
        const trimmed = customValue.trim();
        if (!trimmed) return;

        onChange(trimmed);
        setIsOpen(false);
        setCustomValue("");
    };

    return (
        <div className="relative w-[150px] shrink-0 2xl:w-[190px]">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-[13px] font-bold transition-all active:scale-[0.98] ${value
                        ? "border-[#005B5B]/30 bg-[#E8F4F2] text-[#005B5B] shadow-[0_6px_18px_-10px_rgba(0,91,91,0.5)]"
                        : "border-[#D9C7A5]/70 bg-[#FFFDF7] text-[#3E4948] hover:border-[#005B5B]/30 hover:bg-white"
                    }`}
                aria-expanded={isOpen}
            >
                <span className="truncate">{selectedLabel}</span>
                <svg
                    className={`ml-2 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                        }`}
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                >
                    <path
                        d="M3 5.25L7 9.25L11 5.25"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-[100] w-[280px] overflow-hidden rounded-2xl border border-[#D9C7A5]/80 bg-[#FFFDF7] shadow-[0_24px_60px_rgba(79,55,30,0.22)]">
                    <div className="max-h-[236px] overflow-y-auto p-2">
                        <button
                            type="button"
                            onClick={() => handleSelect("")}
                            className={`flex h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-[14px] font-bold transition-all ${!value
                                    ? "bg-[#005B5B] text-white"
                                    : "text-[#3E4948] hover:bg-[#F3E7D2]"
                                }`}
                        >
                            <span className="flex h-5 w-5 items-center justify-center">
                                {!value && "✓"}
                            </span>
                            <span>{placeholder}</span>
                        </button>

                        {options.map((option) => {
                            const active = value === option;

                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`mt-1 flex h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-[14px] font-bold transition-all ${active
                                            ? "bg-[#005B5B] text-white"
                                            : "text-[#3E4948] hover:bg-[#F3E7D2]"
                                        }`}
                                >
                                    <span className="flex h-5 w-5 items-center justify-center">
                                        {active && "✓"}
                                    </span>
                                    <span className="truncate">{option}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="border-t border-[#D9C7A5]/70 bg-white p-3">
                        <p className="mb-2 text-[11px] font-bold tracking-[1px] text-[#8B5E34] uppercase">
                            その他
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customValue}
                                onChange={(event) => setCustomValue(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        handleApplyCustom();
                                    }
                                }}
                                placeholder={customPlaceholder}
                                className="h-10 min-w-0 flex-1 rounded-xl border border-[#D9C7A5]/70 bg-[#FFFDF7] px-3 text-[13px] font-medium text-[#181D1B] outline-none placeholder:text-[#6E7979]/45 focus:border-[#005B5B]/40 focus:bg-white focus:ring-2 focus:ring-[#005B5B]/15"
                            />
                            <button
                                type="button"
                                onClick={handleApplyCustom}
                                className="h-10 shrink-0 rounded-xl bg-[#005B5B] px-4 text-[13px] font-bold text-white transition-all hover:bg-[#004A4A] active:scale-[0.98]"
                            >
                                適用
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MatchingClient({
    initialPurposeOptions = [],
    initialHobbyOptions = [],
    initialCandidates = [],
    initialTotal = 0,
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
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

    const [candidates, setCandidates] = useState<MatchingUser[]>(
        () => (cachedHome?.search.data ?? initialCandidates) as MatchingUser[]
    );
    const [total, setTotal] = useState(cachedHome?.search.total ?? initialTotal);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(initialError);
    const [isBootstrapping, setIsBootstrapping] = useState(
        !cachedHome && initialCandidates.length === 0
    );

    const prevFiltersRef = useRef<string | null>(null);
    const fetchCandidatesRef = useRef<((targetPage: number) => Promise<void>) | null>(null);
    const hasCandidatesRef = useRef(initialCandidates.length > 0);
    const fetchRequestIdRef = useRef(0);

    hasCandidatesRef.current = candidates.length > 0;

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
        async (targetPage: number) => {
            const requestId = ++fetchRequestIdRef.current;

            if (hasCandidatesRef.current) {
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

                setCandidates([]);
                setTotal(0);
            } else {
                const users = (result.data ?? []) as MatchingUser[];
                setCandidates(users);

                if (result.total !== undefined) {
                    setTotal(result.total);
                }

                setPage(targetPage);
            }

            setIsLoading(false);
            setIsRefreshing(false);
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
        void fetchCandidatesRef.current?.(1);
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

    const totalPages = Math.max(1, Math.ceil(total / MATCHING_PAGE_SIZE));
    const pageStart = total === 0 ? 0 : (page - 1) * MATCHING_PAGE_SIZE + 1;
    const pageEnd = total === 0 ? 0 : Math.min(pageStart + candidates.length - 1, total);
    const canGoPrev = page > 1 && !isLoading && !isRefreshing;
    const canGoNext = page < totalPages && !isLoading && !isRefreshing;

    const handlePageChange = (nextPage: number) => {
        if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
        if (isLoading || isRefreshing) return;
        void fetchCandidates(nextPage);
    };

    const clearFilters = () => {
        setSelectedLevels([]);
        setSelectedPurpose("");
        setSelectedNationality("");
        setSelectedHobby("");
        setSearchQuery("");
    };

    return (
        <div
            className="flex h-screen w-full overflow-hidden bg-[#F3EFE4]"
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
                    <main className="hide-scrollbar flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(231,111,81,0.10),transparent_32%),linear-gradient(180deg,#F8F4EA_0%,#F3EFE4_45%,#EEF5F2_100%)] px-8 pt-8 pb-28 lg:pb-12">
                        <div className="mx-auto flex max-w-[1280px] flex-col gap-8">
                            <div className="flex items-center justify-between">
                                <span className="rounded-full border border-[#D9C7A5]/70 bg-[#FFFDF7]/90 px-4 py-1.5 pb-1 text-[13px] font-bold text-[#6E7979] shadow-[0_8px_18px_rgba(79,55,30,0.08)] select-none">
                                    {hasPendingSearch
                                        ? `${MIN_SEARCH_LENGTH}文字以上で検索`
                                        : isLoading || isRefreshing
                                            ? "検索中..."
                                            : `${total}名が見つかりました`}
                                </span>
                            </div>

                            <div className="relative z-50 flex w-full flex-nowrap items-center gap-3 overflow-visible rounded-[28px] border border-[#D9C7A5]/70 bg-[#FFFDF7]/95 px-5 py-4 shadow-[0_18px_45px_rgba(79,55,30,0.10)] backdrop-blur-sm">
                                <div className="flex shrink-0 items-center gap-1.5">
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
                                                className={`cursor-pointer rounded-xl px-3.5 py-2.5 text-[12px] font-bold transition-all active:scale-95 ${active
                                                        ? "bg-[#005B5B] text-white shadow-xs"
                                                        : "border border-[#D9C7A5]/70 bg-[#FFFDF7] text-[#3E4948] hover:border-[#005B5B]/30 hover:bg-white"
                                                    }`}
                                            >
                                                {value}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="h-8 w-px shrink-0 bg-[#D9C7A5]/80" />

                                <div className="flex shrink-0 items-center gap-1.5">
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
                                                className={`cursor-pointer rounded-xl px-3.5 py-2.5 text-[12px] font-bold transition-all active:scale-95 ${active
                                                        ? "bg-[#005B5B] text-white shadow-xs"
                                                        : "border border-[#D9C7A5]/70 bg-[#FFFDF7] text-[#3E4948] hover:border-[#005B5B]/30 hover:bg-white"
                                                    }`}
                                            >
                                                {nationality}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="h-8 w-px shrink-0 bg-[#D9C7A5]/80" />

                                <div className="flex shrink-0 items-center gap-2">
                                    <span className="text-[11px] font-black tracking-wider text-[#005B5B] uppercase">
                                        目的:
                                    </span>
                                    <FilterDropdown
                                        value={selectedPurpose}
                                        options={purposeOptions}
                                        customPlaceholder="目的を入力"
                                        onChange={setSelectedPurpose}
                                    />
                                </div>

                                <div className="h-8 w-px shrink-0 bg-[#D9C7A5]/80" />

                                <div className="flex shrink-0 items-center gap-2">
                                    <span className="text-[11px] font-black tracking-wider text-[#005B5B] uppercase">
                                        興味:
                                    </span>
                                    <FilterDropdown
                                        value={selectedHobby}
                                        options={hobbyOptions}
                                        customPlaceholder="興味を入力"
                                        onChange={setSelectedHobby}
                                    />
                                </div>

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="ml-auto shrink-0 cursor-pointer rounded-xl border border-[#B86B4B]/25 bg-[#F8E0D5] px-4 py-2.5 text-[12px] font-bold text-[#923118] transition-all duration-200 hover:bg-[#F3D0C0] active:scale-95"
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
                                            className="h-[380px] rounded-[28px] border border-[#D9C7A5]/60 bg-[#FFFDF7] p-6 shadow-[0_14px_32px_rgba(79,55,30,0.08)] animate-pulse"
                                        />
                                    ))}
                                </div>
                            ) : candidates.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-4 rounded-[28px] border border-[#D9C7A5]/70 bg-[#FFFDF7] py-24 shadow-[0_16px_40px_rgba(79,55,30,0.08)]">
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
                                        className={`relative z-0 grid grid-cols-1 gap-5 pb-8 transition-opacity duration-300 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 ${isRefreshing ? "pointer-events-none opacity-60" : ""
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
                                                    className="group/card relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-[#D9C7A5]/75 bg-[#FFFDF7] p-4 shadow-[0_16px_36px_rgba(79,55,30,0.10)] ring-1 ring-white/70 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#005B5B]/45 hover:bg-white hover:shadow-[0_24px_54px_rgba(0,91,91,0.16)]"
                                                >
                                                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#8B5E34] via-[#E76F51] to-[#005B5B]" />

                                                    <div className="mb-3.5 flex items-start justify-between pt-2">
                                                        <div className="relative">
                                                            <UserAvatar
                                                                name={getDisplayName(user)}
                                                                src={user.avatarUrl}
                                                                size={82}
                                                                className="rounded-2xl border-[3px] border-[#F6EAD5] bg-[#EFE3D0] shadow-[0_10px_22px_rgba(79,55,30,0.16)] ring-2 ring-[#8B5E34]/10 transition-all duration-300 group-hover/card:scale-105 group-hover/card:border-[#005B5B]/25 group-hover/card:ring-[#005B5B]/20"
                                                            />

                                                            <div className="absolute -right-1 -bottom-1 z-10 flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[#D9C7A5]/70 bg-[#FFFDF7] text-[14px] leading-none shadow-[0_4px_10px_rgba(79,55,30,0.16)] select-none">
                                                                {getNationalityFlagEmoji(
                                                                    nativeLang
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex h-[50px] w-[66px] flex-col items-center justify-center rounded-2xl border border-[#D9C7A5] bg-[#F7EAD4] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_18px_rgba(79,55,30,0.08)] select-none">
                                                            <span className="text-[9px] font-bold tracking-wide text-[#6E7979] uppercase">
                                                                {nativeLang === "日本" ? "母語" : "レベル"}
                                                            </span>
                                                            <span className="text-[12px] font-black text-[#005B5B]">
                                                                {nativeLang === "日本" ? "日本語" : getJlptLevel(user)}
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

                                                    <div className="mb-3.5 flex min-h-[64px] flex-wrap content-start gap-1.5 select-none">
                                                        {hobbies.slice(0, 3).map((hobby) => (
                                                            <span
                                                                key={hobby}
                                                                className="rounded-full border border-[#B86B4B]/25 bg-[#F8E0D5] px-2.5 py-1 text-[9px] font-bold tracking-wide text-[#923118] shadow-sm transition-transform duration-200 hover:scale-105"
                                                            >
                                                                {hobby}
                                                            </span>
                                                        ))}

                                                        {purposes.slice(0, 3).map((purpose) => (
                                                            <span
                                                                key={purpose}
                                                                className="rounded-full border border-[#005B5B]/20 bg-[#DDEDEA] px-2.5 py-1 text-[9px] font-bold text-[#005B5B] shadow-sm transition-transform duration-200 hover:scale-105"
                                                            >
                                                                {purpose}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <Link
                                                        href={`/profile/${user.id}`}
                                                        className="mt-auto flex h-[42px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#004F4F] via-[#006A6A] to-[#8B5E34] text-[13px] font-bold text-white shadow-[0_12px_24px_rgba(0,91,91,0.18)] transition-all duration-300 ease-out hover:from-[#003F3F] hover:via-[#005B5B] hover:to-[#764C29] hover:shadow-[0_18px_34px_rgba(0,91,91,0.28)] active:scale-[0.98]"
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

                                    {total > 0 && (
                                        <div className="flex w-full flex-col items-center justify-center gap-4 pb-12 sm:flex-row sm:justify-between">
                                            <div className="rounded-full border border-[#D9C7A5]/70 bg-[#FFFDF7]/95 px-5 py-3 text-[13px] font-extrabold text-[#3E4948] shadow-[0_10px_24px_rgba(79,55,30,0.08)]">
                                                {pageStart}-{pageEnd}/{total} ユーザー
                                            </div>

                                            {totalPages > 1 && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePageChange(page - 1)}
                                                        disabled={!canGoPrev}
                                                        className="h-11 rounded-2xl border border-[#D9C7A5]/80 bg-[#FFFDF7] px-5 text-[12px] font-extrabold text-[#005B5B] shadow-[0_8px_18px_rgba(79,55,30,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#005B5B]/30 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                                                    >
                                                        前へ
                                                    </button>
                                                    <div className="flex h-11 min-w-[86px] items-center justify-center rounded-2xl bg-[#005B5B] px-4 text-[12px] font-extrabold text-white shadow-[0_10px_24px_rgba(0,91,91,0.16)]">
                                                        {page}/{totalPages}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePageChange(page + 1)}
                                                        disabled={!canGoNext}
                                                        className="h-11 rounded-2xl border border-[#D9C7A5]/80 bg-[#FFFDF7] px-5 text-[12px] font-extrabold text-[#005B5B] shadow-[0_8px_18px_rgba(79,55,30,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#005B5B]/30 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                                                    >
                                                        次へ
                                                    </button>
                                                </div>
                                            )}
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
