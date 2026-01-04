/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData, buildQueryParams } from '../../utils/helpers';
import { MATTER_STATUSES } from '../../constants';

export const mattersOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['matters'] } },
		options: [
			{ name: 'Close Matter', value: 'closeMatter', description: 'Close a matter', action: 'Close a matter' },
			{ name: 'Create', value: 'createMatter', description: 'Create a new matter', action: 'Create a matter' },
			{ name: 'Delete', value: 'deleteMatter', description: 'Delete a matter', action: 'Delete a matter' },
			{ name: 'Get', value: 'getMatter', description: 'Get a matter by ID', action: 'Get a matter' },
			{ name: 'List', value: 'listMatters', description: 'List all matters', action: 'List all matters' },
			{ name: 'Reopen Matter', value: 'reopenMatter', description: 'Reopen a closed matter', action: 'Reopen a matter' },
			{ name: 'Update', value: 'updateMatter', description: 'Update a matter', action: 'Update a matter' },
		],
		default: 'listMatters',
	},
];

export const mattersFields: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: { resource: ['matters'], operation: ['listMatters'] } },
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: { show: { resource: ['matters'], operation: ['listMatters'], returnAll: [false] } },
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
		displayOptions: { show: { resource: ['matters'], operation: ['listMatters'] } },
		options: [
			{ displayName: 'Client ID', name: 'client_id', type: 'number', default: 0, description: 'Filter by client ID' },
			{ displayName: 'Status', name: 'status', type: 'options', options: MATTER_STATUSES, default: '', description: 'Filter by status' },
			{ displayName: 'Practice Area ID', name: 'practice_area_id', type: 'number', default: 0, description: 'Filter by practice area' },
			{ displayName: 'Responsible Attorney ID', name: 'responsible_attorney_id', type: 'number', default: 0, description: 'Filter by responsible attorney' },
			{ displayName: 'Query', name: 'query', type: 'string', default: '', description: 'Search query' },
			{ displayName: 'Created Since', name: 'created_since', type: 'dateTime', default: '', description: 'Filter by creation date' },
			{ displayName: 'Updated Since', name: 'updated_since', type: 'dateTime', default: '', description: 'Filter by update date' },
		],
	},
	{
		displayName: 'Matter ID',
		name: 'matterId',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['matters'], operation: ['getMatter', 'updateMatter', 'deleteMatter', 'closeMatter', 'reopenMatter'] } },
		default: 0,
		description: 'The ID of the matter',
	},
	{
		displayName: 'Display Number',
		name: 'displayNumber',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['matters'], operation: ['createMatter'] } },
		default: '',
		description: 'Unique identifier for the matter',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['matters'], operation: ['createMatter'] } },
		default: '',
		description: 'Description of the matter',
	},
	{
		displayName: 'Client ID',
		name: 'clientId',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['matters'], operation: ['createMatter'] } },
		default: 0,
		description: 'ID of the client contact',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['matters'], operation: ['createMatter'] } },
		options: [
			{ displayName: 'Practice Area ID', name: 'practice_area_id', type: 'number', default: 0, description: 'ID of the practice area' },
			{ displayName: 'Responsible Attorney ID', name: 'responsible_attorney_id', type: 'number', default: 0, description: 'ID of the responsible attorney' },
			{ displayName: 'Open Date', name: 'open_date', type: 'dateTime', default: '', description: 'Date the matter was opened' },
			{ displayName: 'Status', name: 'status', type: 'options', options: MATTER_STATUSES, default: 'Open', description: 'Status of the matter' },
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['matters'], operation: ['updateMatter'] } },
		options: [
			{ displayName: 'Display Number', name: 'display_number', type: 'string', default: '', description: 'Unique identifier' },
			{ displayName: 'Description', name: 'description', type: 'string', default: '', description: 'Description' },
			{ displayName: 'Status', name: 'status', type: 'options', options: MATTER_STATUSES, default: '', description: 'Status' },
			{ displayName: 'Practice Area ID', name: 'practice_area_id', type: 'number', default: 0, description: 'Practice area ID' },
		],
	},
];

export async function executeMattersOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listMatters') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = buildQueryParams(filters);

		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/matters.json', {}, qs);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			qs['page[size]'] = limit;
			responseData = await clioApiRequest.call(this, 'GET', '/matters.json', {}, qs);
			
		}
	}

	if (operation === 'getMatter') {
		const matterId = this.getNodeParameter('matterId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/matters/${matterId}.json`);
		
	}

	if (operation === 'createMatter') {
		const displayNumber = this.getNodeParameter('displayNumber', i) as string;
		const description = this.getNodeParameter('description', i) as string;
		const clientId = this.getNodeParameter('clientId', i) as number;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const body: IDataObject = {
			data: {
				display_number: displayNumber,
				description,
				client: { id: clientId },
			},
		};

		if (additionalFields.practice_area_id) {
			(body.data as IDataObject).practice_area = { id: additionalFields.practice_area_id };
		}
		if (additionalFields.responsible_attorney_id) {
			(body.data as IDataObject).responsible_attorney = { id: additionalFields.responsible_attorney_id };
		}
		if (additionalFields.open_date) {
			(body.data as IDataObject).open_date = additionalFields.open_date;
		}
		if (additionalFields.status) {
			(body.data as IDataObject).status = additionalFields.status;
		}

		responseData = await clioApiRequest.call(this, 'POST', '/matters.json', body);
		
	}

	if (operation === 'updateMatter') {
		const matterId = this.getNodeParameter('matterId', i) as number;
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

		const data: IDataObject = {};
		if (updateFields.display_number) data.display_number = updateFields.display_number;
		if (updateFields.description) data.description = updateFields.description;
		if (updateFields.status) data.status = updateFields.status;
		if (updateFields.practice_area_id) data.practice_area = { id: updateFields.practice_area_id };

		const body: IDataObject = { data };
		responseData = await clioApiRequest.call(this, 'PATCH', `/matters/${matterId}.json`, body);
		
	}

	if (operation === 'deleteMatter') {
		const matterId = this.getNodeParameter('matterId', i) as number;
		await clioApiRequest.call(this, 'DELETE', `/matters/${matterId}.json`);
		responseData = { success: true, matterId };
	}

	if (operation === 'closeMatter') {
		const matterId = this.getNodeParameter('matterId', i) as number;
		const body: IDataObject = { data: { status: 'Closed' } };
		responseData = await clioApiRequest.call(this, 'PATCH', `/matters/${matterId}.json`, body);
		
	}

	if (operation === 'reopenMatter') {
		const matterId = this.getNodeParameter('matterId', i) as number;
		const body: IDataObject = { data: { status: 'Open' } };
		responseData = await clioApiRequest.call(this, 'PATCH', `/matters/${matterId}.json`, body);
		
	}

	return prepareOutputData(responseData);
}
