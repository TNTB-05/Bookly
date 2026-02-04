import { useEffect, useRef } from 'react';
import SearchIcon from '../../../../icons/SearchIcon';
import ServicesIcon from '../../../../icons/ServicesIcon';

export default function SearchSuggestions({ 
    suggestions, 
    onSelectSalon, 
    onSelectServiceType, 
    onClose,
    isVisible 
}) {
    const suggestionsRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                onClose();
            }
        }

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isVisible, onClose]);

    // Handle keyboard navigation
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const hasSalons = suggestions.salons && suggestions.salons.length > 0;
    const hasServiceTypes = suggestions.serviceTypes && suggestions.serviceTypes.length > 0;

    if (!hasSalons && !hasServiceTypes) return null;

    return (
        <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto"
        >
            {/* Salon Suggestions */}
            {hasSalons && (
                <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                        Szalonok
                    </div>
                    {suggestions.salons.map((salon) => (
                        <button
                            key={`salon-${salon.id}`}
                            onClick={() => onSelectSalon(salon)}
                            className="w-full px-4 py-3 flex items-start hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="mt-0.5 mr-3 text-gray-400">
                                <SearchIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                    {salon.name}
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                    {salon.address}
                                </div>
                                {salon.type && (
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {salon.type}
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Service Type Suggestions */}
            {hasServiceTypes && (
                <div className={`py-2 ${hasSalons ? 'border-t border-gray-200' : ''}`}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                        Szolgáltatás típusok
                    </div>
                    {suggestions.serviceTypes.map((type, index) => (
                        <button
                            key={`type-${index}`}
                            onClick={() => onSelectServiceType(type)}
                            className="w-full px-4 py-3 flex items-center hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="mr-3 text-gray-400">
                                <ServicesIcon className="w-5 h-5" />
                            </div>
                            <div className="font-medium text-gray-900 capitalize">
                                {type}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
