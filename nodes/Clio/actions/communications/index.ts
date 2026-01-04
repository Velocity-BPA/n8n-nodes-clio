/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData, buildQueryParams } from '../../utils/helpers';
import { COMMUNICATION_TYPES } from '../../constants';

export const communicationsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['communications'] } },
		options: [
			{ name: 'Create', value: 'createCommunication', description: 'Log a communication', action: 'Create a communication' },
			{ name: 'Delete', value: 'deleteCommunication', description: 'Delete a communication', action: 'Delete a communication' },
			{ name: 'Get', value: 'getCommunication', description: 'Get a communication by ID', action: 'Get a communication' },
			{ name: 'List', value: 'listCommunications', description: 'List all communications', action: 'List all communications' },
			{ name: 'Update', value: 'updateCommunication', description: 'Update a communication', action: 'Update a communication' },
		],
		default: 'listCommunications',
	},
];

export const communicationsFields: INodeProperties[] = [
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', displayOptions: { show: { resource: ['communications'], operation: ['listCommunications'] } }, default: false, description: 'Whether to return all results or only up to a given limit' },
	{ displayName: 'Limit', name: 'limit', type: 'number', displayOptions: { show: { resource: ['communications'], operation: ['listCommunications'], returnAll: [false] } }, typeOptions: { minValue: 1, maxValue: 200 }, default: 50, description: 'Max number of results to return' },
	{ displayName: 'Filters', name: 'filters', type: 'collection', placeholder: 'Add Filter', default: {}, displayOptions: { show: { resource: ['communications'], operation: ['listCommunications'] } }, options: [
		{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Filter by matter' },
		{ displayName: 'Type', name: 'type', type: 'options', options: COMMUNICATION_TYPES, default: '', description: 'Filter by type' },
	] },
	{ displayName: 'Communication ID', name: 'communicationId', type: 'number', required: true, displayOptions: { show: { resource: ['communications'], operation: ['getCommunication', 'updateCommunication', 'deleteCommunication'] } }, default: 0, description: 'The ID of the communication' },
	{ displayName: 'Type', name: 'type', type: 'options', required: true, displayOptions: { show: { resource: ['communications'], operation: ['createCommunication'] } }, options: COMMUNICATION_TYPES, default: 'EmailCommunication', description: 'Communication type' },
	{ displayName: 'Subject', name: 'subject', type: 'string', required: true, displayOptions: { show: { resource: ['communications'], operation: ['createCommunication'] } }, default: '', description: 'Subject/title' },
	{ displayName: 'Additional Fields', name: 'additionalFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['communications'], operation: ['createCommunication'] } }, options: [
		{ displayName: 'Body', name: 'body', type: 'string', typeOptions: { rows: 4 }, default: '', description: 'Communication body' },
		{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Associated matter' },
		{ displayName: 'Date', name: 'date', type: 'dateTime', default: '', description: 'Communication date' },
	] },
	{ displayName: 'Update Fields', name: 'updateFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['communications'], operation: ['updateCommunication'] } }, options: [
		{ displayName: 'Subject', name: 'subject', type: 'string', default: '', description: 'Subject' },
		{ displayName: 'Body', name: 'body', type: 'string', typeOptions: { rows: 4 }, default: '', description: 'Body' },
	] },
];

export async function executeCommunicationsOperation(this: IExecuteFunctions, operation: string, i: number): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listCommunications') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = buildQueryParams(filters);
		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/communications.json', {}, qs);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			qs['page[size]'] = limit;
			responseData = await clioApiRequest.call(this, 'GET', '/communications.json', {}, qs);
			
		}
	}

	if (operation === 'getCommunication') {
		const communicationId = this.getNodeParameter('communicationId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/communications/${communicationId}.json`);
		
	}

	if (operation === 'createCommunication') {
		const type = this.getNodeParameter('type', i) as string;
		const subject = this.getNodeParameter('subject', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const data: IDataObject = { type, subject };
		if (additionalFields.body) data.body = additionalFields.body;
		if (additionalFields.matter_id) data.matter = { id: additionalFields.matter_id };
		if (additionalFields.date) data.date = additionalFields.date;

		const body: IDataObject = { data };
		responseData = await clioApiRequest.call(this, 'POST', '/communications.json', body);
		
	}

	if (operation === 'updateCommunication') {
		const communicationId = this.getNodeParameter('communicationId', i) as number;
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		const body: IDataObject = { data: updateFields };
		responseData = await clioApiRequest.call(this, 'PATCH', `/communications/${communicationId}.json`, body);
		
	}

	if (operation === 'deleteCommunication') {
		const communicationId = this.getNodeParameter('communicationId', i) as number;
		await clioApiRequest.call(this, 'DELETE', `/communications/${communicationId}.json`);
		responseData = { success: true, communicationId };
	}

	return prepareOutputData(responseData);
}
