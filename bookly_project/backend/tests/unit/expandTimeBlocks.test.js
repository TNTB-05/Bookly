jest.mock('../../sql/database.js', () => {
    const actual = jest.requireActual('../../sql/database.js');
    return {
        ...actual,
        pool: { query: jest.fn(), execute: jest.fn() }
    };
});

const { expandTimeBlocks } = require('../../sql/database.js');

describe('expandTimeBlocks', () => {
    const startDate = '2026-03-10';
    const endDate = '2026-03-14';

    test('includes a non-recurring block that falls within range', () => {
        const block = {
            id: 1,
            is_recurring: false,
            start_datetime: '2026-03-11 10:00:00',
            end_datetime: '2026-03-11 11:00:00',
            notes: 'Break'
        };
        const result = expandTimeBlocks([block], startDate, endDate);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
        expect(result[0].is_recurring).toBe(false);
    });

    test('excludes a non-recurring block entirely outside the range', () => {
        const block = {
            id: 2,
            is_recurring: false,
            start_datetime: '2026-03-20 10:00:00',
            end_datetime: '2026-03-20 11:00:00',
            notes: null
        };
        const result = expandTimeBlocks([block], startDate, endDate);
        expect(result).toHaveLength(0);
    });

    test('expands a daily recurring block into one occurrence per day in range', () => {
        const block = {
            id: 3,
            is_recurring: true,
            recurrence_pattern: 'daily',
            recurrence_days: null,
            recurrence_end_date: null,
            start_datetime: '2026-03-01 09:00:00',
            end_datetime: '2026-03-01 09:30:00',
            notes: 'Morning break'
        };
        const result = expandTimeBlocks([block], startDate, endDate);
        expect(result).toHaveLength(5);
        expect(result.every(r => r.is_recurring)).toBe(true);
    });

    test('expands weekly recurring block only for matching weekdays', () => {
        // Range 2026-03-10 to 2026-03-14 weekdays:
        //   2026-03-10 getDay()=2 (Tue)
        //   2026-03-11 getDay()=3 (Wed)  <-- matches day 3
        //   2026-03-12 getDay()=4 (Thu)
        //   2026-03-13 getDay()=5 (Fri)
        //   2026-03-14 getDay()=6 (Sat)
        // recurrence_days [1, 3] matches only Wednesday (2026-03-11) → 1 occurrence
        const block = {
            id: 4,
            is_recurring: true,
            recurrence_pattern: 'weekly',
            recurrence_days: JSON.stringify([1, 3]),
            recurrence_end_date: null,
            start_datetime: '2026-03-01 14:00:00',
            end_datetime: '2026-03-01 15:00:00',
            notes: null
        };
        const result = expandTimeBlocks([block], startDate, endDate);
        expect(result).toHaveLength(1);
        expect(result.every(r => r.is_recurring)).toBe(true);
    });

    test('respects recurrence_end_date and stops expanding after it', () => {
        const block = {
            id: 5,
            is_recurring: true,
            recurrence_pattern: 'daily',
            recurrence_days: null,
            recurrence_end_date: '2026-03-11',
            start_datetime: '2026-03-01 08:00:00',
            end_datetime: '2026-03-01 08:30:00',
            notes: null
        };
        const result = expandTimeBlocks([block], startDate, endDate);
        expect(result).toHaveLength(2);
    });

    test('returns empty array for empty input', () => {
        expect(expandTimeBlocks([], startDate, endDate)).toEqual([]);
    });
});
