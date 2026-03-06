/**
 * Service routes for provider calendar.
 * Covers: CRUD /services, service image management.
 */

const express = require('express');
const router = express.Router();
const { upload, processServiceImage, deleteOldSalonImage } = require('../../middleware/uploadMiddleware');
const {
    getProviderServicesWithImages,
    createService,
    getServiceOwnership,
    updateService,
    deleteService,
    getScheduledAppointmentCountForService,
    getServiceByIdAndProvider,
    getServiceImages,
    getServiceImageCount,
    createServiceImage,
    getServiceImageById,
    deleteServiceImage
} = require('../../sql/serviceQueries');

// Get services for provider
router.get('/', async (request, response) => {
    try {
        const providerId = request.providerId;
        const services = await getProviderServicesWithImages(providerId);

        response.status(200).json({
            success: true,
            services
        });
    } catch (error) {
        console.error('Get services error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a szolgáltatások lekérdezésekor'
        });
    }
});

// Create new service
router.post('/', async (request, response) => {
    try {
        const providerId = request.providerId;
        const { name, description, duration_minutes, price, status } = request.body;

        if (!name || !duration_minutes || !price) {
            return response.status(400).json({
                success: false,
                message: 'Név, időtartam és ár megadása kötelező'
            });
        }

        if (duration_minutes < 5 || duration_minutes > 480) {
            return response.status(400).json({
                success: false,
                message: 'Az időtartam 5 és 480 perc között kell legyen'
            });
        }

        if (price < 0) {
            return response.status(400).json({
                success: false,
                message: 'Az ár nem lehet negatív'
            });
        }

        const serviceId = await createService(providerId, {
            name: name.trim(),
            description: description?.trim() || null,
            duration_minutes,
            price,
            status: status || 'available'
        });

        response.status(201).json({
            success: true,
            message: 'Szolgáltatás sikeresen létrehozva',
            serviceId
        });
    } catch (error) {
        console.error('Create service error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a szolgáltatás létrehozásakor'
        });
    }
});

// Update service
router.put('/:id', async (request, response) => {
    try {
        const providerId = request.providerId;
        const serviceId = request.params.id;
        const { name, description, duration_minutes, price, status } = request.body;

        if (isNaN(parseInt(serviceId))) {
            return response.status(400).json({
                success: false,
                message: 'Érvénytelen szolgáltatás azonosító'
            });
        }

        // Ownership check
        const serviceRecord = await getServiceOwnership(serviceId);

        if (!serviceRecord) {
            return response.status(404).json({
                success: false,
                message: 'Szolgáltatás nem található'
            });
        }

        if (serviceRecord.provider_id !== providerId) {
            return response.status(403).json({
                success: false,
                message: 'Nincs jogosultságod módosítani ezt a szolgáltatást'
            });
        }

        if (!name || !duration_minutes || !price) {
            return response.status(400).json({
                success: false,
                message: 'Név, időtartam és ár megadása kötelező'
            });
        }

        if (duration_minutes < 5 || duration_minutes > 480) {
            return response.status(400).json({
                success: false,
                message: 'Az időtartam 5 és 480 perc között kell legyen'
            });
        }

        if (price < 0) {
            return response.status(400).json({
                success: false,
                message: 'Az ár nem lehet negatív'
            });
        }

        await updateService(serviceId, {
            name: name.trim(),
            description: description?.trim() || null,
            duration_minutes,
            price,
            status: status || 'available'
        });

        response.status(200).json({
            success: true,
            message: 'Szolgáltatás sikeresen frissítve'
        });
    } catch (error) {
        console.error('Update service error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a szolgáltatás frissítésekor'
        });
    }
});

