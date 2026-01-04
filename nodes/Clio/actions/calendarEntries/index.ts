/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData, buildQueryParams } from '../../utils/helpers';

export const calendarEntriesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['calendarEntries'] } },
		options: [
			{ name: 'Create', value: 'createCalendarEntry', description: 'Create a calendar entry', action: 'Create a calendar entry' },
			{ name: 'Delete', value: 'deleteCalendarEntry', description: 'Delete a calendar entry', action: 'Delete a calendar entry' },
			{ name: 'Get', value: 'getCalendarEntry', description: 'Get a calendar entry by ID', action: 'Get a calendar entry' },
			{ name: 'List', value: 'listCalendarEntries', description: 'List all calendar entries', action: 'List all calendar entries' },
			{ name: 'Update', value: 'updateCalendarEntry', description: 'Update a calendar entry', action: 'Update a calendar entry' },
		],
		default: 'listCalendarEntries',
	},
];

export const calendarEntriesFields: INodeProperties[] = [
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', displayOptions: { show: { resource: ['calendarEntries'], operation: ['listCalendarEntries'] } }, default: false, description: 'Whether to return all results or only up to a given limit' },
	{ displayName: 'Limit', name: 'limit', type: 'number', displayOptions: { show: { resource: ['calendarEntries'], operation: ['listCalendarEntries'], returnAll: [false] } }, typeOptions: { minValue: 1, maxValue: 200 }, default: 50, description: 'Max number of results to return' },
	{ displayName: 'Filters', name: 'filters', type: 'collection', placeholder: 'Add Filter', default: {}, displayOptions: { show: { resource: ['calendarEntries'], operation: ['listCalendarEntries'] } }, options: [
		{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Filter by matter' },
		{ displayName: 'Start Date', name: 'from', type: 'dateTime', default: '', description: 'Filter from this date' },
		{ displayName: 'End Date', name: 'to', type: 'dateTime', default: '', description: 'Filter to this date' },
	] },
	{ displayName: 'Calendar Entry ID', name: 'calendarEntryId', type: 'number', required: true, displayOptions: { show: { resource: ['calendarEntries'], operation: ['getCalendarEntry', 'updateCalendarEntry', 'deleteCalendarEntry'] } }, default: 0, description: 'The ID of the calendar entry' },
	{ displayName: 'Summary', name: 'summary', type: 'string', required: true, displayOptions: { show: { resource: ['calendarEntries'], operation: ['createCalendarEntry'] } }, default: '', description: 'Event title/summary' },
	{ displayName: 'Start Time', name: 'startAt', type: 'dateTime', required: true, displayOptions: { show: { resource: ['calendarEntries'], operation: ['createCalendarEntry'] } }, default: '', description: 'Event start time' },
	{ displayName: 'End Time', name: 'endAt', type: 'dateTime', required: true, displayOptions: { show: { resource: ['calendarEntries'], operation: ['createCalendarEntry'] } }, default: '', description: 'Event end time' },
	{ displayName: 'Additional Fields', name: 'additionalFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['calendarEntries'], operation: ['createCalendarEntry'] } }, options: [
		{ displayName: 'Description', name: 'description', type: 'string', default: '', description: 'Event description' },
		{ displayName: 'Location', name: 'location', type: 'string', default: '', description: 'Event location' },
		{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Associated matter' },
		{ displayName: 'All Day', name: 'all_day', type: 'boolean', default: false, description: 'Whether this is an all-day event' },
	] },
	{ displayName: 'Update Fields', name: 'updateFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['calendarEntries'], operation: ['updateCalendarEntry'] } }, options: [
		{ displayName: 'Summary', name: 'summary', type: 'string', default: '', description: 'Event title' },
		{ displayName: 'Start Time', name: 'start_at', type: 'dateTime', default: '', description: 'Start time' },
		{ displayName: 'End Time', name: 'end_at', type: 'dateTime', default: '', description: 'End time' },
		{ displayName: 'Description', name: 'description', type: 'string', default: '', description: 'Description' },
		{ displayName: 'Location', name: 'location', type: 'string', default: '', description: 'Location' },
	] },
];

export async function executeCalendarEntriesOperation(this: IExecuteFunctions, operation: string, i: number): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listCalendarEntries') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = buildQueryParams(filters);
		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/calendar_entries.json', {}, qs);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			qs['page[size]'] = limit;
			responseData = await clioApiRequest.call(this, 'GET', '/calendar_entries.json', {}, qs);
			
		}
	}

	if (operation === 'getCalendarEntry') {
		const calendarEntryId = this.getNodeParameter('calendarEntryId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/calendar_entries/${calendarEntryId}.json`);
		
	}

	if (operation === 'createCalendarEntry') {
		const summary = this.getNodeParameter('summary', i) as string;
		const startAt = this.getNodeParameter('startAt', i) as string;
		const endAt = this.getNodeParameter('endAt', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const data: IDataObject = { summary, start_at: startAt, end_at: endAt };
		if (additionalFields.description) data.description = additionalFields.description;
		if (additionalFields.location) data.location = additionalFields.location;
		if (additionalFields.matter_id) data.matter = { id: additionalFields.matter_id };
		if (additionalFields.all_day) data.all_day = additionalFields.all_day;

		const body: IDataObject = { data };
		responseData = await clioApiRequest.call(this, 'POST', '/calendar_entries.json', body);
		
	}

	if (operation === 'updateCalendarEntry') {
		const calendarEntryId = this.getNodeParameter('calendarEntryId', i) as number;
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		const body: IDataObject = { data: updateFields };
		responseData = await clioApiRequest.call(this, 'PATCH', `/calendar_entries/${calendarEntryId}.json`, body);
		
	}

	if (operation === 'deleteCalendarEntry') {
		const calendarEntryId = this.getNodeParameter('calendarEntryId', i) as number;
		await clioApiRequest.call(this, 'DELETE', `/calendar_entries/${calendarEntryId}.json`);
		responseData = { success: true, calendarEntryId };
	}

	return prepareOutputData(responseData);
}
