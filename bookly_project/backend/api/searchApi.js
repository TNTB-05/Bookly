const express = require('express');
const router = express.Router();
const database = require('../sql/database.js');
const locationService = require('../services/locationService.js');

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
        const allSalons = await database.getAllSalons();

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
                const providers = await database.getProvidersBySalonId(salon.id);
                const services = await database.getServicesBySalonId(salon.id);

                return {
                    ...salon,
                    providers,
                    services
                };
            })
        );

        // Szűrés szolgáltatás neve alapján, ha meg van adva
        let filteredSalons = salonsWithDetails;
        if (service_name) {
            const searchTerm = service_name.toLowerCase().trim();
            filteredSalons = salonsWithDetails.filter((salon) => {
                return salon.services.some(
                    (service) =>
                        service.name.toLowerCase().includes(searchTerm) ||
                        (service.description &&
                            service.description.toLowerCase().includes(searchTerm))
                );
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
            message: 'problem merult fel a kozeli szalonok keresese soran',
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
            message: 'problem merult fel a hely geokodolasa soran',
            error: error.message
        });
    }
});

module.exports = router;
