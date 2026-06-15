"use server";

import { cookies } from "next/headers";
import { getApiBaseUrl } from "@/lib/api";
import { normalizeSearchQuery } from "@/lib/search";

export type EventFormat = "online" | "offline" | "all" | "liked" | "joined" | "expired";

export async function getEventsAction(params?: {
    page?: number;
    format?: EventFormat;
    search?: string;
    joinedOnly?: boolean;
    likedOnly?: boolean;
    expiredOnly?: boolean;
}) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("tomoio_token")?.value;

        if (!token) {
            return { success: false, message: "ログインしてください。", data: [], total: 0, hasMore: false };
        }

        const query = new URLSearchParams();
        if (params?.page) query.set("page", String(params.page));
        if (params?.format) {
            const fmt = params.format;
            if (fmt === "offline" || fmt === "online") {
                query.set("format", fmt);
            } else if (fmt === "liked") {
                query.set("likedOnly", "true");
            } else if (fmt === "joined") {
                query.set("joinedOnly", "true");
            } else if (fmt === "expired") {
                query.set("expiredOnly", "true");
            }
        }
        const normalizedSearch = normalizeSearchQuery(params?.search);
        if (normalizedSearch) query.set("search", normalizedSearch);
        if (params?.joinedOnly) query.set("joinedOnly", "true");
        if (params?.likedOnly) query.set("likedOnly", "true");
        if (params?.expiredOnly) query.set("expiredOnly", "true");

        const res = await fetch(
            `${getApiBaseUrl()}/events?${query.toString()}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            }
        );

        const data = await res.json();

        if (!res.ok) {
            return {
                success: false,
                message: data.error || "イベントの取得に失敗しました。",
                data: [],
                total: 0,
                hasMore: false,
            };
        }

        return {
            success: true,
            data: data.data ?? [],
            total: data.total ?? 0,
            hasMore: data.hasMore ?? false,
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "イベントの取得に失敗しました。";
        return { success: false, message, data: [], total: 0, hasMore: false };
    }
}

export type CreateEventPayload = {
    title: string;
    description: string;
    eventTime: string;
    format: "online" | "offline";
    address?: string;
    urlLink?: string;
    imageUrl?: string;
};

export async function createEventAction(payload: CreateEventPayload) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("tomoio_token")?.value;

        if (!token) {
            return { success: false, message: "ログインしてください。" };
        }

        const res = await fetch(`${getApiBaseUrl()}/events`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            const raw = (data.error as string) || "イベントの作成に失敗しました。";
            const message =
                raw.includes("5–500") || raw.includes("5-500")
                    ? "イベント名は5〜500文字で入力してください。"
                    : raw.includes("5–50") || raw.includes("5-50")
                      ? "イベント名は5〜500文字で入力してください。"
                    : raw.includes("10 ký tự") || raw.includes("10")
                      ? "説明は10文字以上必要です。"
                      : raw.includes("online") && raw.includes("URL")
                        ? "オンラインイベントにはZoomなどのURLを入力してください。"
                        : raw.includes("offline") || raw.includes("Địa chỉ")
                          ? "対面イベントには場所を入力してください。"
                          : raw.includes("quá khứ") || raw.includes("past")
                            ? "過去の日時は指定できません。"
                            : raw;
            return { success: false, message };
        }

        return { success: true, data };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "イベントの作成に失敗しました。";
        return { success: false, message };
    }
}

export async function engageEventAction(eventId: number, type: "joined" | "interested" = "joined") {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("tomoio_token")?.value;

        if (!token) {
            return { success: false, message: "ログインしてください。" };
        }

        const res = await fetch(
            `${getApiBaseUrl()}/events/${eventId}/engage`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ type }),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            return { success: false, message: data.error || "参加に失敗しました。" };
        }

        return { success: true, data };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "参加に失敗しました。";
        return { success: false, message };
    }
}
