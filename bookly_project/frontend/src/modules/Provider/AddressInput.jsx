import { useState, useEffect, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import BaseMap from '../../components/BaseMap';
import TickIcon from '../../icons/TickIcon';
import { useAddressAutocomplete, formatSuggestion } from '../../hooks/useAddressAutocomplete';
import { API_URL } from '../../config';

// Component to recenter the map when position changes
function MapRecenter({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], 16, { animate: true });
        }
    }, [lat, lng, map]);
    return null;
}

// Draggable marker — uses the global default icon patched in BaseMap
function DraggableMarker({ position, onDragEnd }) {
    const markerRef = useRef(null);

    const eventHandlers = {
        dragend() {
            const marker = markerRef.current;
            if (marker) {
                const { lat, lng } = marker.getLatLng();
                onDragEnd(lat, lng);
            }
        },
    };

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        />
    );
}

export default function AddressInput({
    initialAddress = '',
    initialLat = null,
    initialLng = null,
    onChange,
    disabled = false,
    required = false,
    className = ''
}) {
    const apiUrl = API_URL;

    const [inputValue, setInputValue] = useState(initialAddress);
    const [selectedLat, setSelectedLat] = useState(initialLat);
    const [selectedLng, setSelectedLng] = useState(initialLng);
    const [isValidated, setIsValidated] = useState(!!(initialLat && initialLng));
    const [reverseLoading, setReverseLoading] = useState(false);

    // Address autocomplete via shared hook
    const {
        suggestions,
        showSuggestions,
        setShowSuggestions,
        loading,
        debouncedFetch,
        clearSuggestions,
    } = useAddressAutocomplete({ apiUrl });

    const containerRef = useRef(null);

    // Default center: Budapest
    const defaultCenter = [47.4979, 19.0402];

    // Sync with initial props when they change (e.g. SalonManagement loading data)
    useEffect(() => {
        if (initialAddress && initialAddress !== inputValue) {
            setInputValue(initialAddress);
        }
        if (initialLat && initialLng) {
            setSelectedLat(initialLat);
            setSelectedLng(initialLng);
            setIsValidated(true);
        }
    }, [initialAddress, initialLat, initialLng]);

    // Close suggestions on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle input change with debounce (uses hook)
    function handleInputChange(e) {
        const value = e.target.value;
        setInputValue(value);
        setIsValidated(false);
        debouncedFetch(value);
    }

    // Handle suggestion selection
    function handleSelectSuggestion(suggestion) {
        const { shortAddress, lat, lon } = formatSuggestion(suggestion);

        setInputValue(shortAddress);
        setSelectedLat(lat);
        setSelectedLng(lon);
        setIsValidated(true);
        clearSuggestions();

        if (onChange) {
            onChange(shortAddress, lat, lon);
        }
    }

    // Handle marker drag end — reverse geocode new position
    async function handleMarkerDragEnd(lat, lng) {
        setSelectedLat(lat);
        setSelectedLng(lng);
        setReverseLoading(true);

        try {
            const response = await fetch(`${apiUrl}/api/search/reverse-geocode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude: lat, longitude: lng })
            });
            const data = await response.json();

            if (data.success) {
                setInputValue(data.address);
                setIsValidated(true);
                if (onChange) {
                    onChange(data.address, lat, lng);
                }
            }
        } catch (error) {
            console.error('Reverse geocode error:', error);
        } finally {
            setReverseLoading(false);
        }
    }

    const mapCenter = (selectedLat && selectedLng) ? [selectedLat, selectedLng] : defaultCenter;

    return (
        <div ref={containerRef} className={`space-y-3 ${className}`}>
            {/* Address input with autocomplete */}
            <div className="relative z-20">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder="Kezdd el beírni a címet..."
                    disabled={disabled}
                    className={`w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                             text-gray-900 placeholder-gray-500 transition-all
                             ${isValidated ? 'border-green-400' : 'border-white/50'}
                             ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />

                {/* Loading indicator */}
                {(loading || reverseLoading) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                )}

                {/* Validated checkmark */}
                {isValidated && !loading && !reverseLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                        <TickIcon className="w-5 h-5" />
                    </div>
                )}

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion, index) => {
                            // Format short display
                            const addr = suggestion.address;
                            const city = addr?.city || addr?.town || addr?.village || '';
                            const street = addr?.road || '';
                            const houseNumber = addr?.house_number || '';
                            const postalCode = addr?.postcode || '';

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(suggestion)}
                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                    <p className="text-sm font-medium text-gray-900">
                                        {[city, street && (houseNumber ? `${street} ${houseNumber}` : street), postalCode].filter(Boolean).join(', ') || suggestion.display_name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {suggestion.display_name}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Validation hint */}
            {required && inputValue && !isValidated && (
                <p className="text-xs text-amber-600">
                    Válassz egy címet a legördülő listából a pontos helymeghatározáshoz
                </p>
            )}

            {/* Map */}
            <BaseMap
                center={mapCenter}
                zoom={selectedLat ? 16 : 7}
                height="280px"
                className="relative z-10 rounded-xl border-2 border-white/50 shadow-sm"
            >
                {selectedLat && selectedLng && (
                    <>
                        <MapRecenter lat={selectedLat} lng={selectedLng} />
                        <DraggableMarker
                            position={[selectedLat, selectedLng]}
                            onDragEnd={handleMarkerDragEnd}
                        />
                    </>
                )}
            </BaseMap>
            
            <p className="text-xs text-gray-500">
                💡 Húzd a jelölőt a térképen a pontos hely megadásához
            </p>
        </div>
    );
}
