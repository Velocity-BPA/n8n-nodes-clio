/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData, buildQueryParams } from '../../utils/helpers';

export const customFieldsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['customFields'] } },
		options: [
			{ name: 'Get', value: 'getCustomField', description: 'Get a custom field definition', action: 'Get a custom field' },
			{ name: 'Get Values', value: 'getCustomFieldValues', description: 'Get custom field values for a record', action: 'Get custom field values' },
			{ name: 'List', value: 'listCustomFields', description: 'List custom field definitions', action: 'List custom fields' },
			{ name: 'Set Values', value: 'setCustomFieldValues', description: 'Set custom field values for a record', action: 'Set custom field values' },
		],
		default: 'listCustomFields',
	},
];

export const customFieldsFields: INodeProperties[] = [
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', displayOptions: { show: { resource: ['customFields'], operation: ['listCustomFields'] } }, default: false, description: 'Whether to return all results or only up to a given limit' },
	{ displayName: 'Limit', name: 'limit', type: 'number', displayOptions: { show: { resource: ['customFields'], operation: ['listCustomFields'], returnAll: [false] } }, typeOptions: { minValue: 1, maxValue: 200 }, default: 50, description: 'Max number of results to return' },
	{ displayName: 'Filters', name: 'filters', type: 'collection', placeholder: 'Add Filter', default: {}, displayOptions: { show: { resource: ['customFields'], operation: ['listCustomFields'] } }, options: [
		{ displayName: 'Parent Type', name: 'parent_type', type: 'options', options: [
			{ name: 'Matter', value: 'Matter' },
			{ name: 'Contact', value: 'Contact' },
		], default: '', description: 'Filter by parent type' },
	] },
	{ displayName: 'Custom Field ID', name: 'customFieldId', type: 'number', required: true, displayOptions: { show: { resource: ['customFields'], operation: ['getCustomField'] } }, default: 0, description: 'The ID of the custom field' },
	{ displayName: 'Parent Type', name: 'parentType', type: 'options', required: true, displayOptions: { show: { resource: ['customFields'], operation: ['getCustomFieldValues', 'setCustomFieldValues'] } }, options: [
		{ name: 'Matter', value: 'Matter' },
		{ name: 'Contact', value: 'Contact' },
	], default: 'Matter', description: 'Type of the parent record' },
	{ displayName: 'Parent ID', name: 'parentId', type: 'number', required: true, displayOptions: { show: { resource: ['customFields'], operation: ['getCustomFieldValues', 'setCustomFieldValues'] } }, default: 0, description: 'ID of the parent record (matter or contact)' },
	{ displayName: 'Field Values', name: 'fieldValues', type: 'fixedCollection', typeOptions: { multipleValues: true }, displayOptions: { show: { resource: ['customFields'], operation: ['setCustomFieldValues'] } }, default: {}, options: [
		{
			name: 'values',
			displayName: 'Values',
			values: [
				{ displayName: 'Custom Field ID', name: 'custom_field_id', type: 'number', default: 0, description: 'ID of the custom field' },
				{ displayName: 'Value', name: 'value', type: 'string', default: '', description: 'Value to set' },
			],
		},
	], description: 'Custom field values to set' },
];

export async function executeCustomFieldsOperation(this: IExecuteFunctions, operation: string, i: number): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listCustomFields') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = buildQueryParams(filters);
		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/custom_fields.json', {}, qs);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			qs['page[size]'] = limit;
			responseData = await clioApiRequest.call(this, 'GET', '/custom_fields.json', {}, qs);
			
		}
	}

	if (operation === 'getCustomField') {
		const customFieldId = this.getNodeParameter('customFieldId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/custom_fields/${customFieldId}.json`);
		
	}

	if (operation === 'getCustomFieldValues') {
		const parentType = this.getNodeParameter('parentType', i) as string;
		const parentId = this.getNodeParameter('parentId', i) as number;
		const endpoint = parentType === 'Matter' ? `/matters/${parentId}.json` : `/contacts/${parentId}.json`;
		const qs: IDataObject = { fields: 'id,custom_field_values' };
		const record = await clioApiRequest.call(this, 'GET', endpoint, {}, qs) as IDataObject;
		responseData = (record.custom_field_values as IDataObject[]) || [];
	}

	if (operation === 'setCustomFieldValues') {
		const parentType = this.getNodeParameter('parentType', i) as string;
		const parentId = this.getNodeParameter('parentId', i) as number;
		const fieldValues = this.getNodeParameter('fieldValues', i) as IDataObject;

		const customFieldValues = ((fieldValues.values as IDataObject[]) || []).map((v) => ({
			custom_field: { id: v.custom_field_id },
			value: v.value,
		}));

		const endpoint = parentType === 'Matter' ? `/matters/${parentId}.json` : `/contacts/${parentId}.json`;
		const body: IDataObject = { data: { custom_field_values: customFieldValues } };
		responseData = await clioApiRequest.call(this, 'PATCH', endpoint, body);
		
	}

	return prepareOutputData(responseData);
}
