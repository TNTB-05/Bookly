import { SkeletonBlock } from './SkeletonBlock';

export function SkeletonStat({ className = '' }) {
    return (
        <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
            <SkeletonBlock className="h-3 w-24 mb-3" />
            <SkeletonBlock className="h-8 w-16 mb-2" />
            <SkeletonBlock className="h-3 w-32" />
        </div>
    );
}
