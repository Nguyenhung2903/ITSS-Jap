import Link from "next/link";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-18 w-full border-b border-[#D9C7A5]/45 bg-[#FFFDF7]/88 shadow-[0_10px_32px_rgba(79,55,30,0.08)] backdrop-blur-xl">
            <div className="mx-auto flex h-full items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-10 lg:gap-16">
                    <Link href="/" className="flex items-center justify-center">
                        <span className="text-[22px] font-black tracking-tight text-[#005B5B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Tomoio
                        </span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            href="/"
                            className="relative text-sm font-extrabold text-[#8B5E34] after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-[#E76F51] after:content-['']"
                        >
                            ホーム
                        </Link>
                        <Link
                            href="/community"
                            className="text-sm font-bold leading-5 text-[#3E4948] transition-colors hover:text-[#005B5B]"
                        >
                            コミュニティ
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <Link
                        href="/login"
                        className="flex h-10 items-center justify-center rounded-full px-4 text-sm font-bold text-[#005B5B] transition-colors hover:bg-[#E8F4F2]"
                    >
                        ログイン
                    </Link>
                    <Link
                        href="/register"
                        className="flex h-10 items-center justify-center rounded-full bg-[#005B5B] px-5 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(0,91,91,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#004A4A] active:scale-95"
                    >
                        新規登録
                    </Link>
                </div>
            </div>
        </header>
    )
}
