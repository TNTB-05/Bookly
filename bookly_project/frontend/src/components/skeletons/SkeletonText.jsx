import { SkeletonBlock } from './SkeletonBlock';

export function SkeletonText({ lines = 1, className = '' }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array(lines).fill(0).map((_, i) => (
                <SkeletonBlock key={i} className={`h-3 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`} />
            ))}
        </div>
    );
}
