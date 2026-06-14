"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopNav from "@/components/layouts/TopNav";
import ProfileEditModal from "@/components/profile/ProfileEditModal";
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
        <div className="relative w-32 h-1.5 bg-[#DFE3E1] rounded-full overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-[#005B5B] rounded-full" style={{ width: `${percent}%` }} />
        </div>
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

function ActionButtonSpinner() {
    return <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />;
}

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
        <div className="w-full pt-6 flex flex-col gap-4">
            <div className="rounded-2xl border border-[#BEC9C8]/30 bg-[#F6FAF8] px-4 py-3 flex flex-col gap-2">
                <p className="text-[12px] font-bold text-[#3E4948]">ボタンの違い</p>
                <div className="flex flex-col gap-1.5 text-[13px] text-[#6E7979] leading-relaxed">
                    <p>
                        <span className="font-bold text-[#005B5B]">いいね</span>
                        {" — 相手に通知されます。お互いにいいねするとマッチング成立です。"}
                    </p>
                    <p>
                        <span className="font-bold text-[#6E7979]">見送る</span>
                        {" — 候補リストから非表示になります。相手には通知されず、後から取り消せません。"}
                    </p>
                    <p>
                        <span className="font-bold text-[#005B5B]">チャット</span>
                        {" — マッチング成立後（お互いにいいね）のみ利用できます。"}
                    </p>
                </div>
            </div>
            <div className="w-full flex flex-col gap-2">
                <div className="w-full flex flex-wrap items-center gap-4">
                <button
                    type="button"
                    onClick={onStartChat}
                    disabled={isBusy || isAnimating || !canChat}
                    title={canChat ? chatLabel : chatHint ?? undefined}
                    className={`h-14 px-6 text-[16px] font-bold rounded-2xl flex items-center justify-center gap-2 shrink-0 transition-all ${
                        canChat
                            ? "bg-gradient-to-r from-[#005B5B] to-[#1B7575] text-white shadow-[0_20px_25px_-5px_rgba(0,91,91,0.2)] hover:opacity-90 disabled:opacity-60 disabled:cursor-wait"
                            : "bg-[#EAEFEC] text-[#BEC9C8] cursor-not-allowed opacity-80"
                    }`}
                >
                    <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden>
                        <path d="M0 14L14 7L0 0V5.25L8.75 7L0 8.75V14Z" fill="currentColor" />
                    </svg>
                    {chatLabel}
                </button>
                <button
                    type="button"
                    onClick={onPass}
                    disabled={isBusy || hasPassed || isAnimating}
                    title="この相手を候補リストから非表示にします（相手には通知されません）"
                    aria-label={hasPassed ? "見送り済み" : "見送る — 候補リストから非表示"}
                    className={`h-[60px] px-6 text-[16px] font-bold rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 disabled:cursor-not-allowed ${
                        hasPassed
                            ? "bg-[#6E7979]/10 border-2 border-[#6E7979]/30 text-[#6E7979] opacity-70"
                            : passActive
                              ? "bg-[#6E7979] text-white scale-95 shadow-lg"
                              : "bg-white border-2 border-[#BEC9C8] text-[#6E7979] hover:border-[#6E7979] hover:bg-[#F0F5F2] disabled:opacity-60"
                    }`}
                >
                    {passActive ? (
                        <ActionButtonSpinner />
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden>
                            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    )}
                    {hasPassed ? "見送り済み" : passActive ? "見送り中..." : "見送る"}
                </button>
                <button
                    type="button"
                    onClick={onLike}
                    disabled={isBusy || isLiked || isAnimating}
                    title="相手にいいねを送ります。お互いにいいねでマッチング成立"
                    aria-label={isLiked ? "いいね済み" : "いいね — 相手に通知"}
                    className={`h-[60px] px-6 text-[16px] font-bold rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 disabled:cursor-not-allowed ${
                        isLiked
                            ? "bg-[#005B5B]/10 border-2 border-[#005B5B] text-[#005B5B] opacity-70"
                            : likeActive
                              ? "bg-[#005B5B] text-white scale-95 shadow-lg border-2 border-[#005B5B]"
                              : "bg-white border-2 border-[#005B5B]/30 text-[#005B5B] hover:border-[#005B5B] hover:bg-[#F0F5F2] disabled:opacity-60"
                    }`}
                >
                    {likeActive ? (
                        <ActionButtonSpinner />
                    ) : (
                        <svg width="17" height="15" viewBox="0 0 17 15" fill="none" aria-hidden>
                            <path d="M8.5 14.25L7.2875 13.1625C3.65 9.9125 1.5 7.9875 1.5 5.625C1.5 3.7125 3.0125 2.25 5 2.25C6.0875 2.25 7.1375 2.71875 8 3.58125C8.8625 2.71875 9.9125 2.25 11 2.25C12.9875 2.25 14.5 3.7125 14.5 5.625C14.5 7.9875 12.35 9.9125 8.7125 13.1625L8.5 14.25Z" fill="currentColor" />
                        </svg>
                    )}
                    {isLiked ? "いいね済み" : likeActive ? "送信中..." : "いいね"}
                </button>
                <div className="flex gap-2 ml-auto">
                    <button
                        type="button"
                        onClick={onOpenReport}
                        disabled={isBusy || isAnimating}
                        className="w-[46.5px] h-12 border border-[#BEC9C8] rounded-2xl flex items-center justify-center hover:bg-[#F0F5F2] disabled:opacity-60"
                        aria-label="通報"
                    >
                        <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden>
                            <path d="M1 13V1H9L12 4V13H1Z" stroke="#6E7979" strokeWidth="1.5" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={onOpenBlock}
                        disabled={isBusy || isAnimating}
                        className="w-[50.67px] h-[50.67px] border border-[#BEC9C8] rounded-2xl flex items-center justify-center hover:bg-[#F0F5F2] disabled:opacity-60"
                        aria-label="ブロック"
                    >
                        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
                            <circle cx="8.5" cy="8.5" r="7" stroke="#6E7979" strokeWidth="1.5" />
                            <path d="M3 8.5H14" stroke="#6E7979" strokeWidth="1.5" />
                        </svg>
                    </button>
                </div>
                </div>
                {chatHint && (
                    <p className="text-[13px] text-[#6E7979] leading-relaxed pl-1">{chatHint}</p>
                )}
            </div>
        </div>
    );
}

