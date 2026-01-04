/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData } from '../../utils/helpers';

export const practiceAreasOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['practiceAreas'] } },
		options: [
			{ name: 'Create', value: 'createPracticeArea', description: 'Create a practice area', action: 'Create a practice area' },
			{ name: 'Get', value: 'getPracticeArea', description: 'Get a practice area by ID', action: 'Get a practice area' },
			{ name: 'List', value: 'listPracticeAreas', description: 'List all practice areas', action: 'List all practice areas' },
			{ name: 'Update', value: 'updatePracticeArea', description: 'Update a practice area', action: 'Update a practice area' },
		],
		default: 'listPracticeAreas',
	},
];

export const practiceAreasFields: INodeProperties[] = [
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', displayOptions: { show: { resource: ['practiceAreas'], operation: ['listPracticeAreas'] } }, default: false, description: 'Whether to return all results or only up to a given limit' },
	{ displayName: 'Limit', name: 'limit', type: 'number', displayOptions: { show: { resource: ['practiceAreas'], operation: ['listPracticeAreas'], returnAll: [false] } }, typeOptions: { minValue: 1, maxValue: 200 }, default: 50, description: 'Max number of results to return' },
	{ displayName: 'Practice Area ID', name: 'practiceAreaId', type: 'number', required: true, displayOptions: { show: { resource: ['practiceAreas'], operation: ['getPracticeArea', 'updatePracticeArea'] } }, default: 0, description: 'The ID of the practice area' },
	{ displayName: 'Name', name: 'name', type: 'string', required: true, displayOptions: { show: { resource: ['practiceAreas'], operation: ['createPracticeArea'] } }, default: '', description: 'Practice area name' },
	{ displayName: 'Additional Fields', name: 'additionalFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['practiceAreas'], operation: ['createPracticeArea'] } }, options: [
		{ displayName: 'Code', name: 'code', type: 'string', default: '', description: 'Practice area code' },
		{ displayName: 'Category', name: 'category', type: 'string', default: '', description: 'Practice area category' },
	] },
	{ displayName: 'Update Fields', name: 'updateFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['practiceAreas'], operation: ['updatePracticeArea'] } }, options: [
		{ displayName: 'Name', name: 'name', type: 'string', default: '', description: 'Practice area name' },
		{ displayName: 'Code', name: 'code', type: 'string', default: '', description: 'Practice area code' },
	] },
];

export async function executePracticeAreasOperation(this: IExecuteFunctions, operation: string, i: number): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listPracticeAreas') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/practice_areas.json', {}, {});
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			const qs: IDataObject = { 'page[size]': limit };
			responseData = await clioApiRequest.call(this, 'GET', '/practice_areas.json', {}, qs);
			
		}
	}

	if (operation === 'getPracticeArea') {
		const practiceAreaId = this.getNodeParameter('practiceAreaId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/practice_areas/${practiceAreaId}.json`);
		
	}

	if (operation === 'createPracticeArea') {
		const name = this.getNodeParameter('name', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const data: IDataObject = { name, ...additionalFields };
		const body: IDataObject = { data };
		responseData = await clioApiRequest.call(this, 'POST', '/practice_areas.json', body);
		
	}

	if (operation === 'updatePracticeArea') {
		const practiceAreaId = this.getNodeParameter('practiceAreaId', i) as number;
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		const body: IDataObject = { data: updateFields };
		responseData = await clioApiRequest.call(this, 'PATCH', `/practice_areas/${practiceAreaId}.json`, body);
		
	}

	return prepareOutputData(responseData);
}
