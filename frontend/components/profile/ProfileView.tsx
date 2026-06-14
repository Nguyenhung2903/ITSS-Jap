"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopNav from "@/components/layouts/TopNav";
import ProfileEditModal from "@/components/profile/ProfileEditModal";
import { resolveImageUrl } from "@/lib/image";
import type { UserProfile } from "@/app/actions/profile";
import {
    blockUserAction,
    createMatchSessionAction,
    likeUserAction,
    passUserAction,
    reportUserAction,
} from "@/app/actions/matching";

type ProfileViewProps = {
    profile: UserProfile;
};

const SWIPE_DURATION_MS = 400;
const SUCCESS_TOAST_MS = 900;

type SwipeDirection = "left" | "right" | null;
type PendingAction = "like" | "pass" | null;
type ActionToast = { kind: "like" | "pass" | "match"; message: string } | null;

function ProgressBar({ percent }: { percent: number }) {
    return (
        <div className="relative h-2 w-32 overflow-hidden rounded-full bg-[#E4D1B2]">
            <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#004F4F] via-[#006A6A] to-[#8B5E34]"
                style={{ width: `${percent}%` }}
            />
        </div>
    );
}

function ActionButtonSpinner() {
    return (
        <span className="h-4 w-4 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin" />
    );
}

type OtherProfileActionsProps = {
    isLiked: boolean;
    hasPassed: boolean;
    isMutualMatch: boolean;
    chatSessionId: number | null;
    isBusy: boolean;
    isAnimating: boolean;
    pendingAction: PendingAction;
    onStartChat: () => void;
    onPass: () => void;
    onLike: () => void;
    onOpenReport: () => void;
    onOpenBlock: () => void;
};

