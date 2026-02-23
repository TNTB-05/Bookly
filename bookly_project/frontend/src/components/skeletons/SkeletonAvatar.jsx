import { SkeletonBlock } from './SkeletonBlock';

export function SkeletonAvatar({ size = 'md' }) {
    const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' };
    return <SkeletonBlock className={`${sizes[size]} rounded-full shrink-0`} />;
}
