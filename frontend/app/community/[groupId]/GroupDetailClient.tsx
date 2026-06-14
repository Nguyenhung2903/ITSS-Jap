"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopNav from "@/components/layouts/TopNav";
import { joinGroupAction, leaveGroupAction } from "@/app/actions/group";
import { useAuth } from "@/lib/auth-context";
import { resolveImageUrl } from "@/lib/image";
import {
    createPostAction,
    likePostAction,
    unlikePostAction,
    commentPostAction,
    getCommentsAction,
} from "@/app/actions/post";
import type { GroupPagePayload } from "@/lib/community-server";
import {
    fetchGroupPageClient,
    readGroupPageCache,
} from "@/lib/group-client";

const DEFAULT_AVATAR = "/assets/images/avatars/avatar.jpg";

type GroupDetailClientProps = {
    groupId: number;
    invalid?: boolean;
    initialGroup?: GroupPagePayload["group"];
    initialPosts?: unknown[];
};

export default function GroupDetailClient({
    groupId,
    invalid = false,
    initialGroup,
    initialPosts = [],
}: GroupDetailClientProps) {
    const cached = !invalid && groupId > 0 ? readGroupPageCache(groupId) : null;
    const resolvedGroup = cached?.group ?? initialGroup;
    const resolvedPosts = cached?.posts.data ?? initialPosts;

    const { user: currentUser } = useAuth();
    const [groupInfo, setGroupInfo] = useState(resolvedGroup);
    const [posts, setPosts] = useState<any[]>(resolvedPosts as any[]);
    const [isBootstrapping, setIsBootstrapping] = useState(!resolvedGroup && !invalid);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [isJoined, setIsJoined] = useState(!!resolvedGroup?.isJoined);
    const [postContent, setPostContent] = useState("");
    const [postImage, setPostImage] = useState<File | null>(null);
    const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
    const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
    const [commentsByPost, setCommentsByPost] = useState<Record<number, any[]>>({});
    const [expandedPostIds, setExpandedPostIds] = useState<Set<number>>(new Set());
    const [loadingComments, setLoadingComments] = useState<Set<number>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isJoinLoading, setIsJoinLoading] = useState(false);

    useEffect(() => {
        if (invalid || groupId <= 0) return;
        if (cached) return;

        let cancelled = false;

        void (async () => {
            const result = await fetchGroupPageClient(groupId);
            if (cancelled) return;

            if (!result.success) {
                setLoadError(result.message);
                setIsBootstrapping(false);
                return;
            }

            setGroupInfo(result.data.group);
            setPosts(result.data.posts.data as any[]);
            setIsJoined(!!result.data.group.isJoined);
            setLoadError(null);
            setIsBootstrapping(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [cached, groupId, invalid]);

    const loadComments = useCallback(
        async (postId: number) => {
            if (commentsByPost[postId]) return;

            setLoadingComments((prev) => new Set(prev).add(postId));
            const res = await getCommentsAction(postId);
            if (res.success && res.data?.data) {
                setCommentsByPost((prev) => ({ ...prev, [postId]: res.data.data }));
            }
            setLoadingComments((prev) => {
                const next = new Set(prev);
                next.delete(postId);
                return next;
            });
        },
        [commentsByPost]
    );

    if (invalid || groupId <= 0) {
        return <GroupErrorView message="グループが見つかりません。" />;
    }

    if (isBootstrapping || !groupInfo) {
        return (
            <div className="flex w-full min-h-screen bg-[#F0F5F2]">
                <Sidebar />
                <main className="flex-1 p-12">
                    <div className="max-w-[960px] mx-auto space-y-6 animate-pulse">
                        <div className="h-48 bg-white rounded-[32px]" />
                        <div className="h-[320px] bg-white rounded-[32px]" />
                    </div>
                </main>
            </div>
        );
    }

    if (loadError) {
        return <GroupErrorView message={loadError} />;
    }

    const handleCreatePost = async () => {
        if (!isJoined) return;
        if (!postContent.trim() && !postImage) return;
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("content", postContent);
        formData.append("groupId", groupId.toString());
        if (postImage) formData.append("image", postImage);

        const res = await createPostAction(formData);
        if (res.success) {
            setPosts([
                {
                    ...res.data,
                    isLiked: false,
                    _count: res.data._count ?? { likes: 0, comments: 0 },
                },
                ...posts,
            ]);
            setPostContent("");
            setPostImage(null);
            if (postImagePreview) URL.revokeObjectURL(postImagePreview);
            setPostImagePreview(null);
        }
        setIsSubmitting(false);
    };

    const handleLike = async (postId: number) => {
        if (!isJoined) return;
        const post = posts.find((p) => p.id === postId);
        if (!post) return;

        const res = post.isLiked
            ? await unlikePostAction(postId)
            : await likePostAction(postId);

        if (res.success) {
            setPosts(
                posts.map((p) =>
                    p.id === postId
                        ? {
                              ...p,
                              isLiked: !p.isLiked,
                              _count: {
                                  ...p._count,
                                  likes: p.isLiked
                                      ? Math.max(0, (p._count?.likes ?? 0) - 1)
                                      : (p._count?.likes ?? 0) + 1,
                              },
                          }
                        : p
                )
            );
        }
    };

    const toggleComments = async (postId: number) => {
        const next = new Set(expandedPostIds);
        if (next.has(postId)) {
            next.delete(postId);
            setExpandedPostIds(next);
        } else {
            next.add(postId);
            setExpandedPostIds(next);
            await loadComments(postId);
        }
    };

    const handleComment = async (postId: number) => {
        if (!isJoined) return;
        const content = commentInputs[postId];
        if (!content?.trim()) return;

        const res = await commentPostAction(postId, content);
        if (res.success) {
            const { password: _, ...safeAuthor } = res.data.author ?? {};
            const newComment = { ...res.data, author: safeAuthor };

            setCommentsByPost((prev) => ({
                ...prev,
                [postId]: [...(prev[postId] ?? []), newComment],
            }));
            setPosts(
                posts.map((p) =>
                    p.id === postId
                        ? {
                              ...p,
                              _count: {
                                  ...p._count,
                                  comments: (p._count?.comments ?? 0) + 1,
                              },
                          }
                        : p
                )
            );
            setCommentInputs({ ...commentInputs, [postId]: "" });
            if (!expandedPostIds.has(postId)) {
                setExpandedPostIds(new Set(expandedPostIds).add(postId));
            }
        }
    };

    const handleToggleJoin = async () => {
        setIsJoinLoading(true);
        if (isJoined) {
            const res = await leaveGroupAction(groupId);
            if (res.success) {
                setIsJoined(false);
                setGroupInfo((prev) =>
                    prev
                        ? {
                              ...prev,
                              totalMembers: Math.max(0, prev.totalMembers - 1),
                          }
                        : prev
                );
            }
        } else {
            const res = await joinGroupAction(groupId);
            if (res.success) {
                setIsJoined(true);
                setGroupInfo((prev) =>
                    prev
                        ? {
                              ...prev,
                              totalMembers: prev.totalMembers + 1,
                          }
                        : prev
                );
            }
        }
        setIsJoinLoading(false);
    };

    const handleImageSelect = (file: File | null) => {
        setPostImage(file);
        if (postImagePreview) URL.revokeObjectURL(postImagePreview);
        setPostImagePreview(file ? URL.createObjectURL(file) : null);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        if (diffHours < 1) return "たった今";
        if (diffHours < 24) return `${diffHours}時間前`;
        return `${Math.floor(diffHours / 24)}日前`;
    };

    const getFullName = (user: any) => {
        if (!user) return "匿名";
        return [user.lastName, user.firstName].filter(Boolean).join(" ") || "ユーザー";
    };

    const getAvatar = (user: any) => resolveImageUrl(user?.avatarUrl, DEFAULT_AVATAR);

    const allTags = [
        ...(groupInfo.hobbyTags || []).map((t) => t.name),
        ...(groupInfo.languageTags || []).map((t) => t.name),
    ];

    return (
        <div className="flex flex-row w-full min-h-screen" style={{ fontFamily: "'Manrope', sans-serif" }}>
            <Sidebar />
            <main className="flex flex-1 flex-col items-center bg-surface min-h-screen">
                <TopNav title="コミュニティ" backLink="/community" />
                <div className="w-full flex flex-col">
                    <div className="w-full bg-white border-b border-footer shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col items-center">
                        <div className="w-full max-w-5xl h-64 relative bg-gray-300">
                            <Image
                                src={groupInfo.groupCover || "/assets/images/home/city-bg.png"}
                                alt="Cover"
                                fill
                                sizes="(max-width: 1024px) 100vw, 1024px"
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                        </div>

                        <div className="w-full max-w-244 px-6 pb-6 -mt-12 flex flex-col gap-6 relative z-10">
                            <div className="flex items-end gap-6">
                                <div className="w-32 h-32 bg-white rounded-2xl p-1 border border-footer shadow-md shrink-0">
                                    <div className="w-full h-full relative rounded-xl overflow-hidden">
                                        <Image
                                            src={groupInfo.groupAvatar || "/assets/images/groups/group-1.jpg"}
                                            alt={groupInfo.name}
                                            fill
                                            sizes="128px"
                                            className="object-cover"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col pb-2 gap-1">
                                    <h1
                                        className="text-[30px] font-bold text-text-main tracking-[-0.75px] leading-9"
                                        style={{ fontFamily: "'Plus Jakarta Sans'" }}
                                    >
                                        {groupInfo.name}
                                    </h1>
                                    <div className="flex items-center gap-4 text-[14px] font-medium text-[#6E7979]">
                                        <span>{groupInfo.totalMembers ?? 0} メンバー</span>
                                        {groupInfo.totalPosts != null && (
                                            <span>{groupInfo.totalPosts} 投稿</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 pb-2">
                                    {isJoined ? (
                                        <button
                                            onClick={handleToggleJoin}
                                            disabled={isJoinLoading}
                                            className="bg-[#FFDAD6] text-[#923118] px-6 py-2.5 rounded-xl text-[14px] font-medium flex items-center gap-2 border border-[#923118] transition-colors disabled:opacity-60"
                                        >
                                            退出する
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleToggleJoin}
                                            disabled={isJoinLoading}
                                            className="bg-[#005B5B] text-white px-6 py-2.5 rounded-xl text-[14px] font-medium flex items-center gap-2 shadow-md hover:opacity-90 transition-colors disabled:opacity-60"
                                        >
                                            参加する
                                        </button>
                                    )}
                                </div>
                            </div>

                            <p className="max-w-2xl text-[14px] font-medium text-text-muted leading-5.75">
                                {groupInfo.description || "コミュニティの説明がありません。"}
                            </p>

                            {allTags.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {allTags.map((tagName, idx) => (
                                        <span
                                            key={idx}
                                            className="bg-[#E5E9E6] text-[#005B5B] px-3 py-1 rounded-full text-[12px] font-bold"
                                        >
                                            #{tagName}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full flex justify-center my-8">
                        <div className="w-full max-w-244 flex flex-col gap-6 px-6">
                            {isJoined ? (
                                <div className="w-full bg-white border border-footer shadow-sm rounded-2xl p-5 flex flex-col gap-4">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative shrink-0">
                                            <Image
                                                src={getAvatar(currentUser)}
                                                alt="You"
                                                fill
                                                sizes="40px"
                                                className="object-cover"
                                            />
                                        </div>
                                        <textarea
                                            value={postContent}
                                            onChange={(e) => setPostContent(e.target.value)}
                                            placeholder="何を投稿しますか？"
                                            className="flex-1 bg-surface rounded-xl p-3 min-h-20 text-[14px] text-text-main placeholder:text-[#6B7280] resize-none focus:outline-none focus:ring-1 focus:ring-[#005B5B]"
                                        />
                                    </div>

                                    {postImagePreview && (
                                        <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gray-100">
                                            <Image
                                                src={postImagePreview}
                                                alt="Preview"
                                                fill
                                                sizes="(max-width: 896px) 100vw, 896px"
                                                className="object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleImageSelect(null)}
                                                className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    )}

                                    <div className="w-full border-t border-[#EAEFEC] pt-4 flex justify-between items-center">
                                        <label className="relative flex items-center gap-2 px-3 py-1.5 hover:bg-surface rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={(e) =>
                                                    handleImageSelect(e.target.files?.[0] || null)
                                                }
                                            />
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1.5 13.5C1.0875 13.5 0.734375 13.3531 0.440625 13.0594C0.146875 12.7656 0 12.4125 0 12V1.5C0 1.0875 0.146875 0.734375 0.440625 0.440625C0.734375 0.146875 1.0875 0 1.5 0H12C12.4125 0 12.7656 0.146875 13.0594 0.440625C13.3531 0.734375 13.5 1.0875 13.5 1.5V12C13.5 12.4125 13.3531 12.7656 13.0594 13.0594C12.7656 13.3531 12.4125 13.5 12 13.5H1.5ZM1.5 12H12V1.5H1.5V12ZM2.25 10.5H11.25L8.4375 6.75L6.1875 9.75L4.5 7.5L2.25 10.5ZM1.5 12V1.5V12Z" fill="#005B5B" />
                                            </svg>
                                            <span className="text-[12px] font-medium text-text-muted leading-4">写真</span>
                                        </label>

                                        <button
                                            onClick={handleCreatePost}
                                            disabled={isSubmitting}
                                            className="bg-linear-to-br from-[#005B5B] to-[#1B7575] hover:opacity-90 text-white text-[14px] font-medium py-2 px-6 rounded-xl shadow-md transition-opacity disabled:opacity-60"
                                        >
                                            {isSubmitting ? "投稿中…" : "投稿する"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full bg-white border border-footer shadow-sm rounded-2xl p-5 text-center">
                                    <p className="text-[14px] font-medium text-[#6E7979]">
                                        投稿するにはグループに参加してください。
                                    </p>
                                </div>
                            )}

                            {posts.length === 0 ? (
                                <p className="text-center text-[14px] font-medium text-[#6E7979] py-8">
                                    まだ投稿がありません。最初の投稿をしてみましょう！
                                </p>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    {posts.map((post) => {
                                        const isExpanded = expandedPostIds.has(post.id);
                                        const comments = commentsByPost[post.id] ?? [];

                                        return (
                                            <div
                                                key={post.id}
                                                className="w-full bg-white border border-footer shadow-sm rounded-2xl flex flex-col"
                                            >
                                                <div className="p-5 flex flex-col gap-4">
                                                    <PostAuthor
                                                        post={post}
                                                        getFullName={getFullName}
                                                        getAvatar={getAvatar}
                                                        formatTime={formatTime}
                                                    />

                                                    <p className="text-[14px] font-medium text-text-main leading-5.75 whitespace-pre-wrap">
                                                        {post.content}
                                                    </p>
                                                    {post.image && (
                                                        <div className="relative w-full h-64 mt-2 rounded-xl overflow-hidden bg-gray-100">
                                                            <Image
                                                                src={post.image}
                                                                alt="Post image"
                                                                fill
                                                                sizes="(max-width: 896px) 100vw, 896px"
                                                                className="object-contain"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="border-y border-[#EAEFEC] px-5 py-3 flex justify-between items-center">
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => handleLike(post.id)}
                                                            disabled={!isJoined}
                                                            title={!isJoined ? "いいねするにはグループに参加してください" : undefined}
                                                            className={`flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                                                post.isLiked
                                                                    ? "text-[#005B5B]"
                                                                    : "text-[#6E7979] hover:text-[#005B5B]"
                                                            }`}
                                                        >
                                                            <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path
                                                                    d="M7.5 13.7625L6.4125 12.7875C5.15 11.65 4.10625 10.6687 3.28125 9.84375C2.45625 9.01875 1.8 8.27812 1.3125 7.62187C0.825 6.96562 0.484375 6.3625 0.290625 5.8125C0.096875 5.2625 0 4.7 0 4.125C0 2.95 0.39375 1.96875 1.18125 1.18125C1.96875 0.39375 2.95 0 4.125 0C4.775 0 5.39375 0.1375 5.98125 0.4125C6.56875 0.6875 7.075 1.075 7.5 1.575C7.925 1.075 8.43125 0.6875 9.01875 0.4125C9.60625 0.1375 10.225 0 10.875 0C12.05 0 13.0312 0.39375 13.8188 1.18125C14.6063 1.96875 15 2.95 15 4.125C15 4.7 14.9031 5.2625 14.7094 5.8125C14.5156 6.3625 14.175 6.96562 13.6875 7.62187C13.2 8.27812 12.5437 9.01875 11.7188 9.84375C10.8938 10.6687 9.85 11.65 8.5875 12.7875L7.5 13.7625Z"
                                                                    fill="currentColor"
                                                                />
                                                            </svg>
                                                            <span className="text-[12px] font-medium">いいね</span>
                                                        </button>
                                                        <button
                                                            onClick={() => toggleComments(post.id)}
                                                            className={`flex items-center gap-1.5 transition-colors ${
                                                                isExpanded
                                                                    ? "text-[#005B5B]"
                                                                    : "text-[#6E7979] hover:text-[#005B5B]"
                                                            }`}
                                                        >
                                                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M0 15V1.5C0 1.0875 0.146875 0.734375 0.440625 0.440625C0.734375 0.146875 1.0875 0 1.5 0H13.5C13.9125 0 14.2656 0.146875 14.5594 0.440625C14.8531 0.734375 15 1.0875 15 1.5V10.5C15 10.9125 14.8531 11.2656 14.5594 11.5594C14.2656 11.8531 13.9125 12 13.5 12H3L0 15ZM2.3625 10.5H13.5V1.5H1.5V11.3438L2.3625 10.5Z" fill="currentColor" />
                                                            </svg>
                                                            <span className="text-[12px] font-medium">コメント</span>
                                                        </button>
                                                    </div>
                                                    <PostCounts post={post} />
                                                </div>

                                                {isExpanded && (
                                                    <div className="bg-surface p-5 rounded-b-2xl flex flex-col gap-4">
                                                        {loadingComments.has(post.id) ? (
                                                            <p className="text-[12px] text-[#6E7979] text-center py-2">
                                                                読み込み中…
                                                            </p>
                                                        ) : (
                                                            comments.map((comment) => (
                                                                <div key={comment.id} className="flex gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden relative shrink-0">
                                                                        <Image
                                                                            src={getAvatar(comment.author)}
                                                                            alt={getFullName(comment.author)}
                                                                            fill
                                                                            sizes="32px"
                                                                            className="object-cover"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 bg-white border border-[#EAEFEC] rounded-2xl p-3">
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="text-[12px] font-medium text-text-main">
                                                                                {getFullName(comment.author)}
                                                                            </span>
                                                                            <span className="text-[10px] font-medium text-[#6E7979]">
                                                                                {formatTime(comment.createdAt)}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[12px] font-medium text-text-muted">
                                                                            {comment.content}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}

                                                        {isJoined ? (
                                                            <div className="flex gap-3 mt-2">
                                                                <CommentAvatar currentUser={currentUser} getAvatar={getAvatar} />
                                                                <div className="flex-1 relative">
                                                                    <input
                                                                        type="text"
                                                                        value={commentInputs[post.id] ?? ""}
                                                                        onChange={(e) =>
                                                                            setCommentInputs({
                                                                                ...commentInputs,
                                                                                [post.id]: e.target.value,
                                                                            })
                                                                        }
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") handleComment(post.id);
                                                                        }}
                                                                        placeholder="コメントを書く…"
                                                                        className="w-full bg-white border border-[#EAEFEC] rounded-full px-4 py-2 text-[12px] font-medium text-text-main placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#005B5B]"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleComment(post.id)}
                                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#005B5B]"
                                                                    >
                                                                        <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M0 12V0L14.25 6L0 12ZM1.5 9.75L10.3875 6L1.5 2.25V4.875L6 6L1.5 7.125V9.75Z" fill="#005B5B" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-[12px] font-medium text-[#6E7979] text-center mt-2">
                                                                コメントするにはグループに参加してください。
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export function GroupErrorView({ message }: { message: string }) {
    return (
        <div className="flex w-full min-h-screen items-center justify-center bg-[#F0F5F2]">
            <p className="text-[14px] font-medium text-[#923118]">{message}</p>
        </div>
    );
}

function PostAuthor({
    post,
    getFullName,
    getAvatar,
    formatTime,
}: {
    post: any;
    getFullName: (user: any) => string;
    getAvatar: (user: any) => string;
    formatTime: (date: string) => string;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                <Image
                    src={getAvatar(post.author)}
                    alt={getFullName(post.author)}
                    fill
                    sizes="40px"
                    className="object-cover"
                />
            </div>
            <div className="flex flex-col">
                <span className="text-[14px] font-medium text-text-main leading-5">
                    {getFullName(post.author)}
                </span>
                <span className="text-[11px] font-medium text-[#6E7979] leading-4">
                    {formatTime(post.createdAt)}
                </span>
            </div>
        </div>
    );
}

function PostCounts({ post }: { post: any }) {
    return (
        <div className="flex gap-3 text-[11px] font-medium text-[#6E7979]">
            <span>{post._count?.likes ?? 0}件のいいね</span>
            <span>{post._count?.comments ?? 0}件のコメント</span>
        </div>
    );
}

function CommentAvatar({
    currentUser,
    getAvatar,
}: {
    currentUser: any;
    getAvatar: (user: any) => string;
}) {
    return (
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative shrink-0">
            <Image src={getAvatar(currentUser)} alt="You" fill sizes="32px" className="object-cover" />
        </div>
    );
}
