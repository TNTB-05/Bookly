import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet + bundlers
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

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

// Component for draggable marker
function DraggableMarker({ position, onDragEnd }) {
    const markerRef = useRef(null);

    const eventHandlers = {
        dragend() {
            const marker = markerRef.current;
            if (marker) {
                const { lat, lng } = marker.getLatLng();
                onDragEnd(lat, lng);
            }
        }
    };

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={defaultIcon}
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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const [inputValue, setInputValue] = useState(initialAddress);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedLat, setSelectedLat] = useState(initialLat);
    const [selectedLng, setSelectedLng] = useState(initialLng);
    const [isValidated, setIsValidated] = useState(!!(initialLat && initialLng));
    const [loading, setLoading] = useState(false);
    const [reverseLoading, setReverseLoading] = useState(false);

    const containerRef = useRef(null);
    const debounceTimerRef = useRef(null);

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

    // Debounced autocomplete fetch
    const fetchSuggestions = useCallback(async (query) => {
        if (!query || query.trim().length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${apiUrl}/api/search/address-autocomplete?q=${encodeURIComponent(query.trim())}`
            );
            const data = await response.json();

            if (data.success && data.suggestions.length > 0) {
                setSuggestions(data.suggestions);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (error) {
            console.error('Address autocomplete error:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, [apiUrl]);

    // Handle input change with debounce
    function handleInputChange(e) {
        const value = e.target.value;
        setInputValue(value);
        setIsValidated(false);

        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new debounce timer
        debounceTimerRef.current = setTimeout(() => {
            fetchSuggestions(value);
        }, 400);
    }

    // Handle suggestion selection
    function handleSelectSuggestion(suggestion) {
        // Format short address from suggestion
        const addr = suggestion.address;
        const parts = [];
        const city = addr?.city || addr?.town || addr?.village || '';
        if (city) parts.push(city);
        const street = addr?.road || '';
        const houseNumber = addr?.house_number || '';
        if (street) {
            parts.push(houseNumber ? `${street} ${houseNumber}` : street);
        }
        const postalCode = addr?.postcode || '';
        if (postalCode) parts.push(postalCode);

        const shortAddress = parts.length > 0 ? parts.join(', ') : suggestion.display_name;

        setInputValue(shortAddress);
        setSelectedLat(suggestion.lat);
        setSelectedLng(suggestion.lon);
        setIsValidated(true);
        setShowSuggestions(false);
        setSuggestions([]);

        if (onChange) {
            onChange(shortAddress, suggestion.lat, suggestion.lon);
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
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
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

            {/* Leaflet Map */}
            <div className="relative z-10 rounded-xl overflow-hidden border-2 border-white/50 shadow-sm" style={{ height: '280px' }}>
                <MapContainer
                    center={mapCenter}
                    zoom={selectedLat ? 16 : 7}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {selectedLat && selectedLng && (
                        <>
                            <MapRecenter lat={selectedLat} lng={selectedLng} />
                            <DraggableMarker
                                position={[selectedLat, selectedLng]}
                                onDragEnd={handleMarkerDragEnd}
                            />
                        </>
                    )}
                </MapContainer>
            </div>
            
            <p className="text-xs text-gray-500">
                💡 Húzd a jelölőt a térképen a pontos hely megadásához
            </p>
        </div>
    );
}
