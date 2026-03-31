const express = require('express');
const router = express.Router();
const { getAllSalons, getSalonById, getDistinctSalonTypes, getTopRatedSalons, getServicesBySalonId } = require('../sql/salonQueries.js');
const { getProvidersBySalonId } = require('../sql/providerQueries.js');
const { getServicesByProviderId } = require('../sql/serviceQueries.js');
const { getSalonSuggestions, getTypeSuggestions, searchSalonsByName, getRecentReviews, getRecommendedSalons } = require('../sql/searchQueries.js');
const locationService = require('../services/locationService.js');
const AuthMiddleware = require('./auth/AuthMiddleware.js');

// POST /api/search/nearby — search nearby salons by coordinates or place name
router.post('/nearby', async (request, response) => {
    try {
        let { latitude, longitude, place, radius_km, service_name } = request.body;

        // Alapértelmezett távolság 50 km, ha nincs megadva
        const radius = radius_km || 50;

        // Ha helynév meg van adva, de koordináták nincsenek, akkor geokódoljuk a helyet
        if (place && !latitude && !longitude) {
            try {
                const coords = await locationService.placeToCoordinate(place);
                latitude = coords.latitude;
                longitude = coords.longitude;
            } catch (geocodeError) {
                console.error(`Geocoding failed for place: "${place}"`, geocodeError.message);
                return response.status(400).json({
                    success: false,
                    message: 'Ez a hely nem talalhato',
                    error: geocodeError.message
                });
            }
        }

        // koordináták ellenőrzése
        if (!latitude || !longitude) {
            return response.status(400).json({
                success: false,
                message: 'koordinatak (latitude, longitude) vagy helynev szukseges a kereseshez'
            });
        }

        // koordináták érvényességének ellenőrzése
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return response.status(400).json({
                success: false,
                message: 'Ervenytelen koordinatak megadva'
            });
        }

        // Szalonok lekérése az adatbázisból
        const allSalons = await getAllSalons();

        // Közeli szalonok keresése
        const nearbySalons = locationService.findNearbySalons(
            allSalons,
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(radius)
        );

        // Szalonok részleteinek lekérése (szolgáltatások és szolgáltatók)
        const salonsWithDetails = await Promise.all(
            nearbySalons.map(async (salon) => {
                const providers = await getProvidersBySalonId(salon.id);
                const services = await getServicesBySalonId(salon.id);

                return {
                    ...salon,
                    providers,
                    services
                };
            })
        );

        // Szűrés szolgáltatás neve vagy szalon típusa alapján, ha meg van adva
        let filteredSalons = salonsWithDetails;
        if (service_name) {
            const searchTerm = service_name.toLowerCase().trim();
            filteredSalons = salonsWithDetails.filter((salon) => {
                // Check if salon type matches
                const typeMatches = salon.type && salon.type.toLowerCase().includes(searchTerm);
                
                // Check if any service name matches
                const serviceMatches = salon.services.some(
                    (service) =>
                        service.name.toLowerCase().includes(searchTerm) ||
                        (service.description &&
                            service.description.toLowerCase().includes(searchTerm))
                );
                
                return typeMatches || serviceMatches;
            });
        }

        return response.status(200).json({
            success: true,
            search_location: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            },
            radius_km: parseFloat(radius),
            service_filter: service_name || null,
            results_count: filteredSalons.length,
            salons: filteredSalons
        });
    } catch (error) {
        console.error('Search nearby error:', error);
        return response.status(500).json({
            success: false,
            message: 'problema merult fel a kozeli szalonok keresese soran',
            error: error.message
        });
    }
});

