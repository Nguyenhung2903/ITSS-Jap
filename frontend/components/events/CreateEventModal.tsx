"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createEventAction, type CreateEventPayload } from "@/app/actions/event";

type EventCategory = "culture" | "language" | "social" | "workshop";
type EventFormat = "offline" | "online";

const CATEGORIES: { id: EventCategory; label: string; icon: ReactNode }[] = [
    {
        id: "culture",
        label: "文化",
        icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
        ),
    },
    {
        id: "language",
        label: "言語",
        icon: (
            <svg width="13" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.18 8.18 9.82 10.07 8.06 11.64 6.65 10.36 5.4 8.79 4.3 7h-2c1.35 2.59 3.17 4.84 5.36 6.56L2.5 18.5 4 20l3.5-3.5 3.11 3.11c.56.56 1.47.56 2.03 0l6.26-6.26-1.42-1.42-6.61 6.64zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
            </svg>
        ),
    },
    {
        id: "social",
        label: "交流",
        icon: (
            <svg width="14" height="8" viewBox="0 0 24 12" fill="currentColor" aria-hidden>
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm-4 0c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4zM4 8c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm12 4c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4zM0 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z" />
            </svg>
        ),
    },
    {
        id: "workshop",
        label: "ワークショップ",
        icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
            </svg>
        ),
    },
];

const CATEGORY_LABELS: Record<EventCategory, string> = {
    culture: "文化",
    language: "言語",
    social: "交流",
    workshop: "ワークショップ",
};

type CreateEventModalProps = {
    open: boolean;
    onClose: () => void;
    onCreated?: () => void;
};

function buildDescription(category: EventCategory, title: string, location: string) {
    const prefix = `【${CATEGORY_LABELS[category]}】`;
    const body = location.trim() || title.trim();
    return `${prefix} ${body}`.trim();
}