function ActionSwipeOverlay({ direction }: { direction: SwipeDirection }) {
    if (!direction) return null;

    const isLike = direction === "right";

    return (
        <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[32px] backdrop-blur-[2px] transition-opacity duration-300 ${
                isLike ? "bg-[#005B5B]/75" : "bg-[#6E7979]/80"
            }`}
            aria-live="polite"
        >
            <div className="flex flex-col items-center gap-3 animate-profile-action-scale-in text-white">
                {isLike ? (
                    <svg width="64" height="56" viewBox="0 0 17 15" fill="none" aria-hidden>
                        <path d="M8.5 14.25L7.2875 13.1625C3.65 9.9125 1.5 7.9875 1.5 5.625C1.5 3.7125 3.0125 2.25 5 2.25C6.0875 2.25 7.1375 2.71875 8 3.58125C8.8625 2.71875 9.9125 2.25 11 2.25C12.9875 2.25 14.5 3.7125 14.5 5.625C14.5 7.9875 12.35 9.9125 8.7125 13.1625L8.5 14.25Z" fill="white" />
                    </svg>
                ) : (
                    <svg width="56" height="56" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path d="M1 1L11 11M11 1L1 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
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
            ? "bg-[#005B5B] text-white border-[#004a4a]"
            : toast.kind === "like"
              ? "bg-[#E8F4F2] text-[#005B5B] border-[#005B5B]/20"
              : "bg-[#F0F2F1] text-[#3E4948] border-[#BEC9C8]/40";

    return (
        <div
            className={`fixed bottom-8 left-1/2 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-xl animate-profile-action-slide-up ${styles}`}
            role="status"
            aria-live="polite"
        >
            {toast.kind === "match" ? (
                <svg width="20" height="18" viewBox="0 0 17 15" fill="none" aria-hidden>
                    <path d="M8.5 14.25L7.2875 13.1625C3.65 9.9125 1.5 7.9875 1.5 5.625C1.5 3.7125 3.0125 2.25 5 2.25C6.0875 2.25 7.1375 2.71875 8 3.58125C8.8625 2.71875 9.9125 2.25 11 2.25C12.9875 2.25 14.5 3.7125 14.5 5.625C14.5 7.9875 12.35 9.9125 8.7125 13.1625L8.5 14.25Z" fill="currentColor" />
                </svg>
            ) : toast.kind === "like" ? (
                <svg width="20" height="18" viewBox="0 0 17 15" fill="none" aria-hidden>
                    <path d="M8.5 14.25L7.2875 13.1625C3.65 9.9125 1.5 7.9875 1.5 5.625C1.5 3.7125 3.0125 2.25 5 2.25C6.0875 2.25 7.1375 2.71875 8 3.58125C8.8625 2.71875 9.9125 2.25 11 2.25C12.9875 2.25 14.5 3.7125 14.5 5.625C14.5 7.9875 12.35 9.9125 8.7125 13.1625L8.5 14.25Z" fill="currentColor" />
                </svg>
            ) : (
                <svg width="18" height="18" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )}
            <span className="text-[15px] font-bold">{toast.message}</span>
        </div>
    );
}

function ProfileActions({ isOwn, onEdit }: { isOwn: boolean; onEdit: () => void }) {
    if (isOwn) {
        return (
            <div className="w-full pt-6">
                <button
                    type="button"
                    onClick={onEdit}
                    className="w-full h-14 bg-gradient-to-r from-[#005B5B] to-[#1B7575] text-white text-[16px] font-bold rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,91,91,0.2)] hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="white" />
                    </svg>
                    プロフィール編集
                </button>
            </div>
        );
    }

    return null;
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
            ? "bg-[#6E7979] hover:bg-[#5a6362]"
            : "bg-[#923118] hover:bg-[#7a2813]";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                {title && <h3 className="text-[18px] font-bold text-[#181D1B] text-center">{title}</h3>}
                <p className="text-[16px] font-medium text-[#181D1B] leading-relaxed text-center whitespace-pre-line">{description}</p>
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
                        className={`px-8 py-2.5 rounded-xl text-[14px] font-bold text-white disabled:opacity-60 ${confirmClass}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <h3 className="text-[18px] font-bold text-[#181D1B] text-center">本当に見送りますか？</h3>
                <p className="text-[15px] text-[#3E4948] leading-relaxed text-center">
                    {profileName}さんを見送ると、以下のようになります。
                </p>
                <ul className="text-[14px] text-[#6E7979] leading-relaxed flex flex-col gap-2 bg-[#F6FAF8] rounded-xl px-4 py-3 list-disc list-inside">
                    <li>マッチング候補リストに表示されなくなります</li>
                    <li>相手には通知されません</li>
                    <li>この操作は取り消せません</li>
                </ul>
                <div className="flex gap-3 justify-center pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isBusy}
                        className="px-8 py-2.5 rounded-xl text-[14px] font-medium text-[#3E4948] bg-[#EAEFEC] hover:bg-[#DFE3E1] disabled:opacity-60"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isBusy}
                        className="px-8 py-2.5 rounded-xl text-[14px] font-bold text-white bg-[#6E7979] hover:bg-[#5a6362] disabled:opacity-60"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <h3 className="text-[18px] font-bold text-[#181D1B]">このユーザーを通報する</h3>
                {success ? (
                    <p className="text-[14px] text-[#005B5B] font-medium py-4 text-center">
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
                                onChange={(e) => onReasonChange(e.target.value)}
                                rows={4}
                                placeholder="通報理由を入力してください"
                                className="w-full rounded-xl border border-[#BEC9C8] px-4 py-3 text-[14px] text-[#181D1B] outline-none focus:border-[#005B5B] resize-none"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-bold text-[#3E4948]">証拠画像（任意・最大1枚）</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    onEvidenceChange(file);
                                }}
                                className="text-[13px] text-[#3E4948] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#F0F5F2] file:text-[#005B5B] file:font-medium"
                            />
                            {evidence && (
                                <p className="text-[12px] text-[#6E7979]">選択中: {evidence.name}</p>
                            )}
                        </div>
                        {error && <p className="text-[13px] text-[#923118]">{error}</p>}
                    </>
                )}
                <div className="flex gap-3 justify-end pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isBusy}
                        className="px-5 py-2.5 rounded-xl text-[14px] font-medium text-[#3E4948] bg-[#EAEFEC] hover:bg-[#DFE3E1] disabled:opacity-60"
                    >
                        キャンセル
                    </button>
                    {!success && (
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={isBusy}
                            className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-white bg-[#005B5B] hover:bg-[#004a4a] disabled:opacity-60"
                        >
                            {isBusy ? "送信中..." : "送信する"}
                        </button>
                    )}
                </div>
            </div>
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
    const [chatSessionId, setChatSessionId] = useState<number | null>(initialProfile.chatSessionId ?? null);
    const [actionBusy, setActionBusy] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [actionToast, setActionToast] = useState<ActionToast>(null);
    const [reportOpen, setReportOpen] = useState(false);
    const [blockOpen, setBlockOpen] = useState(false);
    const [passOpen, setPassOpen] = useState(false);
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
        const res = await createMatchSessionAction(profile.id);
        setActionBusy(false);
        if (!res.success) {
            setActionError(res.message ?? "チャットの開始に失敗しました。");
            return;
        }
        setChatSessionId(res.data.id);
        router.push(`/chat?session=${res.data.id}`);
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
        const res = await passUserAction(profile.id);
        setActionBusy(false);
        if (!res.success) {
            setSwipeExit(null);
            setPendingAction(null);
            setActionError(res.message ?? "操作に失敗しました。");
            return;
        }
        setHasPassed(true);
        await showSuccessToast({ kind: "pass", message: "見送りました。候補リストに表示されません" });
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
        const res = await likeUserAction(profile.id);
        setActionBusy(false);
        if (!res.success) {
            setSwipeExit(null);
            setPendingAction(null);
            setActionError(res.message ?? "操作に失敗しました。");
            return;
        }
        setIsLiked(true);
        if (res.matched && res.sessionId) {
            setIsMutualMatch(true);
            setChatSessionId(res.sessionId);
            await showSuccessToast({ kind: "match", message: "マッチング成立！チャットへ移動します" });
            router.push(`/chat?session=${res.sessionId}`);
            return;
        }
        await showSuccessToast({ kind: "like", message: "いいねを送りました。相手に通知されました" });
        router.push("/matching");
    }, [profile.id, router, actionBusy, isLiked, waitSwipe, showSuccessToast]);

    const handleBlock = useCallback(async () => {
        const ok = await runAction(async () => {
            const res = await blockUserAction(profile.id);
            if (!res.success) return res;
            setBlockOpen(false);
            router.push("/matching");
            return { success: true };
        });
        if (!ok) return;
    }, [profile.id, router, runAction]);

    const handleReport = useCallback(async () => {
        if (!reportReason.trim()) {
            setReportError("理由を入力してください");
            return;
        }
        setReportError(null);
        setActionBusy(true);
        const res = await reportUserAction(profile.id, reportReason, reportEvidence);
        setActionBusy(false);
        if (!res.success) {
            setReportError(res.message ?? "通報に失敗しました。");
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
        setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
    }, [images.length]);

    const goNext = useCallback(() => {
        setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));
    }, [images.length]);

    return (
        <div className="flex w-full min-h-screen bg-[#F6FAF8]" style={{ fontFamily: "'Manrope', 'Noto Sans JP', sans-serif" }}>
            <Sidebar />
            <div className="flex flex-col flex-1 relative overflow-y-auto">
                <TopNav backLink={isOwn ? undefined : "/matching"} />
                <main className="flex justify-center w-full pt-10 pb-16 px-6 overflow-hidden">
                    <div
                        className={`w-full max-w-[944px] flex flex-col lg:flex-row gap-10 items-start transition-all duration-[400ms] ease-in-out will-change-transform ${!isOwn ? cardSwipeClass : ""}`}
                    >
                        <div className="w-full lg:w-[370px] flex flex-col gap-6 shrink-0 lg:sticky lg:top-[120px]">
                            <div className="flex flex-col gap-4 w-full">
                                <div className="w-full h-[462.5px] rounded-[32px] bg-[#E5E9E6] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] relative overflow-hidden group">
                                    <Image src={images[activeIndex]} alt={profile.name} fill className="object-cover" priority />
                                    {!isOwn && swipeExit && <ActionSwipeOverlay direction={swipeExit} />}
                                    {!isOwn && profile.isOnline && (
                                        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-white/20 shadow-sm backdrop-blur-md z-10">
                                            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                                            <span className="text-[10px] font-bold text-[#181D1B] uppercase tracking-[0.5px]">オンライン</span>
                                        </div>
                                    )}
                                    {images.length > 1 && (
                                        <>
                                            <button type="button" onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity z-10" aria-label="Previous photo">
                                                <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M6.5 1L1.5 6L6.5 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </button>
                                            <button type="button" onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity z-10" aria-label="Next photo">
                                                <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M1.5 1L6.5 6L1.5 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </button>
                                            <div className="absolute bottom-6 w-full flex justify-center gap-1.5 z-10">
                                                {images.map((_, idx) => (
                                                    <button key={idx} type="button" onClick={() => setActiveIndex(idx)} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === activeIndex ? "bg-white" : "bg-white/50"}`} aria-label={`Photo ${idx + 1}`} />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {images.length > 1 && (
                                    <div className="flex w-full gap-3 h-[83.5px]">
                                        {images.slice(0, 4).map((img, idx) => (
                                            <button
                                                key={`${img}-${idx}`}
                                                type="button"
                                                onClick={() => setActiveIndex(idx)}
                                                className={`relative w-[calc(25%-9px)] h-full rounded-xl overflow-hidden shrink-0 ${idx === activeIndex ? "ring-2 ring-[#005B5B] ring-offset-2" : "opacity-70 hover:opacity-100"} transition-opacity`}
                                            >
                                                <Image src={img} alt={`Gallery ${idx + 1}`} fill className="object-cover" sizes="80px" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="w-full bg-white border border-[#BEC9C8]/10 shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-[32px] p-8 flex flex-col gap-5">
                                <div className="flex items-end gap-3">
                                    <h1 className="text-[36px] font-extrabold text-[#181D1B] tracking-[-0.9px] leading-[40px]">{profile.name}</h1>
                                    {profile.age != null && <span className="text-[24px] font-light text-[#6E7979] leading-[32px] pb-1">{profile.age}</span>}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden><path d="M5 0C2.23858 0 0 2.23858 0 5C0 8.75 5 12 5 12C5 12 10 8.75 10 5C10 2.23858 7.76142 0 5 0ZM5 7C3.89543 7 3 6.10457 3 5C3 3.89543 3.89543 3 5 3C6.10457 3 7 3.89543 7 5C7 6.10457 6.10457 7 5 7Z" fill="#1B7575" /></svg>
                                    <span className="text-[16px] font-medium text-[#1B7575]">{profile.location}</span>
                                    {!isOwn && profile.mutualFriendsCount > 0 && (
                                        <>
                                            <span className="text-[16px] text-[#BEC9C8] px-1">·</span>
                                            <span className="text-[14px] font-medium text-[#6E7979]">共通の友人が{profile.mutualFriendsCount}人います</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex flex-col gap-3 pt-1">
                                    {profile.isVerified && (
                                        <div className="w-full bg-[#EFF6FF] rounded-xl py-2 px-4 flex items-center gap-3">
                                            <svg width="17" height="16" viewBox="0 0 17 16" fill="none" aria-hidden><path d="M15.5 7.625L14.075 5.9625L14.3 3.75L12.125 3.2625L11 1.35L9 2.2125L7 1.35L5.875 3.25L3.7 3.7375L3.925 5.95L2.5 7.625L3.925 9.3L3.7 11.5125L5.875 12L7 13.9125L9 13.05L11 13.9125L12.125 12L14.3 11.5125L14.075 9.3L15.5 7.625ZM7.6875 10.9375L4.875 8.125L5.93125 7.06875L7.6875 8.81875L11.5687 4.9375L12.625 6L7.6875 10.9375Z" fill="#1D4ED8" /></svg>
                                            <span className="text-[12px] font-bold text-[#1D4ED8]">身分証確認済み</span>
                                        </div>
                                    )}
                                    {!isOwn && profile.isStoryteller && (
                                        <div className="w-full bg-[#F0FDFA] rounded-xl py-2 px-4 flex items-center gap-3">
                                            <svg width="17" height="15" viewBox="0 0 17 15" fill="none" aria-hidden><path d="M2 0H15C15.55 0 16 0.45 16 1V11C16 11.55 15.55 12 15 12H4L0 15V1C0 0.45 0.45 0 1 0H2Z" fill="#0F766E" /></svg>
                                            <span className="text-[12px] font-bold text-[#0F766E]">ストーリーテラー</span>
                                        </div>
                                    )}
                                </div>
                                {profile.purposes.length > 0 && (
                                    <div className="w-full border-t border-[#BEC9C8]/10 pt-4 flex flex-col gap-3">
                                        <h4 className="text-[10px] font-black text-[#005B5B] uppercase tracking-[1.5px]">交流の目的</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.purposes.map((purpose) => (
                                                <span key={purpose.label} className="bg-[#F0F5F2] rounded-lg px-3 py-2 text-[12px] font-bold text-[#3E4948] flex items-center gap-1.5">
                                                    <span className="text-[14px]">{purpose.emoji}</span>
                                                    {purpose.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-10 min-w-0">
                            {profile.bio && (
                                <section className="flex flex-col gap-4">
                                    <h3 className="text-[12px] font-black text-[#005B5B] uppercase tracking-[2.4px]">自己紹介</h3>
                                    <p className="text-[24px] font-medium text-[#3E4948] leading-[39px] whitespace-pre-wrap">{profile.bio}</p>
                                </section>
                            )}
                            {profile.languages.length > 0 && (
                                <section className="flex flex-col gap-4">
                                    <h3 className="text-[12px] font-black text-[#005B5B] uppercase tracking-[2.4px]">語学レベル</h3>
                                    {isOwn ? (
                                        <div className="w-full bg-[#F0F5F2]/50 border border-[#BEC9C8]/10 rounded-[24px] p-6">
                                            <div className="w-full bg-[#F0F5F2] rounded-[24px] p-8 flex flex-col gap-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                                {profile.languages.map((lang) => (
                                                    <div key={lang.name} className="w-full bg-white border border-[#BEC9C8]/10 rounded-xl px-6 py-4 flex justify-between items-center">
                                                        <span className="text-[16px] font-medium text-[#181D1B]">{lang.name}</span>
                                                        <div className={`px-4 py-1.5 rounded-full ${lang.levelType === "learning" ? "bg-[#923118]/10" : "bg-[#005B5B]/10"}`}>
                                                            <span className={`text-[10px] font-black ${lang.levelType === "learning" ? "text-[#923118]" : "text-[#005B5B]"}`}>{lang.levelText}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full bg-[#F0F5F2]/50 border border-[#BEC9C8]/10 rounded-[24px] p-6">
                                            <div className="w-full overflow-x-auto">
                                                <table className="w-full min-w-[400px]">
                                                    <thead>
                                                        <tr className="border-b border-[#BEC9C8]/20">
                                                            <th className="text-left pb-4 text-[10px] font-bold text-[#6E7979] uppercase tracking-[1px]">言語</th>
                                                            <th className="text-left pb-4 text-[10px] font-bold text-[#6E7979] uppercase tracking-[1px]">レベル</th>
                                                            <th className="text-left pb-4 text-[10px] font-bold text-[#6E7979] uppercase tracking-[1px]">習熟度</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {profile.languages.map((lang, idx) => (
                                                            <tr key={lang.name} className={idx > 0 ? "border-t border-[#BEC9C8]/10" : ""}>
                                                                <td className="py-4 text-[14px] font-bold text-[#181D1B]">{lang.name}</td>
                                                                <td className="py-4 text-[14px] text-[#3E4948]">{lang.jlptLevel || (lang.levelType === "native" ? "ネイティブ" : "—")}</td>
                                                                <td className="py-4"><ProgressBar percent={lang.proficiency} /></td>
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
                                    <h3 className="text-[12px] font-black text-[#005B5B] uppercase tracking-[2.4px]">{isOwn ? "興味・関心" : "興味・趣味"}</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {profile.interests.map((interest) => (
                                            <div key={interest.name} className="bg-white border border-[#BEC9C8]/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-h-[77px]">
                                                <span className="text-[20px]">{interest.icon}</span>
                                                <span className="text-[12px] font-bold text-[#181D1B] text-center">{interest.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                            {!isOwn && profile.upcomingEvent && (
                                <section className="flex flex-col gap-4">
                                    <h3 className="text-[12px] font-black text-[#005B5B] uppercase tracking-[2.4px]">イベント・活動</h3>
                                    <div className="w-full flex justify-between items-center p-5 rounded-2xl bg-gradient-to-br from-[#005B5B]/5 to-[#1B7575]/5 border border-[#005B5B]/10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#005B5B] flex flex-col items-center justify-center text-white shrink-0">
                                                <span className="text-[18px] font-bold leading-tight">{profile.upcomingEvent.dateLabel}</span>
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-[#181D1B]">{profile.upcomingEvent.title}</p>
                                                <p className="text-[12px] text-[#6E7979]">{profile.upcomingEvent.timeLabel}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-[#005B5B]/5 text-[10px] font-bold text-[#005B5B]">{profile.upcomingEvent.statusLabel}</span>
                                    </div>
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
                                <p className="text-[14px] font-medium text-[#923118]">{actionError}</p>
                            )}
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


