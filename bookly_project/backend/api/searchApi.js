const express = require('express');
const router = express.Router();
const { getAllSalons, getSalonById, getDistinctSalonTypes, getTopRatedSalons, getServicesBySalonId } = require('../sql/salonQueries.js');
const { getProvidersBySalonId } = require('../sql/providerQueries.js');
const { getServicesByProviderId } = require('../sql/serviceQueries.js');
const { getSalonSuggestions, getTypeSuggestions, searchSalonsByName, getRecentReviews, getRecommendedSalons } = require('../sql/searchQueries.js');
const locationService = require('../services/locationService.js');
const AuthMiddleware = require('./auth/AuthMiddleware.js');

// Közeli szalonok keresése koordináták vagy helynév alapján
router.post('/nearby', async (req, res) => {
    try {
        let { latitude, longitude, place, radius_km, service_name } = req.body;

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
                return res.status(400).json({
                    success: false,
                    message: 'Ez a hely nem talalhato',
                    error: geocodeError.message
                });
            }
        }

        // koordináták ellenőrzése
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'koordinatak (latitude, longitude) vagy helynev szukseges a kereseshez'
            });
        }

        // koordináták érvényességének ellenőrzése
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
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

        return res.status(200).json({
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
        return res.status(500).json({
            success: false,
            message: 'problema merult fel a kozeli szalonok keresese soran',
            error: error.message
        });
    }
});

// Helynév geokódolása koordinátákká
router.post('/geocode', async (req, res) => {
    try {
        const { place } = req.body;

        if (!place) {
            return res.status(400).json({
                success: false,
                message: 'helynev szukseges a geokodolashoz'
            });
        }

        const coordinates = await locationService.placeToCoordinate(place);

        return res.status(200).json({
            success: true,
            place: place,
            coordinates: coordinates
        });
    } catch (error) {
        console.error('Geocode error:', error);
        return res.status(400).json({
            success: false,
            message: 'problema merult fel a hely geokodolasa soran',
            error: error.message
        });
    }
});

// Get distinct salon types
router.get('/types', async (req, res) => {
    try {
        const types = await getDistinctSalonTypes();
        
        return res.status(200).json({
            success: true,
            types: types
        });
    } catch (error) {
        console.error('Get types error:', error);
        return res.status(500).json({
            success: false,
            message: 'problema merult fel a salon tipusok lekerese soran',
            error: error.message
        });
    }
});

// Get top-rated salons
router.get('/top-rated', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
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
        
        return res.status(200).json({
            success: true,
            salons: salonsWithProviders
        });
    } catch (error) {
        console.error('Get top-rated salons error:', error);
        return res.status(500).json({
            success: false,
            message: 'problema merult fel a legjobb szalonok lekerese soran',
            error: error.message
        });
    }
});

// Get search suggestions for autocomplete
router.get('/suggestions', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(200).json({
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

        return res.status(200).json({
            success: true,
            salons: salons,
            serviceTypes: serviceTypes
        });
    } catch (error) {
        console.error('Get suggestions error:', error);
        return res.status(500).json({
            success: false,
            message: 'problema merult fel a javaslatok lekerese soran',
            error: error.message
        });
    }
});

// Get salon details with providers and services
router.get('/salon/:id', async (req, res) => {
    try {
        const salonId = parseInt(req.params.id);
        
        if (!salonId) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID szukseges'
            });
        }
        
        // Get salon details
        const salon = await getSalonById(salonId);
        
        if (!salon) {
            return res.status(404).json({
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
        
        return res.status(200).json({
            success: true,
            salon: {
                ...salon,
                providers: providersWithServices,
                services
            }
        });
    } catch (error) {
        console.error('Get salon details error:', error);
        return res.status(500).json({
            success: false,
            message: 'problema merult fel a salon reszleteinek lekerese soran',
            error: error.message
        });
    }
});

// Search salons by name without location requirement
router.get('/by-name', async (req, res) => {
    try {
        const { query, service_type } = req.query;

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

        return res.status(200).json({
            success: true,
            results_count: salonsWithProviders.length,
            salons: salonsWithProviders
        });
    } catch (error) {
        console.error('Search by name error:', error);
        return res.status(500).json({
            success: false,
            message: 'probléma merült fel a szalonok név szerinti keresése során',
            error: error.message
        });
    }
});

// Get recent reviews for the overview page
router.get('/recent-reviews', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        
        const reviews = await getRecentReviews(limit);
        
        return res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error('Get recent reviews error:', error);
        return res.status(500).json({
            success: false,
            message: 'Hiba a legutóbbi értékelések lekérése során',
            error: error.message
        });
    }
});

// Address autocomplete using Nominatim
router.get('/address-autocomplete', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 3) {
            return res.status(200).json({
                success: true,
                suggestions: []
            });
        }

        const suggestions = await locationService.addressAutocomplete(q.trim());

        return res.status(200).json({
            success: true,
            suggestions
        });
    } catch (error) {
        console.error('Address autocomplete error:', error);
        return res.status(500).json({
            success: false,
            message: 'Hiba a cím keresés során',
            error: error.message
        });
    }
});

// Reverse geocode: coordinates to address
router.post('/reverse-geocode', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (latitude == null || longitude == null) {
            return res.status(400).json({
                success: false,
                message: 'Koordináták (latitude, longitude) szükségesek'
            });
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: 'Érvénytelen koordináták'
            });
        }

        const result = await locationService.coordinateToPlace(latitude, longitude);

        return res.status(200).json({
            success: true,
            address: result.address,
            display_name: result.display_name,
            latitude: result.latitude,
            longitude: result.longitude
        });
    } catch (error) {
        console.error('Reverse geocode error:', error);
        return res.status(400).json({
            success: false,
            message: 'Hiba a fordított geokódolás során',
            error: error.message
        });
    }
});

// Get personalized salon recommendations
router.get('/recommendations', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { lat, lng, limit = 8 } = req.query;
        if (!lat || !lng) {
            return res.json({ success: false, message: 'Location required' });
        }
        const salons = await getRecommendedSalons(userId, parseFloat(lat), parseFloat(lng), parseInt(limit));
        res.json({ success: true, data: { salons } });
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ success: false, message: 'Error fetching recommendations', error: error.message });
    }
});

module.exports = router;
