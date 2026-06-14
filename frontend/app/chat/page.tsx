import { Suspense } from "react";
import ChatClient from "@/app/chat/ChatClient";

function ChatLoading() {
    return (
        <div className="flex w-full h-screen bg-[#F6FAF8] items-center justify-center">
            <div className="h-10 w-10 border-2 border-[#005B5B] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<ChatLoading />}>
            <ChatClient />
        </Suspense>
    );
}
