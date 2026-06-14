"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProfileView from "@/components/profile/ProfileView";
import type { UserProfile } from "@/app/actions/profile";
import { fetchProfileClient, readProfileCache } from "@/lib/profile-client";

export default function ProfilePageClient({ userId }: { userId: string }) {
    const cached = readProfileCache(userId);
    const [profile, setProfile] = useState<UserProfile | null>(cached);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(!cached);

    useEffect(() => {
        if (cached) return;

        let cancelled = false;

        void (async () => {
            const result = await fetchProfileClient(userId);
            if (cancelled) return;

            if (!result.success) {
                setError(result.message);
                setIsLoading(false);
                return;
            }

            setProfile(result.data);
            setError(null);
            setIsLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [cached, userId]);

    if (isLoading) {
        return (
            <div className="flex w-full min-h-screen bg-[#F6FAF8]">
                <div className="flex-1 p-12">
                    <div className="max-w-[960px] mx-auto animate-pulse space-y-6">
                        <div className="h-12 w-48 bg-[#DFE3E1] rounded-xl" />
                        <div className="h-[420px] bg-white rounded-[24px]" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex w-full min-h-screen bg-[#F6FAF8] flex-col items-center justify-center px-6 gap-2">
                <p className="text-[16px] font-medium text-[#923118] text-center max-w-md">
                    {error ?? "プロフィールの取得に失敗しました。"}
                </p>
                <Link
                    href="/matching"
                    className="mt-6 px-6 py-3 bg-[#005B5B] text-white rounded-xl text-[14px] font-medium"
                >
                    マッチングに戻る
                </Link>
            </div>
        );
    }

    return <ProfileView profile={profile} />;
}
