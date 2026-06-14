"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // State cho các thẻ Chip (Chọn Quốc tịch & Mục đích)
    const [nationality, setNationality] = useState<"日本" | "ベトナム" | null>(null);
    const [purposes, setPurposes] = useState<string[]>([]);

    // State xử lý File Upload
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false)

    // Hàm xử lý chọn/bỏ chọn mục đích (Cho phép chọn nhiều)
    const togglePurpose = (purpose: string) => {
        if (purposes.includes(purpose)) {
            setPurposes(purposes.filter(p => p !== purpose));
        } else {
            setPurposes([...purposes, purpose]);
        }
    };

    // Hàm xử lý khi người dùng chọn file
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError("ファイルサイズは5MB以下にしてください。(File phải dưới 5MB)");
                return;
            }
            
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // 1. Validation Frontend cơ bản
        if (!email || !password || !nationality || purposes.length === 0 || !file) {
            setError("すべての項目を入力・選択してください。(Vui lòng điền đủ thông tin)");
            return;
        }

        setIsLoading(true);

        // 2. Khởi tạo FormData
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        // Map nationality vào trường language theo như DB yêu cầu
        formData.append("language", nationality); 
        // Nối các mục đích thành 1 chuỗi string (vd: "学習, 友達")
        formData.append("purpose", purposes.join(", ")); 
        formData.append("cccd", file);

        // 3. Gọi Server Action
        const res = await fetch("/api/auth/register", {
            method: "POST",
            body: formData,
        });
        const result = await res.json();

        if (result.success) {
            setShowSuccessToast(true);
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } else {
            setError(result.message);
            setIsLoading(false);
        }

        setIsLoading(false);
    };

    return (
        <div className="flex flex-col w-full h-screen bg-surface" style={{ fontFamily: "'Manrope', 'Plus Jakarta Sans', sans-serif" }}>
            <div className="w-full h-16 px-8 flex items-center justify-between bg-white/70 backdrop-blur-[6px] border-b border-[#F1F5F9]/15 fixed top-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex flex-col justify-center items-center p-2 w-8 h-8 rounded-full hover:bg-black/5 transition-colors">
                        <div className="w-4 h-4 flex justify-center items-start">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.825 9L9.425 14.6L8 16L0 8L8 0L9.425 1.4L3.825 7H16V9H3.825Z" fill="#005B5B" />
                            </svg>
                        </div>
                    </Link>
                </div>
                <div></div>
            </div>

            {/* Main Canvas */}
            <main className="flex flex-row justify-center items-start w-full min-h-screen bg-surface pt-28 pb-12 px-6">
                
                {/* Container (max-width: 672px) */}
                <div className="flex flex-col items-start w-full max-w-2xl gap-8">
                    
                    {/* Header Section */}
                    <div className="flex flex-col items-start gap-2 w-full">
                        <div className="flex flex-col items-center w-full">
                            <h2 className="text-[36px] font-medium text-[#005B5B] tracking-[-0.9px] leading-10 text-center">
                                アカウント作成
                            </h2>
                        </div>
                        <div className="flex flex-col items-center w-full">
                            <p className="text-[16px] font-medium text-text-muted leading-6 text-center">
                                文化の架け橋となるコミュニティへようこそ
                            </p>
                        </div>
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="flex flex-col items-start gap-6 w-full">
                        
                        {/* Email & Password Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                            <div className="flex flex-col gap-1.5 w-full">
                                <label className="text-[11.2px] font-medium text-[#6E7979] uppercase tracking-[0.56px]">
                                    メールアドレス
                                </label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@tomoio.com"
                                    className="w-full h-12 bg-[#DFE3E1] rounded-xl px-4 text-[16px] text-text-main placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#005B5B]/20 transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5 w-full">
                                <label className="text-[11.2px] font-medium text-[#6E7979] uppercase tracking-[0.56px]">
                                    パスワード
                                </label>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-12 bg-[#DFE3E1] rounded-xl px-4 text-[16px] text-text-main placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#005B5B]/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Nationality Chips */}
                        <div className="flex flex-col gap-2 w-full">
                            <label className="text-[11.2px] font-medium text-[#6E7979] uppercase tracking-[0.56px]">
                                出身地
                            </label>
                            <div className="flex gap-3">
                                {["日本", "ベトナム"].map((nat) => {
                                    const isActive = nationality === nat;
                                    return (
                                        <button
                                            key={nat}
                                            type="button"
                                            onClick={() => setNationality(nat as any)}
                                            className={`h-10.5 px-6 rounded-full text-[14px] font-medium transition-all flex items-center justify-center ${
                                                isActive 
                                                    ? "bg-[#A0F0F0] text-[#004F50] border border-[#005B5B]/10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" 
                                                    : "bg-[#BACAC8] text-[#101E1D] hover:bg-[#a9bcba]"
                                            }`}
                                        >
                                            {nat}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Purpose Chips */}
                        <div className="flex flex-col gap-2 w-full">
                            <label className="text-[11.2px] font-medium text-[#6E7979] uppercase tracking-[0.56px]">
                                利用目的
                            </label>
                            <div className="flex gap-3 flex-wrap">
                                {["学習", "友達", "ビジネス"].map((purp) => {
                                    const isActive = purposes.includes(purp);
                                    return (
                                        <button
                                            key={purp}
                                            type="button"
                                            onClick={() => togglePurpose(purp)}
                                            className={`h-10.5 px-5 rounded-full text-[14px] font-medium transition-all flex items-center justify-center ${
                                                isActive 
                                                    ? "bg-[#A0F0F0] text-[#004F50] border border-[#005B5B]/10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" 
                                                    : "bg-[#BACAC8] text-[#101E1D] hover:bg-[#a9bcba]"
                                            }`}
                                        >
                                            {purp}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* KYC Upload Section */}
                        <div className="flex flex-col gap-3 w-full py-4">
                            <label className="text-[11.2px] font-medium text-[#6E7979] uppercase tracking-[0.56px] px-1">
                                本人確認 (ID/パスポート)
                            </label>
                            <div className="relative w-full h-40 bg-footer border-2 border-dashed border-[#BEC9C8] rounded-2xl flex flex-col justify-center items-center gap-3 hover:bg-[#dfe4e1] transition-colors cursor-pointer group">
                                {/* Input ẩn đè lên toàn bộ div */}
                                <input 
                                    type="file" 
                                    onChange={handleFileChange}
                                    accept="image/jpeg, image/png, application/pdf"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                />
                                
                                {fileName ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22 11.08V12C21.9988 14.1564 21.3001 16.2547 20.0093 17.9818C18.7185 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98233 16.07 2.85999" stroke="#005B5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M22 4L12 14.01L9 11.01" stroke="#005B5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <span className="text-[14px] font-medium text-[#005B5B] text-center px-4 line-clamp-1">{fileName}</span>
                                    </div>
                                ) : (
                                    <>
                                        <svg width="33" height="24" viewBox="0 0 33 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform">
                                            <path d="M22.5 15V19C22.5 19.5304 22.2893 20.0391 21.9142 20.4142C21.5391 20.7893 21.0304 21 20.5 21H6.5C5.96957 21 5.46086 20.7893 5.08579 20.4142C4.71071 20.0391 4.5 19.5304 4.5 19V15" stroke="#005B5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M18.5 8L13.5 3L8.5 8" stroke="#005B5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M13.5 3V15" stroke="#005B5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[14px] font-medium text-text-main">ファイルをアップロード</span>
                                            <span className="text-[12px] text-text-muted">JPEG, PNG (最大 5MB)</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="w-full text-center text-[#923118] text-[14px] font-medium bg-[#FFDAD6]/50 py-2 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-linear-to-r from-[#005B5B] to-[#1B7575] text-white text-[18px] font-medium rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] hover:opacity-90 transition-opacity flex justify-center items-center"
                        >
                            {isLoading ? "登録中..." : "登録完了"}
                        </button>
                    </form>

                    {/* <div className="flex flex-col items-center gap-[16px] pt-[16px] w-full">
                        <p className="text-[14px] text-[#6E7979]">
                            すでにアカウントをお持ちですか？{" "}
                            <Link href="/login" className="text-[#005B5B] font-bold hover:underline">
                                ログイン
                            </Link>
                        </p>
                    </div> */}

                </div>
            </main>
            {showSuccessToast && (
                <div className="fixed bottom-8 right-8 bg-white border-l-4 border-[#005B5B] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-lg p-4 flex items-center gap-3 z-50 animate-bounce">
                    <div className="w-8 h-8 rounded-full bg-[#005B5B]/10 flex items-center justify-center shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="#005B5B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-text-main">成功しました！</span>
                        <span className="text-[13px] text-[#6E7979]">ログインページへ移動しています...</span>
                    </div>
                </div>
            )}
        </div>
    );
}