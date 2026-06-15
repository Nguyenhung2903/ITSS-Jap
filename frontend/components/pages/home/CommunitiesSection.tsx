import Link from "next/link";

const COMMUNITIES = [
    {
        name: "日越カルチャー交流",
        description: "日本とベトナムの暮らし、行事、写真を共有するコミュニティ。",
        image: "/assets/images/events/Culture-and-arts-of-Vietnam.jpg",
        tags: ["文化", "写真", "交流"],
    },
    {
        name: "日本語・ベトナム語会話",
        description: "短い会話練習や質問を気軽に投稿できる語学グループ。",
        image: "/assets/images/groups/japan-banner.jpg",
        tags: ["言語交換", "日本語", "ベトナム語"],
    },
    {
        name: "週末フードクラブ",
        description: "おすすめのお店、家庭料理、週末の食事会を見つける場所。",
        image: "/assets/images/events/Am-Thuc-Viet-Nam.jpeg",
        tags: ["料理", "友達作り", "週末"],
    },
];

export default function CommunitiesSection() {
    return (
        <section id="communities" className="mx-auto flex w-full scroll-mt-24 flex-col items-start gap-8 pt-2">
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-start gap-2">
                    <div className="flex flex-row items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDEDEA] text-[#005B5B]">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M16 11C17.66 11 19 9.66 19 8C19 6.34 17.66 5 16 5M8 11C9.66 11 11 9.66 11 8C11 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.33 13 3 14.34 3 16V18H13V16C13 14.34 10.67 13 8 13ZM16 13C15.29 13 14.61 13.09 14 13.26C15.19 13.98 16 14.95 16 16V18H21V16C21 14.34 18.67 13 16 13Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="text-[12px] leading-4 font-black tracking-[1.2px] text-[#005B5B] uppercase">
                            コミュニティ
                        </span>
                    </div>
                    <h2 className="text-[30px] leading-9 font-black tracking-tight text-[#181D1B]">
                        人気のコミュニティ
                    </h2>
                </div>
                <Link href="/login" className="group flex flex-row items-center gap-1 rounded-full border border-[#D9C7A5]/70 bg-[#FFFDF7] px-4 py-2 shadow-sm transition-all hover:border-[#005B5B]/30 hover:bg-[#E8F4F2]">
                    <span className="text-[14px] leading-5 font-bold text-[#005B5B]">
                        ログインして参加
                    </span>
                    <div className="flex h-3.5 w-3.5 items-center justify-center text-[#005B5B] transition-transform group-hover:translate-x-1">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                            <path d="M7.10208 5.25H0V4.08333H7.10208L3.83542 0.816667L4.66667 0L9.33333 4.66667L4.66667 9.33333L3.83542 8.51667L7.10208 5.25Z" fill="currentColor" />
                        </svg>
                    </div>
                </Link>
            </div>

            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
                {COMMUNITIES.map((community) => (
                    <Link
                        key={community.name}
                        href="/login"
                        className="group overflow-hidden rounded-[28px] border border-[#D9C7A5]/70 bg-[#FFFDF7] shadow-[0_16px_36px_rgba(79,55,30,0.08)] ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(0,91,91,0.10)]"
                    >
                        <div className="relative h-48 w-full overflow-hidden bg-[#EFE3D0]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={community.image} alt={community.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        </div>
                        <div className="flex flex-col gap-3 p-6">
                            <h3 className="text-[20px] leading-7 font-black text-[#181D1B] group-hover:text-[#005B5B]">
                                {community.name}
                            </h3>
                            <p className="text-[14px] leading-6 font-medium text-[#3E4948]">
                                {community.description}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {community.tags.map((tag, index) => (
                                    <span
                                        key={tag}
                                        className={`rounded-full border px-3 py-1.5 text-[12px] font-bold shadow-sm ${index % 2 === 0
                                            ? "border-[#005B5B]/20 bg-[#DDEDEA] text-[#005B5B]"
                                            : "border-[#B86B4B]/25 bg-[#F8E0D5] text-[#923118]"
                                        }`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
