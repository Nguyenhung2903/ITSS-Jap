"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
    getUserProfileAction,
    saveProfileAction,
    type UserProfile,
} from "@/app/actions/profile";
import {
    COMMON_HOBBY_OPTIONS,
    COMMON_PURPOSE_OPTIONS,
    JLPT_LEVEL_OPTIONS,
    NATIONALITY_OPTIONS,
} from "@/lib/profile-options";
import {
    languagesFromProfile,
    profileLanguagesToPayload,
    type Nationality,
    type ProfileLanguageEdit,
} from "@/lib/profile-languages";

type ProfileEditModalProps = {
    profile: UserProfile;
    open: boolean;
    onClose: () => void;
    onSaved: (profile: UserProfile) => void;
};

function SectionHeader({
    title,
    icon,
}: {
    title: string;
    icon: ReactNode;
}) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-[18px] font-medium text-[#005B5B] leading-7">{title}</h2>
        </div>
    );
}

function FieldLabel({ children }: { children: ReactNode }) {
    return (
        <span className="text-[12px] font-medium text-[#3E4948] uppercase tracking-[1.2px] leading-4">
            {children}
        </span>
    );
}

function TagEditor({
    tags,
    onChange,
    placeholder,
    suggestions = [],
}: {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder: string;
    suggestions?: readonly string[];
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [draft, setDraft] = useState("");

    const addTag = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed || tags.includes(trimmed)) return;
        onChange([...tags, trimmed]);
    };

    const commitAdd = () => {
        const value = draft.trim();
        if (!value) return;
        addTag(value);
        setDraft("");
        setIsAdding(false);
    };

    const availableSuggestions = suggestions.filter((option) => !tags.includes(option));

    return (
        <div className="flex flex-col gap-4">
            {availableSuggestions.length > 0 && (
                <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-medium text-[#727D7A] uppercase tracking-[1.1px]">
                        よく選ばれている
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {availableSuggestions.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => addTag(option)}
                                className="px-4 py-2 rounded-full border border-[#BEC9C8] bg-white text-[14px] font-medium text-[#3E4948] hover:bg-[#F0F5F2] hover:border-[#005B5B]/30 transition-colors"
                            >
                                + {option}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-3 items-center">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#D3E3E1] rounded-full text-[14px] font-medium text-[#566664]"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => onChange(tags.filter((t) => t !== tag))}
                            className="text-[#566664] hover:text-[#181D1B] leading-none w-4 h-4 flex items-center justify-center"
                            aria-label={`${tag}を削除`}
                        >
                            ×
                        </button>
                    </span>
                ))}
                {isAdding ? (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <input
                            type="text"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    commitAdd();
                                }
                                if (e.key === "Escape") {
                                    setDraft("");
                                    setIsAdding(false);
                                }
                            }}
                            placeholder={placeholder}
                            autoFocus
                            className="h-10 min-w-[140px] flex-1 px-3 bg-[#DFE3E1] rounded-lg text-[14px] text-[#181D1B] outline-none focus:ring-2 focus:ring-[#005B5B]/30"
                        />
                        <button
                            type="button"
                            onClick={commitAdd}
                            disabled={!draft.trim()}
                            className="h-10 px-4 rounded-lg bg-[#005B5B] text-white text-[14px] font-medium disabled:opacity-50"
                        >
                            追加
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDraft("");
                                setIsAdding(false);
                            }}
                            className="h-10 px-3 text-[14px] font-medium text-[#566664]"
                        >
                            キャンセル
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center gap-1 text-[14px] font-medium text-[#005B5B] hover:opacity-80"
                    >
                        <span>+</span> 自由入力
                    </button>
                )}
            </div>
        </div>
    );
}

