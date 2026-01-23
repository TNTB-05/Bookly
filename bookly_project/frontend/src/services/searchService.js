const API_BASE_URL = 'http://localhost:3000';

/**
 * Search for salons and providers based on various criteria
 * 
 * Case 1: Salon name only → Show salons (no location check)
 * Case 2: Service type only → Show salons with that service (no location check)
 * Case 3: Location only → Show salons nearby with distance
 * Case 4: Salon name + service type → Show salons matching both (no location check)
 * Case 5: Location + (salon name OR service type) → Show salons nearby with filters
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.searchQuery - Text search for salon name
 * @param {string} params.locationSearch - Location text (e.g., "Budapest")
 * @param {string} params.serviceFilter - Service type filter (e.g., "hajvágás", "all")
 * @param {Object} params.userLocation - User's GPS coordinates {latitude, longitude}
 * @returns {Promise<Object>} - { results: Array, type: 'salons' | 'providers' }
 */
export async function searchSalonsAndProviders({ searchQuery, locationSearch, serviceFilter, userLocation }) {
    const hasSearchQuery = searchQuery && searchQuery.trim() !== '';
    const hasLocation = (locationSearch && locationSearch.trim() !== '') || userLocation;
    const hasServiceFilter = serviceFilter && serviceFilter !== 'all';

    console.log('Search params:', { hasSearchQuery, hasLocation, hasServiceFilter, searchQuery, locationSearch, serviceFilter });

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

            console.log('Case 3/5: Location search with:', requestBody);

            const response = await fetch(`${API_BASE_URL}/api/search/nearby`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log('Location search response:', data);

            if (data.success) {
                let salons = data.salons;

                // Additional filter by salon name if provided (Case 5)
                if (hasSearchQuery) {
                    const searchLower = searchQuery.toLowerCase();
                    salons = salons.filter((salon) => 
                        salon.name.toLowerCase().includes(searchLower)
                    );
                }

                // Return salons with distance info
                return {
                    type: 'salons',
                    results: salons.map((salon) => ({
                        id: salon.id,
                        name: salon.name,
                        address: salon.address,
                        description: salon.description,
                        distance: salon.distance,
                        providers: salon.providers,
                        services: salon.services
                    }))
                };
            } else {
                console.error('Search failed:', data.message);
                return { type: 'salons', results: [] };
            }
        }

        // ==========================================
        // CASE 1, 2, 4: No location - search all salons
        // ==========================================
        if (hasSearchQuery || hasServiceFilter) {
            // Fetch all salons (using Budapest with large radius as workaround)
            const requestBody = {
                place: 'Budapest, Hungary',
                radius_km: 100 // Large radius to get all salons
            };

            // Add service filter if selected (Case 2 & 4)
            if (hasServiceFilter) {
                requestBody.service_name = serviceFilter;
            }

            console.log('Case 1/2/4: Name/service search with:', requestBody);

            const response = await fetch(`${API_BASE_URL}/api/search/nearby`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log('Name/service search response:', data);

            if (data.success) {
                let salons = data.salons;

                // Filter by salon name if provided (Case 1 & 4)
                if (hasSearchQuery) {
                    const searchLower = searchQuery.toLowerCase();
                    salons = salons.filter((salon) => 
                        salon.name.toLowerCase().includes(searchLower)
                    );
                }

                // Return salons without distance (or set distance to null)
                return {
                    type: 'salons',
                    results: salons.map((salon) => ({
                        id: salon.id,
                        name: salon.name,
                        address: salon.address,
                        description: salon.description,
                        distance: null, // No distance when not searching by location
                        providers: salon.providers,
                        services: salon.services
                    }))
                };
            } else {
                console.error('Search failed:', data.message);
                return { type: 'salons', results: [] };
            }
        }

        // ==========================================
        // No filters - return empty (user should enter something)
        // ==========================================
        console.log('No filters applied');
        return { type: 'salons', results: [] };

    } catch (error) {
        console.error('Search error:', error);
        return { type: 'salons', results: [] };
    }
}