// POST /api/search/geocode — convert place name to coordinates
router.post('/geocode', async (request, response) => {
    try {
        const { place } = request.body;

        if (!place) {
            return response.status(400).json({
                success: false,
                message: 'helynev szukseges a geokodolashoz'
            });
        }

        const coordinates = await locationService.placeToCoordinate(place);

        return response.status(200).json({
            success: true,
            place: place,
            coordinates: coordinates
        });
    } catch (error) {
        console.error('Geocode error:', error);
        return response.status(400).json({
            success: false,
            message: 'problema merult fel a hely geokodolasa soran',
            error: error.message
        });
    }
});

// GET /api/search/types — get all distinct salon types for filter dropdown
router.get('/types', async (request, response) => {
    try {
        const types = await getDistinctSalonTypes();
        
        return response.status(200).json({
            success: true,
            types: types
        });
    } catch (error) {
        console.error('Get types error:', error);
        return response.status(500).json({
            success: false,
            message: 'problema merult fel a salon tipusok lekerese soran',
            error: error.message
        });
    }
});

// GET /api/search/top-rated — get top-rated salons with providers
router.get('/top-rated', async (request, response) => {
    try {
        const limit = parseInt(request.query.limit) || 10;
        const salons = await getTopRatedSalons(limit);
        
        // Get providers for each salon
        const salonsWithProviders = await Promise.all(
            salons.map(async (salon) => {
                const providers = await getProvidersBySalonId(salon.id);
                return {
                    ...salon,
                    providers
                };
            })
        );
        
        return response.status(200).json({
            success: true,
            salons: salonsWithProviders
        });
    } catch (error) {
        console.error('Get top-rated salons error:', error);
        return response.status(500).json({
            success: false,
            message: 'problema merult fel a legjobb szalonok lekerese soran',
            error: error.message
        });
    }
});

// GET /api/search/suggestions — autocomplete suggestions for salon/type search
router.get('/suggestions', async (request, response) => {
    try {
        const { query } = request.query;

        if (!query || query.trim().length < 2) {
            return response.status(200).json({
                success: true,
                salons: [],
                serviceTypes: []
            });
        }

        const searchTerm = query.trim().toLowerCase();

        // Get matching salon names
        const salons = await getSalonSuggestions(searchTerm);

        // Get matching service types
        const serviceTypes = await getTypeSuggestions(searchTerm);

        return response.status(200).json({
            success: true,
            salons: salons,
            serviceTypes: serviceTypes
        });
    } catch (error) {
        console.error('Get suggestions error:', error);
        return response.status(500).json({
            success: false,
            message: 'problema merult fel a javaslatok lekerese soran',
            error: error.message
        });
    }
});

// GET /api/search/salon/:id — get salon details with providers and services
router.get('/salon/:id', async (request, response) => {
    try {
        const salonId = parseInt(request.params.id);
        
        if (!salonId) {
            return response.status(400).json({
                success: false,
                message: 'Salon ID szukseges'
            });
        }
        
        // Get salon details
        const salon = await getSalonById(salonId);
        
        if (!salon) {
            return response.status(404).json({
                success: false,
                message: 'Salon nem talalhato'
            });
        }
        
        // Get providers for the salon
        const providers = await getProvidersBySalonId(salonId);
        
        // Get services for each provider
        const providersWithServices = await Promise.all(
            providers.map(async (provider) => {
                const services = await getServicesByProviderId(provider.id);
                return {
                    ...provider,
                    services
                };
            })
        );
        
        // Get salon services
        const services = await getServicesBySalonId(salonId);
        
        return response.status(200).json({
            success: true,
            salon: {
                ...salon,
                providers: providersWithServices,
                services
            }
        });
    } catch (error) {
        console.error('Get salon details error:', error);
        return response.status(500).json({
            success: false,
            message: 'problema merult fel a salon reszleteinek lekerese soran',
            error: error.message
        });
    }
});

