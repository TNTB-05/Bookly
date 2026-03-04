const API_BASE_URL = 'http://localhost:3000';

/**
 * Search for salons based on various criteria
 * 
 * Case 1: Salon name only → Show salons (no location check)
 * Case 2: Service type only → Show salons with that service (no location check)
 * Case 3: Location only → Show salons nearby with distance
 * Case 4: Salon name + service type → Show salons matching both (no location check)
 * Case 5: Location + (salon name OR service type) → Show salons nearby with filters
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.searchQuery - Text search for salon name
 * @param {string} params.locationSearch - Location text (e.g., "Budapest, Istvánmezei út 3, 1146")
 * @param {string} params.serviceFilter - Service type filter (e.g., "fodrász", "all")
 * @param {Object} params.userLocation - User's GPS coordinates {latitude, longitude}
 * @returns {Promise<{salons: Array, resolvedLocation: Object|null}>} - Salons + resolved coordinates (if geocoded)
 */
export async function searchSalons({ searchQuery, locationSearch, serviceFilter, userLocation }) {
    const hasSearchQuery = searchQuery && searchQuery.trim() !== '';
    const hasLocation = (locationSearch && locationSearch.trim() !== '') || userLocation;
    const hasServiceFilter = serviceFilter && serviceFilter !== 'all';

    try {
        // ==========================================
        // CASE 3 & 5: Location-based search (with distance check)
        // ==========================================
        if (hasLocation) {
            const requestBody = {
                radius_km: 30
            };

            // Set location
            if (userLocation) {
                requestBody.latitude = userLocation.latitude;
                requestBody.longitude = userLocation.longitude;
            } else {
                requestBody.place = locationSearch.trim();
            }

            // Add service filter if selected
            if (hasServiceFilter) {
                requestBody.service_name = serviceFilter;
            }

            const response = await fetch(`${API_BASE_URL}/api/search/nearby`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.success) {
                let salons = data.salons;

                // Additional filter by salon name if provided (Case 5)
                if (hasSearchQuery) {
                    const searchLower = searchQuery.toLowerCase();
                    salons = salons.filter((salon) => 
                        salon.name.toLowerCase().includes(searchLower)
                    );
                }

                // Extract resolved coordinates (backend geocodes place name)
                const resolvedLocation = data.search_location
                    ? { latitude: data.search_location.latitude, longitude: data.search_location.longitude }
                    : null;

                // Return salons with distance info + resolved location
                return {
                    salons: salons.map((salon) => ({
                        id: salon.id,
                        name: salon.name,
                        address: salon.address,
                        description: salon.description,
                        distance: salon.distance,
                        latitude: salon.latitude,
                        longitude: salon.longitude,
                        type: salon.type,
                        phone: salon.phone,
                        email: salon.email,
                        opening_hours: salon.opening_hours,
                        closing_hours: salon.closing_hours,
                        average_rating: salon.average_rating,
                        rating_count: salon.rating_count,
                        banner_color: salon.banner_color,
                        logo_url: salon.logo_url,
                        banner_image_url: salon.banner_image_url,
                        providers: salon.providers,
                        services: salon.services
                    })),
                    resolvedLocation
                };
            } else {
                console.error('Search failed:', data.message);
                return { salons: [], resolvedLocation: null };
            }
        }

        // ==========================================
        // CASE 1, 2, 4: No location - search all salons
        // ==========================================
        if (hasSearchQuery || hasServiceFilter) {
            // Use direct name/type search endpoint (no location required)
            const params = new URLSearchParams();
            
            if (hasSearchQuery) {
                params.append('query', searchQuery.trim());
            }
            if (hasServiceFilter) {
                params.append('service_type', serviceFilter);
            }

            const response = await fetch(`${API_BASE_URL}/api/search/by-name?${params.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                // Return salons without distance info (backend already filtered by both query and service_type)
                return {
                    salons: data.salons.map((salon) => ({
                        id: salon.id,
                        name: salon.name,
                        address: salon.address,
                        description: salon.description,
                        distance: null,
                        latitude: salon.latitude,
                        longitude: salon.longitude,
                        type: salon.type,
                        phone: salon.phone,
                        email: salon.email,
                        opening_hours: salon.opening_hours,
                        closing_hours: salon.closing_hours,
                        average_rating: salon.average_rating,
                        rating_count: salon.rating_count,
                        banner_color: salon.banner_color,
                        logo_url: salon.logo_url,
                        banner_image_url: salon.banner_image_url,
                        providers: salon.providers,
                        services: salon.services
                    })),
                    resolvedLocation: null
                };
            } else {
                console.error('Search failed:', data.message);
                return { salons: [], resolvedLocation: null };
            }
        }

        // ==========================================
        // No filters - return empty (user should enter something)
        // ==========================================
        return { salons: [], resolvedLocation: null };

    } catch (error) {
        console.error('Search error:', error);
        return { salons: [], resolvedLocation: null };
    }
}

/**
 * Get search suggestions for autocomplete
 * @param {string} query - Search query (minimum 2 characters)
 * @returns {Promise<Object>} - Object with salons and serviceTypes arrays
 */
export async function getSuggestions(query) {
    if (!query || query.trim().length < 2) {
        return { salons: [], serviceTypes: [] };
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/search/suggestions?query=${encodeURIComponent(query.trim())}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const data = await response.json();

        if (data.success) {
            return {
                salons: data.salons || [],
                serviceTypes: data.serviceTypes || []
            };
        } else {
            console.error('Get suggestions failed:', data.message);
            return { salons: [], serviceTypes: [] };
        }
    } catch (error) {
        console.error('Get suggestions error:', error);
        return { salons: [], serviceTypes: [] };
    }
}
