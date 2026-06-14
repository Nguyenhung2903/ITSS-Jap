"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProfileView from "@/components/profile/ProfileView";
import type { UserProfile } from "@/app/actions/profile";
import { fetchProfileClient, readProfileCache } from "@/lib/profile-client";
import Sidebar from "@/components/layouts/Sidebar";
import TopNav from "@/components/layouts/TopNav";
import { useAuth } from "@/lib/auth-context";

export default function ProfilePageClient({ userId }: { userId: string }) {
    const { user } = useAuth();
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
                <Sidebar />
                <div className="flex-1 flex flex-col relative overflow-y-auto">
                    <TopNav backLink={Number(userId) === user?.id ? undefined : "/matching"} />
                    <main className="flex justify-center w-full pt-10 pb-16 px-6">
                        <div className="w-full max-w-[944px] animate-pulse space-y-6">
                            <div className="h-12 w-48 bg-[#DFE3E1]/70 rounded-xl" />
                            <div className="h-[420px] bg-white rounded-[24px] border border-[#BEC9C8]/10" />
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex w-full min-h-screen bg-[#F6FAF8]">
                <Sidebar />
                <div className="flex-1 flex flex-col relative overflow-y-auto">
                    <TopNav backLink="/matching" />
                    <main className="flex-1 flex flex-col items-center justify-center px-6 gap-3">
                        <p className="text-[16px] font-medium text-[#923118] text-center max-w-md">
                            {error ?? "プロフィールの取得に失敗しました。"}
                        </p>
                        <Link
                            href="/matching"
                            className="mt-4 px-6 py-3 bg-[#005B5B] text-white rounded-xl text-[14px] font-bold shadow-xs hover:bg-[#004A4A] active:scale-95 transition-all duration-200"
                        >
                            マッチングに戻る
                        </Link>
                    </main>
                </div>
            </div>
        );
    }

    return <ProfileView profile={profile} />;
}