// Delete service
router.delete('/:id', async (request, response) => {
    try {
        const providerId = request.providerId;
        const serviceId = request.params.id;

        if (isNaN(parseInt(serviceId))) {
            return response.status(400).json({
                success: false,
                message: 'Érvénytelen szolgáltatás azonosító'
            });
        }

        // Ownership check
        const serviceRecord = await getServiceOwnership(serviceId);

        if (!serviceRecord) {
            return response.status(404).json({
                success: false,
                message: 'Szolgáltatás nem található'
            });
        }

        if (serviceRecord.provider_id !== providerId) {
            return response.status(403).json({
                success: false,
                message: 'Nincs jogosultságod törölni ezt a szolgáltatást'
            });
        }

        // Check for active appointments
        const scheduledCount = await getScheduledAppointmentCountForService(serviceId);

        if (scheduledCount > 0) {
            return response.status(400).json({
                success: false,
                message: `Nem törölhető: ${scheduledCount} aktív foglalás tartozik ehhez a szolgáltatáshoz`
            });
        }

        await deleteService(serviceId);

        response.status(200).json({
            success: true,
            message: 'Szolgáltatás sikeresen törölve'
        });
    } catch (error) {
        console.error('Delete service error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a szolgáltatás törlésekor'
        });
    }
});

// Get images for a service
router.get('/:id/images', async (request, response) => {
    try {
        const providerId = request.providerId;
        const serviceId = parseInt(request.params.id);
        if (isNaN(serviceId)) {
            return response.status(400).json({ success: false, message: 'Érvénytelen szolgáltatás azonosító' });
        }

        const service = await getServiceByIdAndProvider(serviceId, providerId);
        if (!service) {
            return response.status(404).json({ success: false, message: 'Szolgáltatás nem található' });
        }

        const images = await getServiceImages(serviceId);
        response.status(200).json({ success: true, images });
    } catch (error) {
        console.error('Get service images error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt a képek lekérdezésekor' });
    }
});

// Upload a new image for a service
router.post('/:id/images', upload.single('serviceImage'), async (request, response) => {
    try {
        const providerId = request.providerId;
        const serviceId = parseInt(request.params.id);
        if (isNaN(serviceId)) {
            return response.status(400).json({ success: false, message: 'Érvénytelen szolgáltatás azonosító' });
        }
        if (!request.file) {
            return response.status(400).json({ success: false, message: 'Kép feltöltése kötelező' });
        }

        const service = await getServiceByIdAndProvider(serviceId, providerId);
        if (!service) {
            return response.status(404).json({ success: false, message: 'Szolgáltatás nem található' });
        }

        const imageCount = await getServiceImageCount(serviceId);
        if (imageCount >= 5) {
            return response.status(400).json({ success: false, message: 'Maximum 5 kép tölthető fel szolgáltatásonként' });
        }

        const imageUrl = await processServiceImage(request.file.buffer, serviceId);
        const sortOrder = imageCount;

        const imageId = await createServiceImage(serviceId, imageUrl, sortOrder);

        response.status(201).json({
            success: true,
            image: { id: imageId, image_url: imageUrl, sort_order: sortOrder }
        });
    } catch (error) {
        console.error('Upload service image error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt a kép feltöltésekor' });
    }
});

// Delete an image from a service
router.delete('/:serviceId/images/:imageId', async (request, response) => {
    try {
        const providerId = request.providerId;
        const serviceId = parseInt(request.params.serviceId);
        const imageId = parseInt(request.params.imageId);
        if (isNaN(serviceId) || isNaN(imageId)) {
            return response.status(400).json({ success: false, message: 'Érvénytelen azonosító' });
        }

        const service = await getServiceByIdAndProvider(serviceId, providerId);
        if (!service) {
            return response.status(404).json({ success: false, message: 'Szolgáltatás nem található' });
        }

        const image = await getServiceImageById(imageId, serviceId);
        if (!image) {
            return response.status(404).json({ success: false, message: 'Kép nem található' });
        }

        deleteOldSalonImage(image.image_url);

        await deleteServiceImage(imageId);

        response.status(200).json({ success: true, message: 'Kép sikeresen törölve' });
    } catch (error) {
        console.error('Delete service image error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt a kép törlésekor' });
    }
});

module.exports = router;
