import Image from "next/image";
import { fetchPublicStats } from "@/lib/stats-server";
import { resolveImageUrl } from "@/lib/image";

const FALLBACK_AVATARS = ["/assets/images/avatars/avatar-1.jpg", "/assets/images/avatars/avatar-2.jpg", "/assets/images/avatars/avatar-3.jpg"];

function formatExtraUserCount(count: number) {
    if (count >= 1000) {
        const thousands = count / 1000;
        const rounded =
            thousands >= 10
                ? Math.round(thousands).toString()
                : thousands.toFixed(1).replace(/\.0$/, "");
        return `+${rounded}k`;
    }

    return `+${count.toLocaleString("ja-JP")}`;
}

export default async function StatsSection() {
    const { activeUserCount, recentAvatars } = await fetchPublicStats();
    const displayAvatars =
        recentAvatars.length > 0
            ? recentAvatars.slice(0, 3).map((url) => resolveImageUrl(url))
            : FALLBACK_AVATARS.map((url) => resolveImageUrl(url));
    const extraUserCount = Math.max(activeUserCount - displayAvatars.length, 0);

    return (
        <section className="mx-auto w-full pt-2">
            <div className="grid h-auto w-full grid-cols-1 gap-6 md:min-h-74.5 md:grid-cols-12">
                <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border border-[#D9C7A5]/70 bg-[#FFFDF7] p-8 shadow-[0_16px_36px_rgba(79,55,30,0.08)] ring-1 ring-white/70 isolation-isolate md:col-span-8">
                    <div className="absolute top-0 right-0 bottom-0 z-1 w-[33.33%]">
                        <Image
                            src="/assets/images/home/city-bg.png"
                            alt="Cityscape"
                            fill
                            className="object-cover opacity-15"
                        />
                    </div>

                    <div className="relative z-2 flex max-w-md flex-col items-start gap-4">
                        <div className="flex flex-row items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F8E0D5] text-[#923118]">
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 8L16.75 5.25L14 4L16.75 2.75L18 0L19.25 2.75L22 4L19.25 5.25L18 8ZM18 22L16.75 19.25L14 18L16.75 16.75L18 14L19.25 16.75L22 18L19.25 19.25L18 22ZM8 19L5.5 13.5L0 11L5.5 8.5L8 3L10.5 8.5L16 11L10.5 13.5L8 19ZM8 14.15L9 12L11.15 11L9 10L8 7.85L7 10L4.85 11L7 12L8 14.15Z" fill="#923118" />
                                </svg>
                            </div>
                            <span className="text-[14px] leading-6 font-black tracking-[1.4px] text-[#923118] uppercase">
                                文化交流の様子
                            </span>
                        </div>
                        <h3 className="text-[30px] leading-9 font-black tracking-tight text-[#181D1B]">
                            日常の風景を共有する
                        </h3>

                        <p className="text-[16px] leading-6.5 font-medium text-[#3E4948]">
                            コミュニティでは毎日、日本とベトナムの何気ない日常が共有されています。写真や動画を通じて、リアルな今を感じましょう。
                        </p>
                    </div>
                    <div className="relative z-2 mt-auto flex flex-wrap gap-3 pt-8">
                        <span className="rounded-full border border-[#005B5B]/15 bg-[#DDEDEA] px-4 py-2 text-[12px] leading-4 font-bold text-[#005B5B]">
                            #日本の暮らし
                        </span>
                        <span className="rounded-full border border-[#005B5B]/15 bg-[#DDEDEA] px-4 py-2 text-[12px] leading-4 font-bold text-[#005B5B]">
                            #ベトナムの食卓
                        </span>
                        <span className="rounded-full border border-[#005B5B]/15 bg-[#DDEDEA] px-4 py-2 text-[12px] leading-4 font-bold text-[#005B5B]">
                            #週末の旅
                        </span>
                    </div>
                </div>

                <div className="flex h-full flex-col items-center justify-center rounded-[28px] border border-[#D9C7A5]/70 bg-[#FFFDF7] px-8 py-16 shadow-[0_16px_36px_rgba(79,55,30,0.08)] ring-1 ring-white/70 md:col-span-4">
                    <div className="mb-2">
                        <h2
                            className="text-[48px] leading-12 font-black text-[#005B5B]"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            {activeUserCount.toLocaleString("ja-JP")}
                        </h2>
                    </div>
                    <div className="mb-6">
                        <span className="text-[14px] leading-5 font-black tracking-[1.4px] text-[#8B5E34] uppercase">
                            アクティブユーザー
                        </span>
                    </div>

                    <div className="flex flex-row justify-center items-center">
                        {displayAvatars.map((avatarSrc, index) => (
                            <div
                                key={`${avatarSrc}-${index}`}
                                className="relative -mr-3 h-10 w-10 overflow-hidden rounded-full border-2 border-[#FFFDF7] bg-[#EFE3D0] shadow-sm"
                                style={{ zIndex: index + 1 }}
                            >
                                <Image
                                    src={avatarSrc}
                                    alt="User"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ))}
                        {extraUserCount > 0 && (
                            <div className="relative z-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#FFFDF7] bg-[#005B5B]">
                                <span
                                    className="text-[10px] leading-3.75 font-bold text-white"
                                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                >
                                    {formatExtraUserCount(extraUserCount)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
