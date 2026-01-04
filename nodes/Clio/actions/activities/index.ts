/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData, buildQueryParams, decimalToCents } from '../../utils/helpers';

export const activitiesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['activities'] } },
		options: [
			{ name: 'Create', value: 'createActivity', description: 'Create a time entry', action: 'Create an activity' },
			{ name: 'Delete', value: 'deleteActivity', description: 'Delete an activity', action: 'Delete an activity' },
			{ name: 'Get', value: 'getActivity', description: 'Get an activity by ID', action: 'Get an activity' },
			{ name: 'List', value: 'listActivities', description: 'List all activities', action: 'List all activities' },
			{ name: 'Update', value: 'updateActivity', description: 'Update an activity', action: 'Update an activity' },
		],
		default: 'listActivities',
	},
];

export const activitiesFields: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: { resource: ['activities'], operation: ['listActivities'] } },
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: { show: { resource: ['activities'], operation: ['listActivities'], returnAll: [false] } },
		typeOptions: { minValue: 1, maxValue: 200 },
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['activities'], operation: ['listActivities'] } },
		options: [
			{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Filter by matter' },
			{ displayName: 'User ID', name: 'user_id', type: 'number', default: 0, description: 'Filter by user' },
			{ displayName: 'Billable', name: 'billed', type: 'boolean', default: false, description: 'Filter by billed status' },
			{ displayName: 'Created Since', name: 'created_since', type: 'dateTime', default: '', description: 'Filter by creation date' },
		],
	},
	{
		displayName: 'Activity ID',
		name: 'activityId',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['activities'], operation: ['getActivity', 'updateActivity', 'deleteActivity'] } },
		default: 0,
		description: 'The ID of the activity',
	},
	{
		displayName: 'Matter ID',
		name: 'matterId',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['activities'], operation: ['createActivity'] } },
		default: 0,
		description: 'ID of the matter',
	},
	{
		displayName: 'Quantity (Hours)',
		name: 'quantity',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['activities'], operation: ['createActivity'] } },
		typeOptions: { numberPrecision: 2 },
		default: 0,
		description: 'Time in hours (e.g., 1.5 for 1 hour 30 minutes)',
	},
	{
		displayName: 'Rate ($/Hour)',
		name: 'price',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['activities'], operation: ['createActivity'] } },
		typeOptions: { numberPrecision: 2 },
		default: 0,
		description: 'Billing rate per hour',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['activities'], operation: ['createActivity'] } },
		options: [
			{ displayName: 'Date', name: 'date', type: 'dateTime', default: '', description: 'Date of the activity' },
			{ displayName: 'Note', name: 'note', type: 'string', typeOptions: { rows: 3 }, default: '', description: 'Description of work performed' },
			{ displayName: 'Activity Description ID', name: 'activity_description_id', type: 'number', default: 0, description: 'ID of activity description template' },
			{ displayName: 'Non-Billable', name: 'non_billable', type: 'boolean', default: false, description: 'Whether this is non-billable time' },
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['activities'], operation: ['updateActivity'] } },
		options: [
			{ displayName: 'Quantity (Hours)', name: 'quantity', type: 'number', typeOptions: { numberPrecision: 2 }, default: 0, description: 'Time in hours' },
			{ displayName: 'Rate ($/Hour)', name: 'price', type: 'number', typeOptions: { numberPrecision: 2 }, default: 0, description: 'Billing rate' },
			{ displayName: 'Note', name: 'note', type: 'string', default: '', description: 'Description' },
			{ displayName: 'Date', name: 'date', type: 'dateTime', default: '', description: 'Date of activity' },
		],
	},
];

export async function executeActivitiesOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listActivities') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = buildQueryParams(filters);

		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/activities.json', {}, qs);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			qs['page[size]'] = limit;
			responseData = await clioApiRequest.call(this, 'GET', '/activities.json', {}, qs);
			
		}
	}

	if (operation === 'getActivity') {
		const activityId = this.getNodeParameter('activityId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/activities/${activityId}.json`);
		
	}

	if (operation === 'createActivity') {
		const matterId = this.getNodeParameter('matterId', i) as number;
		const quantity = this.getNodeParameter('quantity', i) as number;
		const price = this.getNodeParameter('price', i) as number;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const data: IDataObject = {
			type: 'TimeEntry',
			matter: { id: matterId },
			quantity,
			price: decimalToCents(price),
		};

		if (additionalFields.date) data.date = additionalFields.date;
		if (additionalFields.note) data.note = additionalFields.note;
		if (additionalFields.activity_description_id) {
			data.activity_description = { id: additionalFields.activity_description_id };
		}
		if (additionalFields.non_billable) data.non_billable = additionalFields.non_billable;

		const body: IDataObject = { data };
		responseData = await clioApiRequest.call(this, 'POST', '/activities.json', body);
		
	}

	if (operation === 'updateActivity') {
		const activityId = this.getNodeParameter('activityId', i) as number;
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

		const data: IDataObject = {};
		if (updateFields.quantity) data.quantity = updateFields.quantity;
		if (updateFields.price) data.price = decimalToCents(updateFields.price as number);
		if (updateFields.note) data.note = updateFields.note;
		if (updateFields.date) data.date = updateFields.date;

		const body: IDataObject = { data };
		responseData = await clioApiRequest.call(this, 'PATCH', `/activities/${activityId}.json`, body);
		
	}

	if (operation === 'deleteActivity') {
		const activityId = this.getNodeParameter('activityId', i) as number;
		await clioApiRequest.call(this, 'DELETE', `/activities/${activityId}.json`);
		responseData = { success: true, activityId };
	}

	return prepareOutputData(responseData);
}