function OtherProfileActions({
    isLiked,
    hasPassed,
    isMutualMatch,
    chatSessionId,
    isBusy,
    isAnimating,
    pendingAction,
    onStartChat,
    onPass,
    onLike,
    onOpenReport,
    onOpenBlock,
}: OtherProfileActionsProps) {
    const passActive = pendingAction === "pass" && isAnimating;
    const likeActive = pendingAction === "like" && isAnimating;
    const canChat = Boolean(chatSessionId) || isMutualMatch;
    const chatLabel = chatSessionId ? "チャットを開く" : "チャットを始める";
    const chatHint = chatSessionId
        ? null
        : isMutualMatch
            ? null
            : isLiked
                ? "相手からのいいねを待っています。マッチング成立後にチャットできます。"
                : "お互いにいいねしてマッチング成立後にチャットできます。";

    return (
        <div className="flex w-full flex-col gap-4 pt-6">
            <div className="rounded-2xl border border-[#E4D1B2]/80 bg-[#F8EEDB] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <p className="mb-2 text-[12px] font-black tracking-[1px] text-[#8B5E34] uppercase">
                    アクションについて
                </p>

                <div className="flex flex-col gap-1.5 text-[13px] leading-relaxed text-[#6E7979]">
                    <p>
                        <span className="font-bold text-[#005B5B]">いいね</span>
                        {" — 相手に通知されます。お互いにいいねするとマッチング成立です。"}
                    </p>
                    <p>
                        <span className="font-bold text-[#8B5E34]">見送る</span>
                        {" — 候補リストから非表示になります。相手には通知されません。"}
                    </p>
                    <p>
                        <span className="font-bold text-[#005B5B]">チャット</span>
                        {" — マッチング成立後のみ利用できます。"}
                    </p>
                </div>
            </div>

            <div className="flex w-full flex-col gap-3">
                <button
                    type="button"
                    onClick={onStartChat}
                    disabled={isBusy || isAnimating || !canChat}
                    title={canChat ? chatLabel : chatHint ?? undefined}
                    className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold transition-all active:scale-[0.98] ${canChat
                            ? "bg-gradient-to-r from-[#004F4F] via-[#006A6A] to-[#8B5E34] text-white shadow-[0_12px_24px_rgba(0,91,91,0.18)] hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(0,91,91,0.28)] disabled:cursor-wait disabled:opacity-70"
                            : "cursor-not-allowed border border-[#D9C7A5]/70 bg-[#F3E7D2] text-[#A99B87]"
                        }`}
                >
                    <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden>
                        <path d="M0 14L14 7L0 0V5.25L8.75 7L0 8.75V14Z" fill="currentColor" />
                    </svg>
                    {chatLabel}
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onPass}
                        disabled={isBusy || hasPassed || isAnimating}
                        title="この相手を候補リストから非表示にします。"
                        className={`flex h-14 items-center justify-center gap-2 rounded-2xl text-[14px] font-bold transition-all duration-200 disabled:cursor-not-allowed ${hasPassed
                                ? "border border-[#B86B4B]/25 bg-[#F8E0D5] text-[#923118] opacity-70"
                                : passActive
                                    ? "scale-95 bg-[#8B5E34] text-white shadow-lg"
                                    : "border border-[#D9C7A5]/80 bg-[#FFFDF7] text-[#8B5E34] hover:border-[#8B5E34]/35 hover:bg-[#F8EEDB] disabled:opacity-60"
                            }`}
                    >
                        {passActive ? (
                            <ActionButtonSpinner />
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden>
                                <path
                                    d="M1 1L11 11M11 1L1 11"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        )}
                        {hasPassed ? "見送り済み" : passActive ? "見送り中..." : "見送る"}
                    </button>

                    <button
                        type="button"
                        onClick={onLike}
                        disabled={isBusy || isLiked || isAnimating}
                        title="相手にいいねを送ります。"
                        className={`flex h-14 items-center justify-center gap-2 rounded-2xl text-[14px] font-bold transition-all duration-200 disabled:cursor-not-allowed ${isLiked
                                ? "border border-[#005B5B]/20 bg-[#DDEDEA] text-[#005B5B] opacity-80"
                                : likeActive
                                    ? "scale-95 bg-[#005B5B] text-white shadow-lg"
                                    : "border border-[#005B5B]/25 bg-[#FFFDF7] text-[#005B5B] hover:border-[#005B5B]/45 hover:bg-[#DDEDEA] disabled:opacity-60"
                            }`}
                    >
                        {likeActive ? (
                            <ActionButtonSpinner />
                        ) : (
                            <svg width="17" height="15" viewBox="0 0 17 15" fill="none" aria-hidden>
                                <path
                                    d="M8.5 14.25L7.2875 13.1625C3.65 9.9125 1.5 7.9875 1.5 5.625C1.5 3.7125 3.0125 2.25 5 2.25C6.0875 2.25 7.1375 2.71875 8 3.58125C8.8625 2.71875 9.9125 2.25 11 2.25C12.9875 2.25 14.5 3.7125 14.5 5.625C14.5 7.9875 12.35 9.9125 8.7125 13.1625L8.5 14.25Z"
                                    fill="currentColor"
                                />
                            </svg>
                        )}
                        {isLiked ? "いいね済み" : likeActive ? "送信中..." : "いいね"}
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onOpenReport}
                        disabled={isBusy || isAnimating}
                        className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-[#D9C7A5]/80 bg-[#FFFDF7] text-[13px] font-bold text-[#8B5E34] transition-all hover:bg-[#F8EEDB] disabled:opacity-60"
                    >
                        通報
                    </button>

                    <button
                        type="button"
                        onClick={onOpenBlock}
                        disabled={isBusy || isAnimating}
                        className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-[#B86B4B]/25 bg-[#F8E0D5] text-[13px] font-bold text-[#923118] transition-all hover:bg-[#F3D0C0] disabled:opacity-60"
                    >
                        ブロック
                    </button>
                </div>

                {chatHint && <p className="pl-1 text-[13px] leading-relaxed text-[#6E7979]">{chatHint}</p>}
            </div>
        </div>
    );
}

function ActionSwipeOverlay({ direction }: { direction: SwipeDirection }) {
    if (!direction) return null;

    const isLike = direction === "right";

    return (
        <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl backdrop-blur-[2px] transition-opacity duration-300 ${isLike ? "bg-[#005B5B]/75" : "bg-[#8B5E34]/80"
                }`}
            aria-live="polite"
        >
            <div className="flex flex-col items-center gap-3 text-white animate-profile-action-scale-in">
                {isLike ? (
                    <svg width="64" height="56" viewBox="0 0 17 15" fill="none" aria-hidden>
                        <path
                            d="M8.5 14.25L7.2875 13.1625C3.65 9.9125 1.5 7.9875 1.5 5.625C1.5 3.7125 3.0125 2.25 5 2.25C6.0875 2.25 7.1375 2.71875 8 3.58125C8.8625 2.71875 9.9125 2.25 11 2.25C12.9875 2.25 14.5 3.7125 14.5 5.625C14.5 7.9875 12.35 9.9125 8.7125 13.1625L8.5 14.25Z"
                            fill="white"
                        />
                    </svg>
                ) : (
                    <svg width="56" height="56" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path
                            d="M1 1L11 11M11 1L1 11"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                    </svg>
                )}

                <span className="text-[28px] font-extrabold tracking-wide drop-shadow-sm">
                    {isLike ? "いいね！" : "見送り"}
                </span>
                <span className="text-[14px] font-medium opacity-90">
                    {isLike ? "相手に通知しています..." : "候補リストから非表示にします"}
                </span>
            </div>
        </div>
    );
}

