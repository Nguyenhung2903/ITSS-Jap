import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
    return (
        <section className="mx-auto w-full">
            <div className="relative flex min-h-[520px] w-full overflow-hidden rounded-[32px] border border-[#D9C7A5]/70 bg-[#FFFDF7] shadow-[0_24px_60px_rgba(79,55,30,0.14)] ring-1 ring-white/70">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1.5 bg-gradient-to-r from-[#8B5E34] via-[#E76F51] to-[#005B5B]" />
                <div className="absolute inset-0 z-0">
                    <Image src="/assets/images/home/hero-bg.png?v=5" alt="日本の風景" fill className="object-cover object-center" priority />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#003F3F]/90 via-[#005B5B]/55 to-[#F8F4EA]/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181D1B]/30 via-transparent to-transparent" />
                </div>
                <div className="relative z-10 flex max-w-2xl flex-col items-start p-7 sm:p-10 md:p-14 lg:p-16">
                    <div className="mb-6 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-black tracking-[1px] text-white shadow-sm backdrop-blur-md">
                        新しい文化交流のカタチ
                    </div>
                    <h1 className="mb-6 text-[42px] leading-[1.05] font-black tracking-tight text-white md:text-[68px]">
                        日本と世界を、<br />声でつなぐ
                    </h1>
                    <p className="mb-6 max-w-xl text-[16px] leading-7 font-medium text-white/85 md:text-[19px]">
                        言語の壁を越え、文化の架け橋となる。ベトナムと日本の新しい出会いが、ここから始まります。
                    </p>
                    <div className="flex w-full flex-col gap-4 pt-4 sm:w-auto sm:flex-row">
                        <Link
                            href="/register"
                            className="flex h-13 items-center justify-center rounded-2xl bg-[#005B5B] px-8 text-[16px] font-extrabold text-white shadow-[0_10px_25px_-4px_rgba(0,91,91,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#004A4A] active:scale-[0.98]"
                        >
                            今すぐ始める
                        </Link>
                        <Link
                            href="#latest-events"
                            className="flex h-13 items-center justify-center rounded-2xl border border-white/30 bg-white/15 px-8 text-[16px] font-extrabold text-white shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/25 active:scale-[0.98]"
                        >
                            詳しく見る
                        </Link>
                    </div>
                </div>
            </div>

        </section>
    )
}
