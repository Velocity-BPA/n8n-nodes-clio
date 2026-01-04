/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, INodeExecutionData } from 'n8n-workflow';

/**
 * Convert amount in cents to dollars
 */
export function centsToAmount(cents: number): number {
  return cents / 100;
}

// Alias for centsToAmount
export const centsToDecimal = centsToAmount;

/**
 * Convert amount in dollars to cents
 */
export function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}

// Alias for amountToCents
export const decimalToCents = amountToCents;

/**
 * Format duration in seconds to hours
 */
export function secondsToHours(seconds: number): number {
  return seconds / 3600;
}

/**
 * Format hours to seconds
 */
export function hoursToSeconds(hours: number): number {
  return Math.round(hours * 3600);
}

/**
 * Build fields parameter for API request
 */
export function buildFieldsParam(resource: string, fields: string[]): string {
  return `${resource}{${fields.join(',')}}`;
}

/**
 * Parse ISO date string
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Format date to ISO date string (YYYY-MM-DD)
 */
export function formatDate(date: Date | string): string {
  if (!date || date === '') {
    return '';
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Extract ID from various input types
 */
export function extractId(input: number | string | IDataObject | null | undefined): number | undefined {
  if (input === null || input === undefined) {
    return undefined;
  }
  if (typeof input === 'number') {
    return input;
  }
  if (typeof input === 'string') {
    const parsed = parseInt(input, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  if (typeof input === 'object' && 'id' in input) {
    return extractId(input.id as number | string);
  }
  return undefined;
}

/**
 * Check if value is a valid ID (positive integer)
 */
export function isValidId(value: number): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Clean empty values from object
 */
export function cleanObject(obj: IDataObject): IDataObject {
  const cleaned: IDataObject = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Prepare output data with JSON and binary
 */
export function prepareOutput(
  itemsOrData: INodeExecutionData[] | IDataObject | IDataObject[],
  responseData?: IDataObject | IDataObject[],
): INodeExecutionData[] {
  // Support both (items, responseData) and (responseData) signatures
  let data: IDataObject | IDataObject[];
  if (responseData !== undefined) {
    data = responseData;
  } else {
    data = itemsOrData as IDataObject | IDataObject[];
  }
  const dataArray = Array.isArray(data) ? data : [data];
  return dataArray.map((item) => ({
    json: item,
  }));
}

// Alias for prepareOutput
export const prepareOutputData = prepareOutput;

/**
 * Build query string from filter options
 */
export function buildQueryParams(
  filters: IDataObject,
  additionalFields: IDataObject = {},
): IDataObject {
  const qs: IDataObject = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      if (key.startsWith('filter_')) {
        const filterKey = key.replace('filter_', '');
        qs[filterKey] = value;
      } else {
        qs[key] = value;
      }
    }
  }

  for (const [key, value] of Object.entries(additionalFields)) {
    if (value !== undefined && value !== null && value !== '') {
      qs[key] = value;
    }
  }

  return qs;
}

/**
 * Split array into chunks
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: IDataObject,
  requiredFields: string[],
): void {
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error(`Required field '${field}' is missing`);
    }
  }
}

/**
 * Format phone number for Clio
 */
export function formatPhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Simplify the Clio response for cleaner output
 */
export function simplifyResponse(data: IDataObject): IDataObject {
  const simplified: IDataObject = {};

  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as IDataObject;
      if ('id' in obj && Object.keys(obj).length <= 3) {
        simplified[key] = obj.id;
      } else {
        simplified[key] = simplifyResponse(obj);
      }
    } else {
      simplified[key] = value;
    }
  }

  return simplified;
}
