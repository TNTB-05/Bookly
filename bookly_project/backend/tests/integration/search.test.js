const request = require('supertest');
const express = require('express');

jest.mock('../../sql/database.js', () => ({
    pool: { query: jest.fn(), execute: jest.fn() },
    getAllSalons: jest.fn(),
    getSalonById: jest.fn(),
    getProvidersBySalonId: jest.fn(),
    getServicesBySalonId: jest.fn(),
    getServicesByProviderId: jest.fn(),
    getDistinctSalonTypes: jest.fn(),
    getTopRatedSalons: jest.fn(),
    expandTimeBlocks: jest.fn(),
    getRecommendedSalons: jest.fn()
}));

jest.mock('../../services/locationService.js', () => ({
    placeToCoordinate: jest.fn(),
    findNearbySalons: jest.fn(),
    coordinateToPlace: jest.fn(),
    addressAutocomplete: jest.fn(),
    calculateDistance: jest.fn()
}));

const database = require('../../sql/database.js');
const locationService = require('../../services/locationService.js');

function buildApp() {
    const app = express();
    app.use(express.json());
    const searchRouter = require('../../api/searchApi.js');
    app.use('/api/search', searchRouter);
    return app;
}

beforeEach(() => jest.clearAllMocks());

describe('POST /api/search/nearby', () => {
    test('returns 400 when no coordinates or place are provided', async () => {
        const res = await request(buildApp())
            .post('/api/search/nearby')
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 400 when latitude is out of valid range', async () => {
        const res = await request(buildApp())
            .post('/api/search/nearby')
            .send({ latitude: 200, longitude: 19 });
        expect(res.status).toBe(400);
    });

    test('returns 400 when geocoding fails for a place name', async () => {
        locationService.placeToCoordinate.mockRejectedValueOnce(new Error('Not found'));

        const res = await request(buildApp())
            .post('/api/search/nearby')
            .send({ place: 'NonexistentPlace123' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 200 with salons when coordinates are valid', async () => {
        const mockSalon = { id: 1, name: 'Test Salon', latitude: 47.5, longitude: 19.0 };
        database.getAllSalons.mockResolvedValueOnce([mockSalon]);
        locationService.findNearbySalons.mockReturnValueOnce([{ ...mockSalon, distance: 0.5 }]);
        database.getProvidersBySalonId.mockResolvedValueOnce([]);
        database.getServicesBySalonId.mockResolvedValueOnce([]);

        const res = await request(buildApp())
            .post('/api/search/nearby')
            .send({ latitude: 47.5, longitude: 19.0, radius_km: 10 });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.salons).toHaveLength(1);
        expect(res.body.salons[0].name).toBe('Test Salon');
    });

    test('filters by service_name when provided', async () => {
        const salons = [
            { id: 1, name: 'Hair Salon', type: 'hair', latitude: 47.5, longitude: 19.0 },
            { id: 2, name: 'Nail Salon', type: 'nails', latitude: 47.5, longitude: 19.0 }
        ];
        database.getAllSalons.mockResolvedValueOnce(salons);
        locationService.findNearbySalons.mockReturnValueOnce(salons.map(s => ({ ...s, distance: 1 })));
        database.getProvidersBySalonId.mockResolvedValue([]);
        database.getServicesBySalonId.mockImplementation(async (id) =>
            id === 1 ? [{ name: 'Haircut', description: 'A nice cut' }] : [{ name: 'Manicure', description: 'Nail art' }]
        );

        const res = await request(buildApp())
            .post('/api/search/nearby')
            .send({ latitude: 47.5, longitude: 19.0, service_name: 'hair' });
        expect(res.status).toBe(200);
        expect(res.body.salons).toHaveLength(1);
        expect(res.body.salons[0].id).toBe(1);
    });
});

describe('GET /api/search/salon/:id', () => {
    test('returns 404 when salon is not found', async () => {
        database.getSalonById.mockResolvedValueOnce(null);

        const res = await request(buildApp()).get('/api/search/salon/999');
        expect(res.status).toBe(404);
    });

    test('returns 200 with salon data when found', async () => {
        const salon = { id: 5, name: 'Found Salon' };
        database.getSalonById.mockResolvedValueOnce(salon);
        database.getProvidersBySalonId.mockResolvedValueOnce([]);
        database.getServicesBySalonId.mockResolvedValueOnce([]);
        database.getServicesByProviderId.mockResolvedValueOnce([]);

        const res = await request(buildApp()).get('/api/search/salon/5');
        expect(res.status).toBe(200);
        expect(res.body.salon.name).toBe('Found Salon');
    });
});

describe('GET /api/search/types', () => {
    test('returns 200 with array of types', async () => {
        database.getDistinctSalonTypes.mockResolvedValueOnce(['hair', 'nails', 'massage']);

        const res = await request(buildApp()).get('/api/search/types');
        expect(res.status).toBe(200);
        expect(res.body.types).toEqual(['hair', 'nails', 'massage']);
    });
});
