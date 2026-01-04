/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 */

import {
	centsToDecimal,
	decimalToCents,
	formatDate,
	buildQueryParams,
	extractId,
	isValidId,
	prepareOutputData,
} from '../../nodes/Clio/utils/helpers';

describe('Helper Functions', () => {
	describe('centsToDecimal', () => {
		it('should convert cents to decimal', () => {
			expect(centsToDecimal(100)).toBe(1);
			expect(centsToDecimal(150)).toBe(1.5);
			expect(centsToDecimal(0)).toBe(0);
			expect(centsToDecimal(99)).toBe(0.99);
		});

		it('should handle negative values', () => {
			expect(centsToDecimal(-100)).toBe(-1);
		});
	});

	describe('decimalToCents', () => {
		it('should convert decimal to cents', () => {
			expect(decimalToCents(1)).toBe(100);
			expect(decimalToCents(1.5)).toBe(150);
			expect(decimalToCents(0)).toBe(0);
			expect(decimalToCents(0.99)).toBe(99);
		});

		it('should round to nearest cent', () => {
			expect(decimalToCents(1.999)).toBe(200);
		});
	});

	describe('formatDate', () => {
		it('should format date string', () => {
			expect(formatDate('2024-01-15T10:30:00Z')).toBe('2024-01-15');
		});

		it('should handle Date object', () => {
			const date = new Date('2024-01-15T10:30:00Z');
			expect(formatDate(date)).toBe('2024-01-15');
		});

		it('should return empty string for empty input', () => {
			expect(formatDate('')).toBe('');
		});
	});

	describe('buildQueryParams', () => {
		it('should build query params from filters', () => {
			const filters = { status: 'Open', client_id: 123 };
			expect(buildQueryParams(filters)).toEqual({ status: 'Open', client_id: 123 });
		});

		it('should exclude null and undefined values', () => {
			const filters = { status: 'Open', client_id: null, matter_id: undefined };
			expect(buildQueryParams(filters)).toEqual({ status: 'Open' });
		});

		it('should exclude empty strings', () => {
			const filters = { status: 'Open', query: '' };
			expect(buildQueryParams(filters)).toEqual({ status: 'Open' });
		});
	});

	describe('extractId', () => {
		it('should extract id from number', () => {
			expect(extractId(123)).toBe(123);
		});

		it('should extract id from string', () => {
			expect(extractId('123')).toBe(123);
		});

		it('should extract id from object with id property', () => {
			expect(extractId({ id: 123 })).toBe(123);
		});

		it('should return undefined for invalid input', () => {
			expect(extractId(null)).toBeUndefined();
		});
	});

	describe('isValidId', () => {
		it('should return true for valid positive integer', () => {
			expect(isValidId(1)).toBe(true);
			expect(isValidId(123)).toBe(true);
		});

		it('should return false for invalid values', () => {
			expect(isValidId(0)).toBe(false);
			expect(isValidId(-1)).toBe(false);
			expect(isValidId(1.5)).toBe(false);
			expect(isValidId('123' as unknown as number)).toBe(false);
		});
	});

	describe('prepareOutputData', () => {
		it('should wrap single object in array', () => {
			const data = { id: 1, name: 'Test' };
			const result = prepareOutputData(data);
			expect(result).toEqual([{ json: { id: 1, name: 'Test' } }]);
		});

		it('should wrap array of objects', () => {
			const data = [{ id: 1 }, { id: 2 }];
			const result = prepareOutputData(data);
			expect(result).toEqual([{ json: { id: 1 } }, { json: { id: 2 } }]);
		});
	});
});