export default function CreateEventModal({ open, onClose, onCreated }: CreateEventModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<EventCategory>("language");
    const [format, setFormat] = useState<EventFormat>("offline");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [location, setLocation] = useState("");
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setTitle("");
        setCategory("language");
        setFormat("offline");
        setDate("");
        setTime("");
        setLocation("");
        setCoverPreview(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    useEffect(() => {
        if (!open) return;
        resetForm();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !saving) onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, saving, onClose]);

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (coverPreview) URL.revokeObjectURL(coverPreview);
        setCoverPreview(URL.createObjectURL(file));
    };

    const handlePublish = async () => {
        setError(null);
        const trimmedTitle = title.trim();
        const trimmedLocation = location.trim();

        if (trimmedTitle.length < 5 || trimmedTitle.length > 50) {
            setError("イベント名は5〜50文字で入力してください。");
            return;
        }
        if (!date || !time) {
            setError("日付と開始時間を入力してください。");
            return;
        }
        if (!trimmedLocation) {
            setError(format === "online" ? "オンライン会議のURLを入力してください。" : "開催場所を入力してください。");
            return;
        }

        const eventTime = new Date(`${date}T${time}`);
        if (Number.isNaN(eventTime.getTime())) {
            setError("日付または時間が正しくありません。");
            return;
        }
        if (eventTime <= new Date()) {
            setError("過去の日時は指定できません。");
            return;
        }

        const description = buildDescription(category, trimmedTitle, trimmedLocation);
        if (description.length < 10) {
            setError("場所・URLの内容をもう少し詳しく入力してください。");
            return;
        }

        if (format === "online") {
            try {
                new URL(trimmedLocation);
            } catch {
                setError("有効なURLを入力してください。");
                return;
            }
        }

        const payload: CreateEventPayload = {
            title: trimmedTitle,
            description,
            eventTime: eventTime.toISOString(),
            format,
            ...(format === "offline" ? { address: trimmedLocation } : { urlLink: trimmedLocation }),
        };

        setSaving(true);
        const result = await createEventAction(payload);
        setSaving(false);

        if (!result.success) {
            setError(result.message ?? "イベントの作成に失敗しました。");
            return;
        }

        onCreated?.();
        onClose();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-event-title"
        >
            <button
                type="button"
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                onClick={saving ? undefined : onClose}
                aria-label="閉じる"
            />
            <div
                className="relative flex max-h-[min(90vh,973px)] w-full max-w-[896px] flex-col overflow-hidden rounded-[32px] bg-[#F6FAF8] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
                style={{ fontFamily: "'Manrope', 'Noto Sans JP', sans-serif" }}
            >
                <div className="flex shrink-0 items-center justify-between px-8 py-6">
                    <h2
                        id="create-event-title"
                        className="text-[24px] font-extrabold leading-8 tracking-[-0.6px] text-[#036A6A]"
                    >
                        新しいイベントを作成
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-[30px] w-[30px] items-center justify-center rounded-full p-2 text-[#727D7A] transition-colors hover:bg-[#E1EAE7]/60 disabled:opacity-50"
                        aria-label="閉じる"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-8">
                    {error && (
                        <div className="mb-6 rounded-lg border border-[#E8B4B0] bg-[#FFF7F6] px-4 py-3 text-[14px] text-[#A43E24]">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-10 md:grid-cols-2">
                        <section className="flex flex-col gap-6">
                            <h3 className="text-[18px] font-bold leading-7 text-[#2A3432]">1. ビジュアルとタイトル</h3>
                            <div className="flex flex-col gap-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={handleCoverChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative flex min-h-[187px] w-full flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed border-[rgba(169,180,177,0.4)] bg-[#EEF5F2] px-4 py-9 transition-colors hover:border-[#036A6A]/40"
                                >
                                    {coverPreview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={coverPreview}
                                            alt="カバー画像プレビュー"
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />
                                    ) : (
                                        <>
                                            <span className="mb-3 flex h-[57px] w-[59.5px] items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                                <svg width="28" height="25" viewBox="0 0 28 25" fill="none" aria-hidden>
                                                    <path
                                                        d="M14 2V14M8 8H20M6 20H22C23.1 20 24 19.1 24 18V7C24 5.9 23.1 5 22 5H6C4.9 5 4 5.9 4 7V18C4 19.1 4.9 20 6 20Z"
                                                        stroke="#036A6A"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                    />
                                                    <circle cx="20" cy="9" r="2" fill="#036A6A" />
                                                </svg>
                                            </span>
                                            <span className="text-[14px] font-bold text-[#2A3432]">
                                                カバー画像をアップロード
                                            </span>
                                            <span className="mt-1 text-[12px] text-[#727D7A]">(1200 x 600px 推奨)</span>
                                        </>
                                    )}
                                </button>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="event-title" className="text-[14px] font-bold text-[#2A3432]">
                                        イベント名
                                    </label>
                                    <input
                                        id="event-title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="例：東京・代々木公園でのピクニック言語交換会"
                                        className="w-full rounded-2xl border border-[rgba(169,180,177,0.3)] bg-[#EEF5F2] px-5 py-4 text-[14px] font-medium text-[#2A3432] placeholder:text-[rgba(114,125,122,0.5)] outline-none focus:border-[#036A6A]/50"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="flex flex-col gap-6">
                            <h3 className="text-[18px] font-bold leading-7 text-[#2A3432]">2. 開催詳細</h3>
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-3">
                                    <span className="text-[14px] font-bold text-[#2A3432]">カテゴリー</span>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.map((cat) => {
                                            const selected = category === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setCategory(cat.id)}
                                                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] transition-colors ${
                                                        selected
                                                            ? "border-[#036A6A] bg-[rgba(3,106,106,0.1)] font-extrabold text-[#036A6A]"
                                                            : "border-[#A9B4B1] font-bold text-[#2A3432] hover:border-[#036A6A]/40"
                                                    }`}
                                                >
                                                    <span className={selected ? "text-[#036A6A]" : "text-[#2A3432]"}>
                                                        {cat.icon}
                                                    </span>
                                                    {cat.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <span className="text-[14px] font-bold text-[#2A3432]">開催形式</span>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormat("offline")}
                                            className={`flex items-center justify-center gap-3 rounded-2xl border-2 px-4 py-4 transition-colors ${
                                                format === "offline"
                                                    ? "border-[#036A6A] bg-[rgba(3,106,106,0.05)] text-[#036A6A]"
                                                    : "border-[rgba(169,180,177,0.3)] text-[#536261]"
                                            }`}
                                        >
                                            <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor" aria-hidden>
                                                <path d="M8 0C4.13 0 1 3.13 1 7c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S6.62 4.5 8 4.5s2.5 1.12 2.5 2.5S9.38 9.5 8 9.5z" />
                                            </svg>
                                            <span className="text-[16px] font-bold">対面</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormat("online")}
                                            className={`flex items-center justify-center gap-3 rounded-2xl border-2 px-4 py-4 transition-colors ${
                                                format === "online"
                                                    ? "border-[#036A6A] bg-[rgba(3,106,106,0.05)] text-[#036A6A]"
                                                    : "border-[rgba(169,180,177,0.3)] text-[#536261]"
                                            }`}
                                        >
                                            <svg width="20" height="16" viewBox="0 0 20 16" fill="currentColor" aria-hidden>
                                                <path d="M18 0H2C.9 0 0 .9 0 2v8c0 1.1.9 2 2 2h4l-2 4 1.5-1.5L10 12h8c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zm0 10H2V2h16v8z" />
                                            </svg>
                                            <span className="text-[16px] font-bold">オンライン</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="event-date" className="text-[14px] font-bold text-[#2A3432]">
                                            日付
                                        </label>
                                        <div className="relative">
                                            <svg
                                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#727D7A]"
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                aria-hidden
                                            >
                                                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
                                            </svg>
                                            <input
                                                id="event-date"
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full rounded-2xl border border-[rgba(169,180,177,0.3)] bg-[#EEF5F2] py-3.5 pl-12 pr-4 text-[14px] font-medium text-[#2A3432] outline-none focus:border-[#036A6A]/50"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="event-time" className="text-[14px] font-bold text-[#2A3432]">
                                            開始時間
                                        </label>
                                        <div className="relative">
                                            <svg
                                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#727D7A]"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                aria-hidden
                                            >
                                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                                            </svg>
                                            <input
                                                id="event-time"
                                                type="time"
                                                value={time}
                                                onChange={(e) => setTime(e.target.value)}
                                                className="w-full rounded-2xl border border-[rgba(169,180,177,0.3)] bg-[#EEF5F2] py-3.5 pl-12 pr-4 text-[14px] font-medium text-[#2A3432] outline-none focus:border-[#036A6A]/50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="event-location" className="text-[14px] font-bold text-[#2A3432]">
                                        場所・URL
                                    </label>
                                    <div className="relative">
                                        <svg
                                            className="pointer-events-none absolute left-5 top-5 text-[#727D7A]"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            aria-hidden
                                        >
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                                        </svg>
                                        <textarea
                                            id="event-location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            rows={3}
                                            placeholder="詳細な住所や、オンラインイベントの場合はZoom リンクを入力"
                                            className="w-full resize-none rounded-2xl border border-[rgba(169,180,177,0.3)] bg-[#EEF5F2] py-4 pl-12 pr-4 text-[14px] font-medium leading-5 text-[#2A3432] placeholder:text-[rgba(114,125,122,0.5)] outline-none focus:border-[#036A6A]/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="flex shrink-0 items-center border-t border-[rgba(169,180,177,0.1)] bg-white px-8 py-6">
                    <button
                        type="button"
                        onClick={handlePublish}
                        disabled={saving}
                        className="relative flex items-center gap-2 rounded-full bg-[#036A6A] px-10 py-3 text-[16px] font-bold text-[#E0FFFE] shadow-[0px_10px_15px_-3px_rgba(3,106,106,0.2),0px_4px_6px_-4px_rgba(3,106,106,0.2)] transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden>
                            <path d="M2 1L14 7L2 13V1Z" fill="#E0FFFE" />
                        </svg>
                        {saving ? "公開中…" : "イベントを公開する"}
                    </button>
                </div>
            </div>
        </div>
    );
}
