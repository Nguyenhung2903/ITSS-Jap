import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";
import { applyAuthCookies, toSessionUser } from "@/lib/auth-session";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        data.message ||
                        "ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。",
                },
                { status: res.status }
            );
        }

        const { token, user } = data;
        const sessionUser = toSessionUser(user);
        const response = NextResponse.json({ success: true, user: sessionUser });
        applyAuthCookies(response, token, user);

        return response;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "ログインに失敗しました。";
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
