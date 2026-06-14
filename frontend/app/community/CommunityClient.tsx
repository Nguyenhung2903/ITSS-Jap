"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopNav from "@/components/layouts/TopNav";
import GroupRecommendCard, { type GroupCardData } from "@/components/community/GroupRecommendCard";
import { joinGroupAction, searchGroupsAction } from "../actions/group";
import {
    COMMUNITY_HOME_CACHE_KEY,
    fetchCommunityHomeClient,
    readCommunityHomeCache,
} from "@/lib/community-client";
import {
    type ApiGroup,
    type JoinedGroupItem,
    buildJoinedIdsFromGroups,
    formatGroupCard,
    formatJoinedGroup,
    GROUP_LANGUAGE_LEVEL_OPTIONS,
} from "@/lib/community-format";
import { invalidateSessionCache } from "@/lib/session-cache";
import { MIN_SEARCH_LENGTH, normalizeSearchQuery, SEARCH_DEBOUNCE_MS } from "@/lib/search";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import Link from "next/link";

const ALL_FILTER = "全て";

type CommunityClientProps = {
    initialJoinedGroups?: JoinedGroupItem[];
    initialSuggestedGroups?: GroupCardData[];
    initialJoinedIds?: number[];
    initialHobbyTagOptions?: string[];
};

