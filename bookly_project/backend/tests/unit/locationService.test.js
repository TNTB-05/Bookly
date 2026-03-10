const { calculateDistance, findNearbySalons, placeToCoordinate, coordinateToPlace, addressAutocomplete } = require('../../services/locationService');

describe('calculateDistance', () => {
    test('returns 0 for identical coordinates', () => {
        const dist = calculateDistance(47.497913, 19.03991, 47.497913, 19.03991);
        expect(dist).toBe(0);
    });

    test('calculates distance between Budapest and Debrecen (~220 km)', () => {
        const dist = calculateDistance(47.497913, 19.03991, 47.531, 21.624);
        expect(dist).toBeGreaterThan(180);
        expect(dist).toBeLessThan(260);
    });

    test('is symmetric (A→B equals B→A)', () => {
        const d1 = calculateDistance(47.497913, 19.03991, 47.531, 21.624);
        const d2 = calculateDistance(47.531, 21.624, 47.497913, 19.03991);
        expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
    });
});

describe('findNearbySalons', () => {
    const userLat = 47.497913;
    const userLon = 19.03991;

    const salons = [
        { id: 1, name: 'Close Salon', latitude: 47.5, longitude: 19.05 },
        { id: 2, name: 'Far Salon', latitude: 47.531, longitude: 21.624 },
        { id: 3, name: 'No Coords Salon', latitude: null, longitude: null }
    ];

    test('filters salons outside the radius', () => {
        const results = findNearbySalons(salons, userLat, userLon, 10);
        expect(results.map(s => s.id)).toEqual([1]);
    });

    test('sorts by distance ascending', () => {
        const results = findNearbySalons(salons, userLat, userLon, 300);
        expect(results[0].id).toBe(1);
        expect(results[1].id).toBe(2);
    });

    test('excludes salons with null coordinates', () => {
        const results = findNearbySalons(salons, userLat, userLon, 300);
        expect(results.map(s => s.id)).not.toContain(3);
    });

    test('attaches rounded distance property to each result', () => {
        const results = findNearbySalons(salons, userLat, userLon, 10);
        expect(results[0].distance).toBeDefined();
        expect(typeof results[0].distance).toBe('number');
    });

    test('returns empty array when no salons within radius', () => {
        const results = findNearbySalons(salons, userLat, userLon, 0.1);
        expect(results).toEqual([]);
    });
});

// ─── placeToCoordinate ────────────────────────────────────────────────
describe('placeToCoordinate', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    test('returns coordinates for a city name (simple query path)', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [{ lat: '47.497913', lon: '19.03991' }]
        });
        const result = await placeToCoordinate('Budapest');
        expect(result.latitude).toBeCloseTo(47.497913);
        expect(result.longitude).toBeCloseTo(19.03991);
    });

    test('returns coordinates for a structured address (structured query path)', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [{ lat: '47.5', lon: '19.1' }]
        });
        const result = await placeToCoordinate('Budapest, Istvánmezei út 3, 1146');
        expect(result.latitude).toBeCloseTo(47.5);
        expect(result.longitude).toBeCloseTo(19.1);
    });

    test('falls back to simple query when structured query returns empty results', async () => {
        global.fetch
            .mockResolvedValueOnce({ ok: true, json: async () => [] })                           // structured fails
            .mockResolvedValueOnce({ ok: true, json: async () => [{ lat: '47.5', lon: '19.0' }] }); // simple succeeds
        const result = await placeToCoordinate('Budapest, Unknown Street 999, 1234');
        expect(result.latitude).toBeCloseTo(47.5);
    });

    test('throws when place is not found (empty response)', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
        await expect(placeToCoordinate('NonexistentXYZ')).rejects.toThrow();
    });

    test('throws when fetch returns non-ok status', async () => {
        global.fetch.mockResolvedValueOnce({ ok: false, statusText: 'Service Unavailable' });
        await expect(placeToCoordinate('Budapest')).rejects.toThrow();
    });
});

// ─── coordinateToPlace ────────────────────────────────────────────────
describe('coordinateToPlace', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    test('returns formatted address with city, street, house number and postal code', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                address: { city: 'Budapest', road: 'Istvánmezei út', house_number: '3', postcode: '1146' },
                display_name: 'Istvánmezei út 3, Budapest, 1146, Hungary',
                lat: '47.5',
                lon: '19.1'
            })
        });
        const result = await coordinateToPlace(47.5, 19.1);
        expect(result.address).toContain('Budapest');
        expect(result.address).toContain('Istvánmezei út 3');
        expect(result.latitude).toBeCloseTo(47.5);
        expect(result.longitude).toBeCloseTo(19.1);
    });

    test('falls back to display_name when address parts are missing', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                address: {},
                display_name: 'Some place, Hungary',
                lat: '47.0',
                lon: '19.0'
            })
        });
        const result = await coordinateToPlace(47.0, 19.0);
        expect(result.address).toBe('Some place, Hungary');
    });

    test('throws when response contains error field', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ error: 'Unable to geocode' })
        });
        await expect(coordinateToPlace(0, 0)).rejects.toThrow();
    });
});

// ─── addressAutocomplete ──────────────────────────────────────────────
describe('addressAutocomplete', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    test('returns array of address suggestions with mapped fields', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                { display_name: 'Budapest, Hungary', lat: '47.497913', lon: '19.03991', type: 'city', address: { country: 'Hungary' } }
            ]
        });
        const results = await addressAutocomplete('Budapest');
        expect(results).toHaveLength(1);
        expect(results[0].display_name).toBe('Budapest, Hungary');
        expect(results[0].lat).toBeCloseTo(47.497913);
    });

    test('returns empty array when no suggestions found', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
        const results = await addressAutocomplete('xyzunknownplace');
        expect(results).toEqual([]);
    });

    test('throws when fetch returns non-ok status', async () => {
        global.fetch.mockResolvedValueOnce({ ok: false, statusText: 'Too Many Requests' });
        await expect(addressAutocomplete('Budapest')).rejects.toThrow();
    });
});