export default function ProfileEditModal({
    profile,
    open,
    onClose,
    onSaved,
}: ProfileEditModalProps) {
    const [displayName, setDisplayName] = useState(profile.name);
    const [location, setLocation] = useState(
        profile.location === "—" ? "" : profile.location
    );
    const [bio, setBio] = useState(profile.bio);
    const [languageEdit, setLanguageEdit] = useState<ProfileLanguageEdit>(() =>
        languagesFromProfile(profile.languages)
    );
    const [hobbies, setHobbies] = useState(profile.interests.map((i) => i.name));
    const [purposes, setPurposes] = useState(profile.purposes.map((p) => p.label));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setDisplayName(profile.name);
        setLocation(profile.location === "—" ? "" : profile.location);
        setBio(profile.bio);
        setLanguageEdit(languagesFromProfile(profile.languages));
        setHobbies(profile.interests.map((i) => i.name));
        setPurposes(profile.purposes.map((p) => p.label));
        setError(null);
    }, [open, profile]);

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

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        const result = await saveProfileAction(profile.id, {
            displayName,
            location,
            bio,
            languages: profileLanguagesToPayload(languageEdit),
            hobbies,
            purposes,
        });

        setSaving(false);

        if (!result.success) {
            setError(result.message ?? "保存に失敗しました。");
            return;
        }

        if (result.data) {
            onSaved(result.data);
            return;
        }

        const refreshed = await getUserProfileAction(String(profile.id));
        if (refreshed.success && refreshed.data) {
            onSaved(refreshed.data);
        } else {
            onClose();
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-edit-title"
        >
            <button
                type="button"
                className="absolute inset-0 bg-[#181D1B]/40 backdrop-blur-[2px]"
                onClick={saving ? undefined : onClose}
                aria-label="閉じる"
            />
            <div
                className="relative w-full max-w-[608px] max-h-[min(90vh,1137px)] flex flex-col bg-[#F6FAF8] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden"
                style={{ fontFamily: "'Manrope', 'Noto Sans JP', sans-serif" }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#BEC9C8]/20 bg-white shrink-0">
                    <h2 id="profile-edit-title" className="text-[18px] font-bold text-[#181D1B]">
                        プロフィール編集
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[#566664] hover:bg-[#F0F5F2] disabled:opacity-50"
                        aria-label="閉じる"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
                    <section className="bg-white rounded-xl p-6 sm:p-8 flex flex-col gap-6">
                        <SectionHeader
                            title="基本情報"
                            icon={
                                <svg width="18" height="16" viewBox="0 0 24 24" fill="#005B5B" aria-hidden>
                                    <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" />
                                </svg>
                            }
                        />
                        <div className="flex flex-col gap-6">
                            <label className="flex flex-col gap-2">
                                <FieldLabel>ユーザー名</FieldLabel>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full h-12 px-4 bg-[#DFE3E1] rounded-lg text-[16px] text-[#181D1B] outline-none focus:ring-2 focus:ring-[#005B5B]/30"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                <FieldLabel>場所</FieldLabel>
                                <div className="relative">
                                    <svg
                                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                        width="16"
                                        height="20"
                                        viewBox="0 0 10 12"
                                        fill="#3E4948"
                                        aria-hidden
                                    >
                                        <path d="M5 0C2.24 0 0 2.24 0 5C0 8.75 5 12 5 12C5 12 10 8.75 10 5C10 2.24 7.76 0 5 0ZM5 7C3.9 7 3 6.1 3 5C3 3.9 3.9 3 5 3C6.1 3 7 3.9 7 5C7 6.1 6.1 7 5 7Z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="東京, 日本"
                                        className="w-full h-12 pl-10 pr-4 bg-[#DFE3E1] rounded-lg text-[16px] text-[#181D1B] outline-none focus:ring-2 focus:ring-[#005B5B]/30"
                                    />
                                </div>
                            </label>
                            <label className="flex flex-col gap-2">
                                <FieldLabel>自己紹介</FieldLabel>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={5}
                                    className="w-full px-4 py-3 bg-[#DFE3E1] rounded-lg text-[16px] text-[#181D1B] leading-6 resize-none outline-none focus:ring-2 focus:ring-[#005B5B]/30"
                                />
                            </label>
                        </div>
                    </section>

                    <section className="bg-white rounded-xl p-6 sm:p-8 flex flex-col gap-6">
                        <SectionHeader
                            title="語学レベル"
                            icon={
                                <span className="text-[#005B5B] text-[14px] font-bold leading-none">Aあ</span>
                            }
                        />
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-3">
                                <FieldLabel>国籍</FieldLabel>
                                <div className="flex flex-wrap gap-3">
                                    {NATIONALITY_OPTIONS.map((nat) => {
                                        const isActive = languageEdit.nationality === nat;
                                        return (
                                            <button
                                                key={nat}
                                                type="button"
                                                onClick={() =>
                                                    setLanguageEdit((prev) => ({
                                                        ...prev,
                                                        nationality: nat as Nationality,
                                                        jlptLevel:
                                                            nat === "日本" ? null : prev.jlptLevel,
                                                    }))
                                                }
                                                className={`px-6 py-2.5 rounded-full text-[14px] font-medium transition-colors ${
                                                    isActive
                                                        ? "bg-[#005B5B] text-white"
                                                        : "bg-[#DFE3E1] text-[#3E4948] hover:bg-[#d4d9d6]"
                                                }`}
                                            >
                                                {nat}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {languageEdit.nationality === "ベトナム" && (
                                <label className="flex flex-col gap-3">
                                    <FieldLabel>日本語レベル (JLPT)</FieldLabel>
                                    <select
                                        value={languageEdit.jlptLevel ?? ""}
                                        onChange={(e) =>
                                            setLanguageEdit((prev) => ({
                                                ...prev,
                                                jlptLevel: e.target.value || null,
                                            }))
                                        }
                                        className="w-full h-12 px-4 bg-[#DFE3E1] rounded-lg text-[16px] text-[#181D1B] outline-none focus:ring-2 focus:ring-[#005B5B]/30"
                                    >
                                        <option value="">レベルを選択</option>
                                        {JLPT_LEVEL_OPTIONS.map((lv) => (
                                            <option key={lv} value={lv}>
                                                {lv}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                            {languageEdit.nationality === "日本" && (
                                <p className="text-[14px] text-[#727D7A] leading-relaxed">
                                    日本国籍の方は日本語ネイティブとして表示されます。
                                </p>
                            )}
                        </div>
                    </section>

                    <section className="bg-white rounded-xl p-6 sm:p-8 flex flex-col gap-6">
                        <SectionHeader
                            title="興味・関心"
                            icon={
                                <svg width="20" height="19" viewBox="0 0 20 19" fill="#005B5B" aria-hidden>
                                    <circle cx="6" cy="6" r="4" />
                                    <rect x="11" y="3" width="8" height="8" rx="1" />
                                </svg>
                            }
                        />
                        {hobbies.length === 0 && (
                            <p className="text-[14px] text-[#727D7A]">
                                下の候補から選ぶか、「+ 自由入力」で追加してください。
                            </p>
                        )}
                        <TagEditor
                            tags={hobbies}
                            onChange={setHobbies}
                            placeholder="例：料理、旅行"
                            suggestions={COMMON_HOBBY_OPTIONS}
                        />
                    </section>

                    <section className="bg-white rounded-xl p-6 sm:p-8 flex flex-col gap-6">
                        <SectionHeader
                            title="交流の目的"
                            icon={
                                <svg width="20" height="19" viewBox="0 0 20 19" fill="#005B5B" aria-hidden>
                                    <circle cx="6" cy="6" r="4" />
                                    <rect x="11" y="3" width="8" height="8" rx="1" />
                                </svg>
                            }
                        />
                        <TagEditor
                            tags={purposes}
                            onChange={setPurposes}
                            placeholder="例：言語交換、文化交流"
                            suggestions={COMMON_PURPOSE_OPTIONS}
                        />
                    </section>

                    {error && (
                        <p className="text-[14px] text-[#923118] font-medium text-center px-2">{error}</p>
                    )}
                </div>

                <div className="flex justify-end items-center gap-4 px-6 py-4 border-t border-[#BEC9C8]/20 bg-white shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="px-6 py-3 text-[16px] font-medium text-[#005B5B] disabled:opacity-50"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-10 py-3 bg-gradient-to-br from-[#005B5B] to-[#1B7575] text-white text-[16px] font-medium rounded-lg shadow-[0_10px_15px_-3px_rgba(0,91,91,0.2)] disabled:opacity-60"
                    >
                        {saving ? "保存中..." : "保存する"}
                    </button>
                </div>
            </div>
        </div>
    );
}
