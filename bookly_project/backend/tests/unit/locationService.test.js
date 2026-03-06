const { calculateDistance, findNearbySalons } = require('../../services/locationService');

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
