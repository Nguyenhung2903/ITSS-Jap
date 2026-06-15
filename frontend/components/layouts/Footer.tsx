import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full border-t border-[#D9C7A5]/45 bg-[#FFFDF7]/88">
            <div className="mx-auto flex items-center justify-between px-5 py-10 md:px-8">
                <div className="flex flex-col items-start">
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <span
                            className="text-2xl leading-8 font-black tracking-[-0.6px] text-[#005B5B]"
                        >
                            Tomoio
                        </span>
                    </Link>
                    <div className="pt-1">
                        <span className="text-sm leading-5 font-medium text-[#3E4948]">
                            日本と世界を、声でつなぐ cultural bridge
                        </span>
                    </div>
                </div>
                <div></div>
            </div>
        </footer>
    )
}