function ActionResultToast({ toast }: { toast: ActionToast }) {
    if (!toast) return null;

    const styles =
        toast.kind === "match"
            ? "border-[#004A4A] bg-[#005B5B] text-white"
            : toast.kind === "like"
                ? "border-[#005B5B]/20 bg-[#DDEDEA] text-[#005B5B]"
                : "border-[#D9C7A5]/70 bg-[#FFFDF7] text-[#8B5E34]";

    return (
        <div
            className={`fixed bottom-8 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-6 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] animate-profile-action-slide-up ${styles}`}
            role="status"
            aria-live="polite"
        >
            {toast.kind === "pass" ? (
                <svg width="18" height="18" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path
                        d="M1 1L11 11M11 1L1 11"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            ) : (
                <svg width="20" height="18" viewBox="0 0 17 15" fill="none" aria-hidden>
                    <path
                        d="M8.5 14.25L7.2875 13.1625C3.65 9.9125 1.5 7.9875 1.5 5.625C1.5 3.7125 3.0125 2.25 5 2.25C6.0875 2.25 7.1375 2.71875 8 3.58125C8.8625 2.71875 9.9125 2.25 11 2.25C12.9875 2.25 14.5 3.7125 14.5 5.625C14.5 7.9875 12.35 9.9125 8.7125 13.1625L8.5 14.25Z"
                        fill="currentColor"
                    />
                </svg>
            )}

            <span className="text-[15px] font-bold">{toast.message}</span>
        </div>
    );
}

function ProfileActions({ isOwn, onEdit }: { isOwn: boolean; onEdit: () => void }) {
    if (!isOwn) return null;

    return (
        <div className="w-full pt-6">
            <button
                type="button"
                onClick={onEdit}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#004F4F] via-[#006A6A] to-[#8B5E34] text-[16px] font-bold text-white shadow-[0_12px_24px_rgba(0,91,91,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(0,91,91,0.28)] active:scale-[0.98]"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                        d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"
                        fill="white"
                    />
                </svg>
                プロフィール編集
            </button>
        </div>
    );
}

