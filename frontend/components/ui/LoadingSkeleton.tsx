type LoadingSkeletonProps = {
    count?: number;
    className?: string;
};

export default function LoadingSkeleton({ count = 6, className = "" }: LoadingSkeletonProps) {
    return (
        <div className={["grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3", className].join(" ")}>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="h-72 animate-pulse rounded-[28px] border border-[#DFE3E1]/60 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
                >
                    <div className="h-32 rounded-t-[28px] bg-[#E8F0ED]" />
                    <div className="space-y-3 p-5">
                        <div className="h-4 w-2/3 rounded bg-[#E8F0ED]" />
                        <div className="h-3 w-full rounded bg-[#EEF5F2]" />
                        <div className="h-3 w-4/5 rounded bg-[#EEF5F2]" />
                    </div>
                </div>
            ))}
        </div>
    );
}
