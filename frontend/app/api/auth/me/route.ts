import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
    console.log("Next.js Route /api/auth/me: checking session...");
    try {
        const user = await getSessionUser();
        console.log("Next.js Route /api/auth/me: session user found:", user);
        return NextResponse.json({ user });
    } catch (err) {
        console.error("Next.js Route /api/auth/me: error getting session:", err);
        return NextResponse.json({ user: null, error: String(err) }, { status: 500 });
    }
}