export default function CommunityClient({
    initialJoinedGroups = [],
    initialSuggestedGroups = [],
    initialJoinedIds = [],
    initialHobbyTagOptions = [],
}: CommunityClientProps = {}) {
    const cachedHome = readCommunityHomeCache();

    const cachedJoined = cachedHome?.myGroups.map(formatJoinedGroup) ?? initialJoinedGroups;
    const cachedJoinedIds = cachedHome
        ? buildJoinedIdsFromGroups(cachedJoined)
        : new Set(initialJoinedIds);
    const cachedSuggested =
        cachedHome?.suggested.map((group, index) =>
            formatGroupCard(group, cachedJoinedIds, index)
        ) ?? initialSuggestedGroups;

    const [joinedGroups, setJoinedGroups] = useState(cachedJoined);
    const [suggestedGroups, setSuggestedGroups] = useState(cachedSuggested);
    const [searchResults, setSearchResults] = useState<GroupCardData[]>([]);
    const [joinedIds, setJoinedIds] = useState<Set<number>>(() => new Set(cachedJoinedIds));

    const [searchKeyword, setSearchKeyword] = useState("");
    const debouncedSearchKeyword = useDebouncedValue(searchKeyword, SEARCH_DEBOUNCE_MS);
    const [hobbyFilter, setHobbyFilter] = useState(ALL_FILTER);
    const [levelFilter, setLevelFilter] = useState(ALL_FILTER);
    const [hobbyTagOptions, setHobbyTagOptions] = useState(
        cachedHome?.filterOptions?.hobbyTags ?? initialHobbyTagOptions
    );

    const [isBootstrapping, setIsBootstrapping] = useState(
        !cachedHome && initialSuggestedGroups.length === 0 && initialJoinedGroups.length === 0
    );
    const [bootstrapError, setBootstrapError] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [joiningId, setJoiningId] = useState<number | null>(null);
    const searchRequestIdRef = useRef(0);

    const hasSearchFilter = normalizeSearchQuery(debouncedSearchKeyword) !== undefined;
    const isFiltering =
        hasSearchFilter || hobbyFilter !== ALL_FILTER || levelFilter !== ALL_FILTER;

    const hasPendingSearch =
        searchKeyword.trim().length > 0 &&
        normalizeSearchQuery(searchKeyword) === undefined;

    useEffect(() => {
        if (cachedHome) return;

        let cancelled = false;

        void (async () => {
            const result = await fetchCommunityHomeClient();
            if (cancelled) return;

            if (!result.success) {
                setBootstrapError(result.message);
                setIsBootstrapping(false);
                return;
            }

            const joined = result.data.myGroups.map(formatJoinedGroup);
            const joinedIdSet = buildJoinedIdsFromGroups(joined);
            setJoinedGroups(joined);
            setSuggestedGroups(
                result.data.suggested.map((group, index) => formatGroupCard(group, joinedIdSet, index))
            );
            setJoinedIds(joinedIdSet);
            setHobbyTagOptions(result.data.filterOptions?.hobbyTags ?? []);
            setBootstrapError(null);
            setIsBootstrapping(false);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!isFiltering) {
            setSearchResults([]);
            return;
        }

        const requestId = ++searchRequestIdRef.current;
        setIsSearching(true);

        void (async () => {
            const result = await searchGroupsAction({
                search: normalizeSearchQuery(debouncedSearchKeyword),
                hobbyTag: hobbyFilter !== ALL_FILTER ? hobbyFilter : undefined,
                languageTag: levelFilter !== ALL_FILTER ? levelFilter : undefined,
            });

            if (requestId !== searchRequestIdRef.current) return;

            if (result.success && Array.isArray(result.data)) {
                setSearchResults(
                    result.data.map((g: ApiGroup, index: number) => formatGroupCard(g, joinedIds, index))
                );
            } else {
                setSearchResults([]);
            }

            setIsSearching(false);
        })();
    }, [debouncedSearchKeyword, hobbyFilter, levelFilter, isFiltering, joinedIds]);

    const displayedGroups = isFiltering ? searchResults : suggestedGroups;
    const isListLoading = isBootstrapping || (isFiltering && isSearching);

    const resetFilters = useCallback(() => {
        setSearchKeyword("");
        setHobbyFilter(ALL_FILTER);
        setLevelFilter(ALL_FILTER);
    }, []);

    const handleJoin = useCallback(async (groupId: number) => {
        setJoiningId(groupId);
        const result = await joinGroupAction(groupId);
        if (result.success) {
            invalidateSessionCache(COMMUNITY_HOME_CACHE_KEY);
            const refresh = await fetchCommunityHomeClient({ force: true });
            if (refresh.success) {
                const joined = refresh.data.myGroups.map(formatJoinedGroup);
                const joinedIdSet = buildJoinedIdsFromGroups(joined);
                setJoinedGroups(joined);
                setSuggestedGroups(
                    refresh.data.suggested.map((group, index) =>
                        formatGroupCard(group, joinedIdSet, index)
                    )
                );
                setJoinedIds(joinedIdSet);
                setHobbyTagOptions(refresh.data.filterOptions?.hobbyTags ?? []);
            }
        }
        setJoiningId(null);
    }, []);

    return (
        <div className="flex flex-row w-full min-h-screen bg-[#F6FAF8]" style={{ fontFamily: "Manrope" }}>
            <Sidebar />
            <main className="flex flex-1 flex-col items-center">
                <TopNav />
                <div className="w-full max-w-[960px] px-8 pt-8 pb-16 flex flex-col gap-[42px]">
                    <div className="w-full flex justify-between items-end gap-8">
                        <div className="flex flex-col gap-3 max-w-[672px]">
                            <h2 className="text-[48px] font-normal text-[#005B5B] leading-[48px] tracking-[-1.2px]">
                                コミュニティ
                            </h2>
                            <p className="text-[18px] font-normal text-[#526160] leading-7">
                                日本語を一緒に練習できるコミュニティを見つけましょう
                            </p>
                        </div>
                        <Link
                            href="/events"
                            className="bg-[#923118] hover:bg-[#7a2813] text-white text-[16px] font-medium py-4 px-8 rounded-full shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] transition-all shrink-0"
                        >
                            イベント一覧
                        </Link>
                    </div>

                    {bootstrapError && (
                        <div className="w-full text-center text-[#923118] text-[14px] font-medium bg-[#FFDAD6]/50 py-3 rounded-xl">
                            {bootstrapError}
                        </div>
                    )}

                    <section className="w-full flex flex-col gap-6 pb-4">
                        <div className="flex items-center gap-6">
                            <h3 className="text-[14px] font-normal text-[rgba(62,73,72,0.7)] tracking-[2.8px] uppercase whitespace-nowrap leading-5">
                                参加中のグループ
                            </h3>
                            <div className="flex-1 h-px bg-[#BEC9C8]/30" />
                        </div>

                        <div
                            className="w-full flex gap-4 overflow-x-auto pb-4 hide-scrollbar"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            {joinedGroups.length > 0 ? (
                                joinedGroups.map((group) => (
                                    <Link key={group.id} href={`/community/${group.id}`} className="shrink-0">
                                        <div className="min-w-[280px] h-[117px] bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,91,91,0.08)] px-4 py-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
                                            <div className="w-[81px] h-[81px] rounded-xl bg-gray-200 overflow-hidden relative shrink-0">
                                                <Image
                                                    src={group.img}
                                                    alt={group.name}
                                                    fill
                                                    sizes="81px"
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <h4 className="text-[16px] font-bold text-[#181D1B] leading-5 truncate">
                                                    {group.name}
                                                </h4>
                                                <p className="text-[12px] text-[#526160] leading-4">{group.members}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-[14px] text-[#6E7979] italic py-4">
                                    まだグループに参加していません。おすすめのグループから探してみましょう！
                                </p>
                            )}
                        </div>
                    </section>

                    <section className="w-full bg-[#F0F5F2] rounded-[32px] p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="flex-1 relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7979]">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M16.6 18L10.3 11.7C9.8 12.1 9.225 12.4167 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13C4.68333 13 3.14583 12.3708 1.8875 11.1125C0.629167 9.85417 0 8.31667 0 6.5C0 4.68333 0.629167 3.14583 1.8875 1.8875C3.14583 0.629167 4.68333 0 6.5 0C8.31667 0 9.85417 0.629167 11.1125 1.8875C12.3708 3.14583 13 4.68333 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.4167 9.225 12.1 9.8 11.7 10.3L18 16.6L16.6 18ZM6.5 11C7.75 11 8.8125 10.5625 9.6875 9.6875C10.5625 8.8125 11 7.75 11 6.5C11 5.25 10.5625 4.1875 9.6875 3.3125C8.8125 2.4375 7.75 2 6.5 2C5.25 2 4.1875 2.4375 3.3125 3.3125C2.4375 4.1875 2 5.25 2 6.5C2 7.75 2.4375 8.8125 3.3125 9.6875C4.1875 10.5625 5.25 11 6.5 11Z"
                                        fill="#6E7979"
                                    />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder={`グループを検索…（${MIN_SEARCH_LENGTH}文字以上）`}
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="w-full h-[57px] bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] pl-12 pr-4 text-[16px] text-[#181D1B] placeholder:text-[rgba(110,121,121,0.6)] focus:outline-none focus:ring-2 focus:ring-[#005B5B]/20"
                            />
                        </div>
                        <div className="flex gap-3 items-center flex-wrap">
                            <div className="relative">
                                <select
                                    value={hobbyFilter}
                                    onChange={(e) => setHobbyFilter(e.target.value)}
                                    className="appearance-none h-[52px] min-w-[128px] bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] pl-6 pr-10 text-[14px] text-[#181D1B] focus:outline-none cursor-pointer"
                                >
                                    <option value={ALL_FILTER}>興味: 全て</option>
                                    {hobbyTagOptions.map((tag) => (
                                        <option key={tag} value={tag}>
                                            興味: {tag}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                    <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
                                        <path
                                            d="M6.3 8.4L10.5 12.6L14.7 8.4"
                                            stroke="#6B7280"
                                            strokeWidth="1.575"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <div className="relative">
                                <select
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                    className="appearance-none h-[52px] min-w-[143px] bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] pl-6 pr-10 text-[14px] text-[#181D1B] focus:outline-none cursor-pointer"
                                >
                                    <option value={ALL_FILTER}>レベル: 全て</option>
                                    {GROUP_LANGUAGE_LEVEL_OPTIONS.map((tag) => (
                                        <option key={tag} value={tag}>
                                            レベル: {tag}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                    <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
                                        <path
                                            d="M6.3 8.4L10.5 12.6L14.7 8.4"
                                            stroke="#6B7280"
                                            strokeWidth="1.575"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                            {isFiltering && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="text-[14px] text-[#923118] hover:underline px-2"
                                >
                                    クリア
                                </button>
                            )}
                        </div>
                    </section>

                    <section className="w-full flex flex-col gap-8">
                        <h3 className="text-[14px] font-normal text-[rgba(62,73,72,0.7)] tracking-[2.8px] uppercase">
                            {isFiltering ? "検索結果" : "おすすめのグループ"}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {isListLoading ? (
                                [1, 2, 3].map((s) => (
                                    <div key={s} className="h-[446px] bg-white rounded-[32px] animate-pulse" />
                                ))
                            ) : displayedGroups.length > 0 ? (
                                displayedGroups.map((group) => (
                                    <GroupRecommendCard
                                        key={group.id}
                                        group={group}
                                        onJoin={handleJoin}
                                        isJoining={joiningId === group.id}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full text-center text-[14px] text-[#6E7979] py-12 bg-white rounded-[32px] border border-dashed border-[#BEC9C8]">
                                    {isFiltering
                                        ? "該当するグループが見つかりませんでした。"
                                        : "おすすめのグループが見つかりませんでした。"}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
