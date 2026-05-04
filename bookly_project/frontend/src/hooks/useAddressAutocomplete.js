import { useState, useRef, useCallback } from 'react';
import { API_URL } from '../config';

/**
 * Format a raw Nominatim suggestion into a short Hungarian address string.
 * Returns { shortAddress, lat, lon }.
 */
export function formatSuggestion(suggestion) {
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

    return {
        shortAddress,
        lat: suggestion.lat,
        lon: suggestion.lon,
    };
}

/**
 * Reusable hook for OpenStreetMap (Nominatim) address autocomplete.
 *
 * @param {Object} options
 * @param {string} [options.apiUrl] - Backend base URL
 * @param {number} [options.debounceMs] - Debounce delay in ms (default: 400)
 * @param {number} [options.minLength] - Minimum query length to trigger fetch (default: 3)
 *
 * @returns {{
 *   suggestions: Array,
 *   showSuggestions: boolean,
 *   loading: boolean,
 *   fetchSuggestions: (query: string) => void,
 *   clearSuggestions: () => void,
 *   setShowSuggestions: (v: boolean) => void,
 *   debouncedFetch: (query: string) => void,
 *   formatSuggestion: (suggestion: object) => { shortAddress: string, lat: string, lon: string }
 * }}
 */
export function useAddressAutocomplete({
    apiUrl = API_URL,
    debounceMs = 400,
    minLength = 3,
} = {}) {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceTimerRef = useRef(null);

    // Direct fetch (no debounce) — used by debouncedFetch or called directly
    const fetchSuggestions = useCallback(
        async (query) => {
            if (!query || query.trim().length < minLength) {
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

                if (data.success && data.suggestions?.length > 0) {
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
        },
        [apiUrl, minLength]
    );

    // Debounced wrapper — call this on every keystroke
    const debouncedFetch = useCallback(
        (query) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                fetchSuggestions(query);
            }, debounceMs);
        },
        [fetchSuggestions, debounceMs]
    );

    function clearSuggestions() {
        setSuggestions([]);
        setShowSuggestions(false);
    }

    return {
        suggestions,
        showSuggestions,
        setShowSuggestions,
        loading,
        fetchSuggestions,
        debouncedFetch,
        clearSuggestions,
        formatSuggestion,
    };
}