function ConfirmDialog({
    open,
    title,
    description,
    isBusy,
    confirmLabel = "はい",
    confirmVariant = "danger",
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title?: string;
    description: string;
    isBusy: boolean;
    confirmLabel?: string;
    confirmVariant?: "danger" | "neutral";
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;

    const confirmClass =
        confirmVariant === "neutral"
            ? "bg-[#8B5E34] hover:bg-[#764C29]"
            : "bg-[#923118] hover:bg-[#7A2813]";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
            <div className="flex w-full max-w-md flex-col gap-4 rounded-[28px] border border-[#D9C7A5]/70 bg-[#FFFDF7] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
                {title && (
                    <h3 className="text-center text-[18px] font-bold text-[#181D1B]">{title}</h3>
                )}

                <p className="whitespace-pre-line text-center text-[16px] font-medium leading-relaxed text-[#181D1B]">
                    {description}
                </p>

                <div className="flex justify-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isBusy}
                        className="rounded-xl bg-[#F3E7D2] px-8 py-2.5 text-[14px] font-medium text-[#3E4948] transition-all hover:bg-[#E4D1B2] disabled:opacity-60"
                    >
                        いいえ
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isBusy}
                        className={`rounded-xl px-8 py-2.5 text-[14px] font-bold text-white transition-all disabled:opacity-60 ${confirmClass}`}
                    >
                        {isBusy ? "処理中..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PassConfirmDialog({
    open,
    profileName,
    isBusy,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    profileName: string;
    isBusy: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
            <div className="flex w-full max-w-md flex-col gap-4 rounded-[28px] border border-[#D9C7A5]/70 bg-[#FFFDF7] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
                <h3 className="text-center text-[18px] font-bold text-[#181D1B]">
                    本当に見送りますか？
                </h3>

                <p className="text-center text-[15px] leading-relaxed text-[#3E4948]">
                    {profileName}さんを見送ると、以下のようになります。
                </p>

                <ul className="flex list-inside list-disc flex-col gap-2 rounded-2xl border border-[#E4D1B2]/80 bg-[#F8EEDB] px-4 py-3 text-[14px] leading-relaxed text-[#6E7979]">
                    <li>マッチング候補リストに表示されなくなります</li>
                    <li>相手には通知されません</li>
                    <li>この操作は取り消せません</li>
                </ul>

                <div className="flex justify-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isBusy}
                        className="rounded-xl bg-[#F3E7D2] px-8 py-2.5 text-[14px] font-medium text-[#3E4948] transition-all hover:bg-[#E4D1B2] disabled:opacity-60"
                    >
                        キャンセル
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isBusy}
                        className="rounded-xl bg-[#8B5E34] px-8 py-2.5 text-[14px] font-bold text-white transition-all hover:bg-[#764C29] disabled:opacity-60"
                    >
                        {isBusy ? "処理中..." : "見送る"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ReportDialog({
    open,
    reason,
    evidence,
    isBusy,
    error,
    success,
    onReasonChange,
    onEvidenceChange,
    onSubmit,
    onCancel,
}: {
    open: boolean;
    reason: string;
    evidence: File | null;
    isBusy: boolean;
    error: string | null;
    success: boolean;
    onReasonChange: (value: string) => void;
    onEvidenceChange: (file: File | null) => void;
    onSubmit: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
            <div className="flex w-full max-w-md flex-col gap-4 rounded-[28px] border border-[#D9C7A5]/70 bg-[#FFFDF7] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
                <h3 className="text-[18px] font-bold text-[#181D1B]">このユーザーを通報する</h3>

                {success ? (
                    <p className="py-4 text-center text-[14px] font-medium text-[#005B5B]">
                        通報を受け付けました。ご協力ありがとうございます。
                    </p>
                ) : (
                    <>
                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-bold text-[#3E4948]">
                                通報理由 <span className="text-[#923118]">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(event) => onReasonChange(event.target.value)}
                                rows={4}
                                placeholder="通報理由を入力してください"
                                className="w-full resize-none rounded-2xl border border-[#D9C7A5]/70 bg-[#FFFDF7] px-4 py-3 text-[14px] text-[#181D1B] outline-none focus:border-[#005B5B]/40 focus:ring-2 focus:ring-[#005B5B]/15"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-bold text-[#3E4948]">
                                証拠画像（任意・最大1枚）
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;
                                    onEvidenceChange(file);
                                }}
                                className="text-[13px] text-[#3E4948] file:mr-3 file:rounded-xl file:border-0 file:bg-[#DDEDEA] file:px-4 file:py-2 file:font-bold file:text-[#005B5B]"
                            />

                            {evidence && (
                                <p className="text-[12px] text-[#6E7979]">選択中: {evidence.name}</p>
                            )}
                        </div>

                        {error && <p className="text-[13px] text-[#923118]">{error}</p>}
                    </>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isBusy}
                        className="rounded-xl bg-[#F3E7D2] px-5 py-2.5 text-[14px] font-medium text-[#3E4948] transition-all hover:bg-[#E4D1B2] disabled:opacity-60"
                    >
                        キャンセル
                    </button>

                    {!success && (
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={isBusy}
                            className="rounded-xl bg-[#005B5B] px-5 py-2.5 text-[14px] font-bold text-white transition-all hover:bg-[#004A4A] disabled:opacity-60"
                        >
                            {isBusy ? "送信中..." : "送信する"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-4">
            <h3 className="text-[12px] leading-none font-extrabold tracking-[2px] whitespace-nowrap text-[#8B5E34] uppercase select-none">
                {children}
            </h3>
            <div className="h-px flex-1 bg-[#D9C7A5]/60" />
        </div>
    );
}

export default function ProfileView({ profile: initialProfile }: ProfileViewProps) {
    const router = useRouter();

    const [profile, setProfile] = useState(initialProfile);
    const [editOpen, setEditOpen] = useState(false);
    const isOwn = profile.viewType === "own";

    const [activeIndex, setActiveIndex] = useState(0);
    const [isLiked, setIsLiked] = useState(initialProfile.isLiked ?? false);
    const [hasPassed, setHasPassed] = useState(initialProfile.hasPassed ?? false);
    const [isMutualMatch, setIsMutualMatch] = useState(initialProfile.isMutualMatch ?? false);
    const [chatSessionId, setChatSessionId] = useState<number | null>(
        initialProfile.chatSessionId ?? null
    );
    const [actionBusy, setActionBusy] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [actionToast, setActionToast] = useState<ActionToast>(null);
    const [blockOpen, setBlockOpen] = useState(false);
    const [passOpen, setPassOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportEvidence, setReportEvidence] = useState<File | null>(null);
    const [reportError, setReportError] = useState<string | null>(null);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [swipeExit, setSwipeExit] = useState<SwipeDirection>(null);

    useEffect(() => {
        setProfile(initialProfile);
        setIsLiked(initialProfile.isLiked ?? false);
        setHasPassed(initialProfile.hasPassed ?? false);
        setIsMutualMatch(initialProfile.isMutualMatch ?? false);
        setChatSessionId(initialProfile.chatSessionId ?? null);
        setActionError(null);
        setPendingAction(null);
        setActionToast(null);
        setPassOpen(false);
        setSwipeExit(null);
    }, [initialProfile]);

    const waitSwipe = useCallback((direction: SwipeDirection) => {
        setSwipeExit(direction);

        return new Promise<void>((resolve) => {
            setTimeout(resolve, SWIPE_DURATION_MS);
        });
    }, []);

    const runAction = useCallback(
        async (fn: () => Promise<{ success: boolean; message?: string }>) => {
            setActionBusy(true);
            setActionError(null);

            const result = await fn();

            setActionBusy(false);

            if (!result.success) {
                setSwipeExit(null);
                setActionError(result.message ?? "操作に失敗しました。");
                return false;
            }

            return true;
        },
        []
    );

    const handleStartChat = useCallback(async () => {
        if (chatSessionId) {
            router.push(`/chat?session=${chatSessionId}`);
            return;
        }

        if (!isMutualMatch) {
            setActionError("お互いにいいねしてマッチングが成立するまで、チャットを開始できません。");
            return;
        }

        setActionBusy(true);
        setActionError(null);

        const result = await createMatchSessionAction(profile.id);

        setActionBusy(false);

        if (!result.success) {
            setActionError(result.message ?? "チャットの開始に失敗しました。");
            return;
        }

        setChatSessionId(result.data.id);
        router.push(`/chat?session=${result.data.id}`);
    }, [profile.id, router, chatSessionId, isMutualMatch]);

    const showSuccessToast = useCallback((toast: NonNullable<ActionToast>) => {
        setActionToast(toast);

        return new Promise<void>((resolve) => {
            setTimeout(resolve, SUCCESS_TOAST_MS);
        });
    }, []);

    const executePass = useCallback(async () => {
        if (actionBusy || hasPassed) return;

        setPassOpen(false);
        setPendingAction("pass");
        setActionBusy(true);
        setActionError(null);

        await waitSwipe("left");

        const result = await passUserAction(profile.id);

        setActionBusy(false);

        if (!result.success) {
            setSwipeExit(null);
            setPendingAction(null);
            setActionError(result.message ?? "操作に失敗しました。");
            return;
        }

        setHasPassed(true);
        await showSuccessToast({
            kind: "pass",
            message: "見送りました。候補リストに表示されません。",
        });
        router.push("/matching");
    }, [profile.id, router, actionBusy, hasPassed, waitSwipe, showSuccessToast]);

    const handlePassRequest = useCallback(() => {
        if (actionBusy || hasPassed || swipeExit !== null) return;
        setPassOpen(true);
    }, [actionBusy, hasPassed, swipeExit]);

    const handleLike = useCallback(async () => {
        if (actionBusy || isLiked) return;

        setPendingAction("like");
        setActionBusy(true);
        setActionError(null);

        await waitSwipe("right");

        const result = await likeUserAction(profile.id);

        setActionBusy(false);

        if (!result.success) {
            setSwipeExit(null);
            setPendingAction(null);
            setActionError(result.message ?? "操作に失敗しました。");
            return;
        }

        setIsLiked(true);

        if (result.matched && result.sessionId) {
            setIsMutualMatch(true);
            setChatSessionId(result.sessionId);
            await showSuccessToast({
                kind: "match",
                message: "マッチング成立！チャットへ移動します。",
            });
            router.push(`/chat?session=${result.sessionId}`);
            return;
        }

        await showSuccessToast({
            kind: "like",
            message: "いいねを送りました。相手に通知されました。",
        });
        router.push("/matching");
    }, [profile.id, router, actionBusy, isLiked, waitSwipe, showSuccessToast]);

    const handleBlock = useCallback(async () => {
        const ok = await runAction(async () => {
            const result = await blockUserAction(profile.id);

            if (!result.success) return result;

            setBlockOpen(false);
            router.push("/matching");

            return { success: true };
        });

        if (!ok) return;
    }, [profile.id, router, runAction]);

    const handleReport = useCallback(async () => {
        if (!reportReason.trim()) {
            setReportError("理由を入力してください。");
            return;
        }

        setReportError(null);
        setActionBusy(true);

        const result = await reportUserAction(profile.id, reportReason, reportEvidence);

        setActionBusy(false);

        if (!result.success) {
            setReportError(result.message ?? "通報に失敗しました。");
            return;
        }

        setReportSuccess(true);

        setTimeout(() => {
            setReportOpen(false);
            setReportSuccess(false);
            setReportReason("");
            setReportEvidence(null);
        }, 1500);
    }, [profile.id, reportReason, reportEvidence]);

    const closeReportDialog = useCallback(() => {
        setReportOpen(false);
        setReportSuccess(false);
        setReportReason("");
        setReportEvidence(null);
        setReportError(null);
    }, []);

    const cardSwipeClass =
        swipeExit === "right"
            ? "translate-x-[120%] opacity-0 pointer-events-none"
            : swipeExit === "left"
                ? "-translate-x-[120%] opacity-0 pointer-events-none"
                : "";

    const images = useMemo(() => {
        const raw =
            profile.gallery.length > 0
                ? profile.gallery
                : profile.avatarUrl
                    ? [profile.avatarUrl]
                    : [];
        const unique = [...new Set(raw.filter(Boolean))];

        return unique.length > 0 ? unique : ["/assets/images/avatars/avatar.jpg"];
    }, [profile.gallery, profile.avatarUrl]);

    const goPrev = useCallback(() => {
        setActiveIndex((index) => (index === 0 ? images.length - 1 : index - 1));
    }, [images.length]);

    const goNext = useCallback(() => {
        setActiveIndex((index) => (index === images.length - 1 ? 0 : index + 1));
    }, [images.length]);

    return (
        <div
            className="flex h-screen w-full overflow-hidden bg-[#F3EFE4]"
            style={{
                fontFamily: "'Plus Jakarta Sans', 'Manrope', 'Noto Sans JP', sans-serif",
            }}
        >
            <Sidebar />

            <div className="relative flex flex-1 flex-col overflow-hidden">
                <TopNav backLink={isOwn ? undefined : "/matching"} />

                <main className="hide-scrollbar flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(231,111,81,0.10),transparent_32%),linear-gradient(180deg,#F8F4EA_0%,#F3EFE4_45%,#EEF5F2_100%)] p-8 lg:p-12">
                    <div className="mx-auto flex max-w-[1280px] flex-col gap-8">
                        <div className="flex flex-col gap-1.5">
                            <h2 className="text-[30px] leading-[38px] font-extrabold tracking-[-0.8px] text-[#005B5B]">
                                プロフィール
                            </h2>
                            <p className="text-[14px] font-medium text-[#6E7979]">
                                交流相手の言語、興味、目的を確認しましょう。
                            </p>
                        </div>

                        <div
                            className={`flex w-full flex-col items-start gap-8 transition-all duration-[400ms] ease-in-out will-change-transform lg:flex-row ${!isOwn ? cardSwipeClass : ""
                                }`}
                        >
                            <aside className="relative flex w-full shrink-0 flex-col gap-5 rounded-[32px] border border-[#D9C7A5]/75 bg-[#FFFDF7] p-5 shadow-[0_16px_36px_rgba(79,55,30,0.10)] ring-1 ring-white/70 lg:sticky lg:top-[104px] lg:w-[340px]">
                                <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 rounded-t-[32px] bg-gradient-to-r from-[#8B5E34] via-[#E76F51] to-[#005B5B]" />

                                <div className="group relative h-[320px] w-full overflow-hidden rounded-2xl border-[3px] border-[#F6EAD5] bg-[#EFE3D0] shadow-[0_10px_22px_rgba(79,55,30,0.16)]">
                                    <Image
                                        src={resolveImageUrl(images[activeIndex])}
                                        alt={profile.name}
                                        fill
                                        className="object-cover"
                                        priority
                                    />

                                    {!isOwn && swipeExit && <ActionSwipeOverlay direction={swipeExit} />}

                                    {!isOwn && profile.isOnline && (
                                        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/30 bg-white/85 px-3 py-1 shadow-sm backdrop-blur-md">
                                            <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                                            <span className="text-[10px] font-bold tracking-[0.5px] text-[#181D1B] uppercase">
                                                オンライン
                                            </span>
                                        </div>
                                    )}

                                    {images.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={goPrev}
                                                className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
                                                aria-label="前の写真"
                                            >
                                                <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                                                    <path
                                                        d="M6.5 1L1.5 6L6.5 11"
                                                        stroke="white"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={goNext}
                                                className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
                                                aria-label="次の写真"
                                            >
                                                <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                                                    <path
                                                        d="M1.5 1L6.5 6L1.5 11"
                                                        stroke="white"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </button>

                                            <div className="absolute bottom-4 z-10 flex w-full justify-center gap-1.5">
                                                {images.map((_, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => setActiveIndex(index)}
                                                        className={`h-1.5 rounded-full transition-all ${index === activeIndex
                                                                ? "w-5 bg-white"
                                                                : "w-1.5 bg-white/55"
                                                            }`}
                                                        aria-label={`写真${index + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {images.length > 1 && (
                                    <div className="-mt-1 flex h-[54px] w-full gap-2">
                                        {images.slice(0, 4).map((image, index) => (
                                            <button
                                                key={`${image}-${index}`}
                                                type="button"
                                                onClick={() => setActiveIndex(index)}
                                                className={`relative h-full w-[calc(25%-6px)] shrink-0 overflow-hidden rounded-xl transition-all ${index === activeIndex
                                                        ? "ring-2 ring-[#005B5B] ring-offset-2 ring-offset-[#FFFDF7]"
                                                        : "opacity-70 hover:opacity-100"
                                                    }`}
                                            >
                                                <Image
                                                    src={resolveImageUrl(image)}
                                                    alt={`ギャラリー ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="80px"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-col gap-4">
                                    <div className="flex items-end gap-2.5">
                                        <h1 className="text-[24px] leading-[30px] font-extrabold tracking-[-0.5px] text-[#181D1B]">
                                            {profile.name}
                                        </h1>
                                        {profile.age != null && (
                                            <span className="pb-0.5 text-[18px] leading-[24px] font-light text-[#6E7979]">
                                                {profile.age}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 text-[#005B5B]">
                                        <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden>
                                            <path
                                                d="M5 0C2.23858 0 0 2.23858 0 5C0 8.75 5 12 5 12C5 12 10 8.75 10 5C10 2.23858 7.76142 0 5 0ZM5 7C3.89543 7 3 6.10457 3 5C3 3.89543 3.89543 3 5 3C6.10457 3 7 3.89543 7 5C7 6.10457 6.10457 7 5 7Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                        <span className="text-[14px] font-medium">
                                            {profile.location || "所在地未設定"}
                                        </span>

                                        {!isOwn && profile.mutualFriendsCount > 0 && (
                                            <>
                                                <span className="px-0.5 text-[14px] text-[#D9C7A5]">·</span>
                                                <span className="text-[13px] font-medium text-[#6E7979]">
                                                    共通の友人が{profile.mutualFriendsCount}人
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2.5">
                                        {profile.isVerified && (
                                            <div className="flex w-full items-center gap-2.5 rounded-xl border border-[#005B5B]/15 bg-[#DDEDEA] px-3.5 py-1.5">
                                                <span className="h-2 w-2 rounded-full bg-[#005B5B]" />
                                                <span className="text-[11px] font-bold text-[#005B5B]">
                                                    身分証確認済み
                                                </span>
                                            </div>
                                        )}

                                        {!isOwn && profile.isStoryteller && (
                                            <div className="flex w-full items-center gap-2.5 rounded-xl border border-[#B86B4B]/25 bg-[#F8E0D5] px-3.5 py-1.5">
                                                <span className="h-2 w-2 rounded-full bg-[#923118]" />
                                                <span className="text-[11px] font-bold text-[#923118]">
                                                    ストーリーテラー
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {profile.purposes.length > 0 && (
                                        <div className="flex w-full flex-col gap-2.5 border-t border-[#D9C7A5]/60 pt-3">
                                            <h4 className="text-[10px] font-black tracking-[1px] text-[#8B5E34] uppercase">
                                                交流の目的
                                            </h4>

                                            <div className="flex flex-wrap gap-1.5">
                                                {profile.purposes.map((purpose) => (
                                                    <span
                                                        key={purpose.label}
                                                        className="flex items-center gap-1 rounded-full border border-[#005B5B]/20 bg-[#DDEDEA] px-2.5 py-1.5 text-[11px] font-bold text-[#005B5B]"
                                                    >
                                                        <span className="text-[12px]">{purpose.emoji}</span>
                                                        {purpose.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </aside>

                            <div className="flex min-w-0 flex-1 flex-col gap-6">
                                {profile.bio && (
                                    <section className="flex flex-col gap-3">
                                        <SectionTitle>自己紹介</SectionTitle>

                                        <div className="rounded-[28px] border border-[#D9C7A5]/75 bg-[#FFFDF7] p-6 shadow-[0_16px_36px_rgba(79,55,30,0.10)] ring-1 ring-white/70">
                                            <p className="whitespace-pre-wrap text-[16px] leading-[26px] font-medium text-[#3E4948]">
                                                {profile.bio}
                                            </p>
                                        </div>
                                    </section>
                                )}

                                {profile.languages.length > 0 && (
                                    <section className="flex flex-col gap-4">
                                        <SectionTitle>語学レベル</SectionTitle>

                                        {isOwn ? (
                                            <div className="flex w-full flex-col gap-4 rounded-[28px] border border-[#D9C7A5]/75 bg-[#FFFDF7] p-6 shadow-[0_16px_36px_rgba(79,55,30,0.10)] ring-1 ring-white/70">
                                                {profile.languages.map((language) => (
                                                    <div
                                                        key={language.name}
                                                        className="flex w-full items-center justify-between rounded-2xl border border-[#E4D1B2]/80 bg-[#F8EEDB] px-5 py-3.5 transition-all duration-300 hover:border-[#005B5B]/25"
                                                    >
                                                        <span className="text-[15px] font-bold text-[#181D1B]">
                                                            {language.name}
                                                        </span>

                                                        <div
                                                            className={`rounded-full px-3 py-1 text-[11px] font-black tracking-wide ${language.levelType === "learning"
                                                                    ? "border border-[#B86B4B]/25 bg-[#F8E0D5] text-[#923118]"
                                                                    : "border border-[#005B5B]/20 bg-[#DDEDEA] text-[#005B5B]"
                                                                }`}
                                                        >
                                                            {language.levelText}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="w-full rounded-[28px] border border-[#D9C7A5]/75 bg-[#FFFDF7] p-6 shadow-[0_16px_36px_rgba(79,55,30,0.10)] ring-1 ring-white/70">
                                                <div className="w-full overflow-x-auto">
                                                    <table className="w-full min-w-[400px]">
                                                        <thead>
                                                            <tr className="border-b border-[#D9C7A5]/70">
                                                                <th className="pb-3 text-left text-[10px] font-black tracking-[1px] text-[#8B5E34] uppercase">
                                                                    言語
                                                                </th>
                                                                <th className="pb-3 text-left text-[10px] font-black tracking-[1px] text-[#8B5E34] uppercase">
                                                                    レベル
                                                                </th>
                                                                <th className="pb-3 text-left text-[10px] font-black tracking-[1px] text-[#8B5E34] uppercase">
                                                                    習熟度
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {profile.languages.map((language, index) => (
                                                                <tr
                                                                    key={language.name}
                                                                    className={
                                                                        index > 0
                                                                            ? "border-t border-[#E4D1B2]/70"
                                                                            : ""
                                                                    }
                                                                >
                                                                    <td className="py-3.5 text-[14px] font-bold text-[#181D1B]">
                                                                        {language.name}
                                                                    </td>
                                                                    <td className="py-3.5 text-[14px] font-medium text-[#3E4948]">
                                                                        {language.jlptLevel ||
                                                                            (language.levelType === "native"
                                                                                ? "ネイティブ"
                                                                                : "—")}
                                                                    </td>
                                                                    <td className="py-3.5">
                                                                        <ProgressBar
                                                                            percent={language.proficiency}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                )}

                                {profile.interests.length > 0 && (
                                    <section className="flex flex-col gap-4">
                                        <SectionTitle>{isOwn ? "興味・関心" : "興味・趣味"}</SectionTitle>

                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                            {profile.interests.map((interest, index) => (
                                                <div
                                                    key={interest.name}
                                                    className={`group flex min-h-[84px] cursor-default flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${index % 2 === 0
                                                            ? "border-[#005B5B]/20 bg-[#DDEDEA] text-[#005B5B]"
                                                            : "border-[#B86B4B]/25 bg-[#F8E0D5] text-[#923118]"
                                                        }`}
                                                >
                                                    <span className="text-[22px] transition-transform duration-300 group-hover:scale-110">
                                                        {interest.icon}
                                                    </span>
                                                    <span className="text-center text-[12px] font-bold">
                                                        {interest.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {!isOwn && profile.upcomingEvent && (
                                    <section className="flex flex-col gap-4">
                                        <SectionTitle>イベント・活動</SectionTitle>

                                        <Link href="/events" className="block w-full transition-transform hover:scale-[1.01]">
                                            <div className="flex w-full items-center justify-between rounded-[28px] border border-[#D9C7A5]/75 bg-[#FFFDF7] p-5 shadow-[0_16px_36px_rgba(79,55,30,0.10)] ring-1 ring-white/70 transition-all hover:border-[#005B5B]/35">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-r from-[#004F4F] via-[#006A6A] to-[#8B5E34] text-white">
                                                        <span className="text-[18px] leading-tight font-bold">
                                                            {profile.upcomingEvent.dateLabel}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <p className="text-[14px] font-bold text-[#181D1B]">
                                                            {profile.upcomingEvent.title}
                                                        </p>
                                                        <p className="text-[12px] text-[#6E7979]">
                                                            {profile.upcomingEvent.timeLabel}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span className="rounded-full border border-[#005B5B]/20 bg-[#DDEDEA] px-3 py-1 text-[10px] font-bold text-[#005B5B]">
                                                    {profile.upcomingEvent.statusLabel}
                                                </span>
                                            </div>
                                        </Link>
                                    </section>
                                )}

                                {isOwn ? (
                                    <ProfileActions isOwn onEdit={() => setEditOpen(true)} />
                                ) : (
                                    <OtherProfileActions
                                        isLiked={isLiked}
                                        hasPassed={hasPassed}
                                        isMutualMatch={isMutualMatch}
                                        chatSessionId={chatSessionId}
                                        isBusy={actionBusy}
                                        isAnimating={swipeExit !== null}
                                        pendingAction={pendingAction}
                                        onStartChat={handleStartChat}
                                        onPass={handlePassRequest}
                                        onLike={handleLike}
                                        onOpenReport={() => {
                                            setReportError(null);
                                            setReportReason("");
                                            setReportEvidence(null);
                                            setReportSuccess(false);
                                            setReportOpen(true);
                                        }}
                                        onOpenBlock={() => setBlockOpen(true)}
                                    />
                                )}

                                {actionError && (
                                    <p className="rounded-2xl border border-[#B86B4B]/25 bg-[#F8E0D5] px-4 py-3 text-[14px] font-medium text-[#923118]">
                                        {actionError}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <ReportDialog
                open={reportOpen}
                reason={reportReason}
                evidence={reportEvidence}
                isBusy={actionBusy}
                error={reportError}
                success={reportSuccess}
                onReasonChange={setReportReason}
                onEvidenceChange={setReportEvidence}
                onSubmit={handleReport}
                onCancel={closeReportDialog}
            />

            <ConfirmDialog
                open={blockOpen}
                description="本当にこのユーザーをブロックしますか？"
                isBusy={actionBusy}
                onConfirm={handleBlock}
                onCancel={() => setBlockOpen(false)}
            />

            <PassConfirmDialog
                open={passOpen}
                profileName={profile.name}
                isBusy={actionBusy}
                onConfirm={executePass}
                onCancel={() => setPassOpen(false)}
            />

            <ActionResultToast toast={actionToast} />

            {isOwn && (
                <ProfileEditModal
                    profile={profile}
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    onSaved={(updated) => {
                        setProfile(updated);
                        setEditOpen(false);
                    }}
                />
            )}
        </div>
    );
}