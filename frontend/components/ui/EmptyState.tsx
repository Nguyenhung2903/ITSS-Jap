import type { ReactNode } from "react";

type EmptyStateProps = {
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
};

export default function EmptyState({
    title,
    description,
    action,
    className = "",
}: EmptyStateProps) {
    return (
        <div
            className={[
                "flex flex-col items-center justify-center gap-4 rounded-[28px] border border-[#DFE3E1]/60 bg-white px-6 py-16 text-center shadow-[0_8px_30px_rgba(0,0,0,0.025)]",
                className,
            ].join(" ")}
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F4F1] text-[#005B5B]">
                <span className="text-2xl" aria-hidden="true">⌕</span>
            </div>
            <div className="space-y-1">
                <h3 className="text-[18px] font-bold text-[#181D1B]">{title}</h3>
                {description && (
                    <p className="text-[14px] leading-6 text-[#6E7979]">{description}</p>
                )}
            </div>
            {action}
        </div>
    );
}
