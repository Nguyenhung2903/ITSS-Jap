import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";
import { applyAuthCookies, toSessionUser } from "@/lib/auth-session";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        console.log("Next.js Login Route: sending request to backend...");
        const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        console.log("Next.js Login Route: backend responded with status", res.status);
        const data = await res.json();
        console.log("Next.js Login Route: backend response data:", data);

        if (!res.ok) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        data.error ||
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

        console.log("Next.js Login Route: cookies applied successfully, returning success");
        return response;
    } catch (error: unknown) {
        console.error("Next.js Login Route: caught exception:", error);
        const message = error instanceof Error ? error.message : "ログインに失敗しました。";
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
