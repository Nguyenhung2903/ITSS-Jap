import Link from "next/link";
import Image from "next/image";
import { fetchPublicEventsList } from "@/lib/events-server";
import { formatApiEvent, formatEventDate, type ApiEvent } from "@/lib/events-format";

const HOME_EVENTS_LIMIT = 4;

export default async function EventsSection() {
    const result = await fetchPublicEventsList({ page: 1, limit: HOME_EVENTS_LIMIT });
    const events = (result.data as ApiEvent[]).map((event) => formatApiEvent(event));

    return (
        <section id="latest-events" className="mx-auto flex w-full scroll-mt-24 flex-col items-start gap-8 pt-2">
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-start gap-2">
                    <div className="flex flex-row items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8E0D5] text-[#923118]">
                            <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.5 16C10.8 16 10.2083 15.7583 9.725 15.275C9.24167 14.7917 9 14.2 9 13.5C9 12.8 9.24167 12.2083 9.725 11.725C10.2083 11.2417 10.8 11 11.5 11C12.2 11 12.7917 11.2417 13.275 11.725C13.7583 12.2083 14 12.8 14 13.5C14 14.2 13.7583 14.7917 13.275 15.275C12.7917 15.7583 12.2 16 11.5 16ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H3V0H5V2H13V0H15V2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM2 18H16V8H2V18ZM2 6H16V4H2V6ZM2 6V4V6Z" fill="#923118" />
                            </svg>
                        </div>
                        <span className="text-[12px] leading-4 font-black tracking-[1.2px] text-[#923118] uppercase">
                            イベント
                        </span>
                    </div>
                    <h2 className="text-[30px] leading-9 font-black tracking-tight text-[#181D1B]">
                        最新の公式イベント
                    </h2>
                </div>
                <Link href="/events" className="group flex flex-row items-center gap-1 rounded-full border border-[#D9C7A5]/70 bg-[#FFFDF7] px-4 py-2 shadow-sm transition-all hover:border-[#005B5B]/30 hover:bg-[#E8F4F2]">
                    <span className="text-[14px] leading-5 font-bold text-[#005B5B]">
                        すべてのイベントを見る
                    </span>
                    <div className="flex h-3.5 w-3.5 items-center justify-center text-[#005B5B] transition-transform group-hover:translate-x-1">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.10208 5.25H0V4.08333H7.10208L3.83542 0.816667L4.66667 0L9.33333 4.66667L4.66667 9.33333L3.83542 8.51667L7.10208 5.25Z" fill="currentColor" />
                        </svg>
                    </div>
                </Link>
            </div>

            {events.length > 0 ? (
                <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {events.map((event) => (
                        <Link
                            key={event.id}
                            href="/events"
                            className="group mx-auto flex h-82 w-full max-w-72 flex-col overflow-hidden rounded-[24px] border border-[#D9C7A5]/70 bg-[#FFFDF7] shadow-[0_16px_36px_rgba(79,55,30,0.08)] ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(0,91,91,0.10)]"
                        >
                            <div className="relative h-48 w-full bg-[#EFE3D0]">
                                <Image
                                    src={event.imageUrl ?? "/assets/images/events/event-1.png"}
                                    alt={event.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>

                            <div className="flex h-33 flex-col items-start gap-2 p-5">
                                <div
                                    className="text-[12px] leading-4 font-black text-[#005B5B]"
                                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                >
                                    {formatEventDate(event.eventTime)}
                                </div>
                                <h3 className="w-full truncate text-[18px] leading-7 font-extrabold text-[#181D1B]">
                                    {event.title}
                                </h3>
                                <p className="line-clamp-2 text-[12px] leading-4 font-medium text-[#3E4948]">
                                    {event.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-[14px] leading-5 font-medium text-[#3E4948]">
                    現在開催予定のイベントはありません。
                </p>
            )}
        </section>
    );
}
