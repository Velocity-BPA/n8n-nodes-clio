/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData, buildQueryParams } from '../../utils/helpers';

export const usersOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['users'] } },
		options: [
			{ name: 'Get', value: 'getUser', description: 'Get a user by ID', action: 'Get a user' },
			{ name: 'Get Current User', value: 'getCurrentUser', description: 'Get authenticated user', action: 'Get current user' },
			{ name: 'Get Rates', value: 'getUserRates', description: 'Get billing rates for user', action: 'Get user rates' },
			{ name: 'List', value: 'listUsers', description: 'List all users', action: 'List all users' },
		],
		default: 'listUsers',
	},
];

export const usersFields: INodeProperties[] = [
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', displayOptions: { show: { resource: ['users'], operation: ['listUsers'] } }, default: false, description: 'Whether to return all results or only up to a given limit' },
	{ displayName: 'Limit', name: 'limit', type: 'number', displayOptions: { show: { resource: ['users'], operation: ['listUsers'], returnAll: [false] } }, typeOptions: { minValue: 1, maxValue: 200 }, default: 50, description: 'Max number of results to return' },
	{ displayName: 'Filters', name: 'filters', type: 'collection', placeholder: 'Add Filter', default: {}, displayOptions: { show: { resource: ['users'], operation: ['listUsers'] } }, options: [
		{ displayName: 'Enabled', name: 'enabled', type: 'boolean', default: true, description: 'Filter by enabled status' },
		{ displayName: 'Role', name: 'role', type: 'options', options: [
			{ name: 'Owner', value: 'Owner' },
			{ name: 'Admin', value: 'Admin' },
			{ name: 'Attorney', value: 'Attorney' },
			{ name: 'Paralegal', value: 'Paralegal' },
			{ name: 'Staff', value: 'Staff' },
		], default: '', description: 'Filter by role' },
	] },
	{ displayName: 'User ID', name: 'userId', type: 'number', required: true, displayOptions: { show: { resource: ['users'], operation: ['getUser', 'getUserRates'] } }, default: 0, description: 'The ID of the user' },
];

export async function executeUsersOperation(this: IExecuteFunctions, operation: string, i: number): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listUsers') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = buildQueryParams(filters);
		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/users.json', {}, qs);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			qs['page[size]'] = limit;
			responseData = await clioApiRequest.call(this, 'GET', '/users.json', {}, qs);
			
		}
	}

	if (operation === 'getUser') {
		const userId = this.getNodeParameter('userId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/users/${userId}.json`);
		
	}

	if (operation === 'getCurrentUser') {
		responseData = await clioApiRequest.call(this, 'GET', '/users/who_am_i.json');
		
	}

	if (operation === 'getUserRates') {
		const userId = this.getNodeParameter('userId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/users/${userId}/rates.json`);
		
	}

	return prepareOutputData(responseData);
}
