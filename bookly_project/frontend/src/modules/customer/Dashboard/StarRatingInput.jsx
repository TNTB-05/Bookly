import { useState } from 'react';

// Interaktív csillag értékelő komponens
export default function StarRatingInput({ value = 0, onChange, label, size = 'text-2xl' }) {
    const [hoverValue, setHoverValue] = useState(0);

    return (
        <div>
            {label && <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>}
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHoverValue(star)}
                        onMouseLeave={() => setHoverValue(0)}
                        className={`${size} transition-colors cursor-pointer select-none ${
                            star <= (hoverValue || value)
                                ? 'text-amber-400'
                                : 'text-gray-300'
                        } hover:scale-110 transition-transform`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    );
}
