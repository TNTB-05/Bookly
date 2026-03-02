export function SkeletonCard({ children, className = '' }) {
    return (
        <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
            {children}
        </div>
    );
}