// GET /api/search/by-name — search salons by name/type without location
router.get('/by-name', async (request, response) => {
    try {
        const { query, service_type } = request.query;

        // Build WHERE conditions dynamically
        let whereConditions = ['s.status = ?'];
        let queryParams = ['open'];

        if (query) {
            whereConditions.push('LOWER(s.name) LIKE ?');
            queryParams.push(`%${query.trim().toLowerCase()}%`);
        }

        if (service_type) {
            whereConditions.push('s.type = ?');
            queryParams.push(service_type);
        }

        const salons = await searchSalonsByName(whereConditions, queryParams);

        // Get providers for each salon
        const salonsWithProviders = await Promise.all(
            salons.map(async (salon) => {
                const providers = await getProvidersBySalonId(salon.id);
                const services = await getServicesBySalonId(salon.id);
                return {
                    ...salon,
                    providers,
                    services
                };
            })
        );

        return response.status(200).json({
            success: true,
            results_count: salonsWithProviders.length,
            salons: salonsWithProviders
        });
    } catch (error) {
        console.error('Search by name error:', error);
        return response.status(500).json({
            success: false,
            message: 'probléma merült fel a szalonok név szerinti keresése során',
            error: error.message
        });
    }
});

// GET /api/search/recent-reviews — get recent reviews for overview page
router.get('/recent-reviews', async (request, response) => {
    try {
        const limit = parseInt(request.query.limit) || 8;
        
        const reviews = await getRecentReviews(limit);
        
        return response.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error('Get recent reviews error:', error);
        return response.status(500).json({
            success: false,
            message: 'Hiba a legutóbbi értékelések lekérése során',
            error: error.message
        });
    }
});

// GET /api/search/address-autocomplete — autocomplete address from Nominatim
router.get('/address-autocomplete', async (request, response) => {
    try {
        const { q } = request.query;

        if (!q || q.trim().length < 3) {
            return response.status(200).json({
                success: true,
                suggestions: []
            });
        }

        const suggestions = await locationService.addressAutocomplete(q.trim());

        return response.status(200).json({
            success: true,
            suggestions
        });
    } catch (error) {
        console.error('Address autocomplete error:', error);
        return response.status(500).json({
            success: false,
            message: 'Hiba a cím keresés során',
            error: error.message
        });
    }
});

// POST /api/search/reverse-geocode — convert coordinates to address
router.post('/reverse-geocode', async (request, response) => {
    try {
        const { latitude, longitude } = request.body;

        if (latitude == null || longitude == null) {
            return response.status(400).json({
                success: false,
                message: 'Koordináták (latitude, longitude) szükségesek'
            });
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return response.status(400).json({
                success: false,
                message: 'Érvénytelen koordináták'
            });
        }

        const result = await locationService.coordinateToPlace(latitude, longitude);

        return response.status(200).json({
            success: true,
            address: result.address,
            display_name: result.display_name,
            latitude: result.latitude,
            longitude: result.longitude
        });
    } catch (error) {
        console.error('Reverse geocode error:', error);
        return response.status(400).json({
            success: false,
            message: 'Hiba a fordított geokódolás során',
            error: error.message
        });
    }
});

// GET /api/search/recommendations — get personalized salon recommendations
router.get('/recommendations', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;
        const { lat, lng, limit = 8 } = request.query;
        if (!lat || !lng) {
            return response.status(400).json({ success: false, message: 'Location required' });
        }
        const salons = await getRecommendedSalons(userId, parseFloat(lat), parseFloat(lng), parseInt(limit));

        const salonsWithProviders = await Promise.all(
            salons.map(async (salon) => {
                const providers = await getProvidersBySalonId(salon.id);
                return {
                    ...salon,
                    providers,
                    average_rating: salon.avg_rating,
                    distance: salon.distance_km !== undefined ? Math.round(salon.distance_km * 10) / 10 : null,
                };
            })
        );

        return response.status(200).json({ success: true, data: { salons: salonsWithProviders } });
    } catch (error) {
        console.error('Get recommendations error:', error);
        return response.status(500).json({ success: false, message: 'Error fetching recommendations', error: error.message });
    }
});

module.exports = router;
