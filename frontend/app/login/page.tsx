"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
    const { refresh } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ email, password }),
            });
            const result = await res.json();
            
            if (!result.success) {
                setErrorMsg(result.message);
                setIsLoading(false);
                return;
            }

            if (result.user.status === "VERIFIED") {
                await refresh();
                window.location.assign("/community");
                return;
            } else {
                setErrorMsg("アカウントはまだ認証されていません。本人確認を完了してください。");
            }
        } catch (err: any) {
            setErrorMsg(err.message || "ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden">
            {/* Background image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/assets/images/home/hero-bg.png?v=5"
                    alt="背景"
                    fill
                    className="object-cover object-center"
                    priority
                />
                {/* Dark teal overlay */}
                <div className="absolute inset-0 bg-[#002424]/75 backdrop-blur-[2px]" />
            </div>

            {/* Back button — glassmorphism */}
            <div className="absolute top-5 left-6 md:top-8 md:left-8 z-20">
                <Link
                    href="/"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/25 hover:bg-white/25 transition-all shadow-md"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.825 9L9.425 14.6L8 16L0 8L8 0L9.425 1.4L3.825 7H16V9H3.825Z" fill="white" />
                    </svg>
                </Link>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-[480px] flex flex-col items-center px-4">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <span
                        className="text-[38px] font-black text-white leading-10 tracking-[-1.8px] drop-shadow-lg"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                        Tomoio
                    </span>
                    <div className="w-16 h-1.5 bg-[#E76F51] rounded-full mt-2" />
                    <span className="text-[10.4px] font-medium text-white/70 leading-4 tracking-[3.12px] mt-3">
                        文化交流の架け橋
                    </span>
                </div>

                {/* Card */}
                <div className="w-full bg-white/95 backdrop-blur-md border border-white/20 rounded-3xl p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.3)] flex flex-col gap-8">
                    <div className="flex flex-col items-center text-center gap-2">
                        <h1 className="text-[26px] sm:text-[30px] font-medium text-[#181D1B] leading-9 tracking-[-0.75px]">
                            おかえりなさい
                        </h1>
                        <p className="text-[14px] font-medium text-[#526160] leading-5">
                            アカウントにログインして文化交流を始めましょう
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-5 w-full">
                        {errorMsg && (
                            <div className="w-full p-3 bg-red-50 text-red-600 text-[14px] font-medium rounded-xl text-center border border-red-100">
                                {errorMsg}
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <label className="text-[11.2px] font-medium text-[#526160]/80 leading-4 tracking-[1.28px] uppercase">
                                メールアドレス
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="example@tomoio.com"
                                className="w-full h-[52px] bg-[#F0F5F2]/80 border border-[#DFE3E1]/60 rounded-xl px-5 text-[15px] font-medium text-[#181D1B] placeholder:text-[#6E7979]/40 focus:outline-none focus:ring-2 focus:ring-[#005B5B]/30 focus:bg-white focus:border-[#005B5B]/30 transition-all"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center w-full">
                                <label className="text-[11.2px] font-medium text-[#526160]/80 leading-4 tracking-[1.28px] uppercase">
                                    パスワード
                                </label>
                                <Link href="/forgot-password" className="text-[10.4px] font-medium text-[#E76F51] hover:underline">
                                    パスワードを忘れた場合
                                </Link>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full h-[52px] bg-[#F0F5F2]/80 border border-[#DFE3E1]/60 rounded-xl px-5 text-[15px] font-medium text-[#181D1B] placeholder:text-[#6E7979]/40 focus:outline-none focus:ring-2 focus:ring-[#005B5B]/30 focus:bg-white focus:border-[#005B5B]/30 transition-all tracking-[4px]"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-[52px] bg-[#005B5B] hover:bg-[#004A4A] text-white text-[16px] font-semibold rounded-xl flex justify-center items-center gap-2.5 transition-all shadow-[0_10px_25px_-4px_rgba(0,91,91,0.35)] hover:-translate-y-0.5 active:scale-[0.98] mt-1"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <>
                                    ログイン
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.1458 7.5H0V5.83333H10.1458L5.47917 1.16667L6.66667 0L13.3333 6.66667L6.66667 13.3333L5.47917 12.1667L10.1458 7.5Z" fill="white" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative w-full flex justify-center items-center">
                        <div className="absolute w-full border-t border-[#BEC9C8]/30" />
                        <div className="relative bg-white px-4 text-[12px] font-medium text-[#6E7979]/60 tracking-[1.2px]">
                            または
                        </div>
                    </div>

                    <div className="flex justify-center items-center gap-1.5 w-full -mt-2">
                        <span className="text-[14px] font-medium text-[#526160]">
                            アカウントをお持ちでないですか？
                        </span>
                        <Link href="/register" className="text-[14px] font-semibold text-[#005B5B] hover:underline">
                            新規登録
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}