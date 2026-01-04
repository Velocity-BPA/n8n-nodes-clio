/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest } from '../../transport/clioApi';
import { prepareOutputData } from '../../utils/helpers';

export const reportsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['reports'] } },
		options: [
			{ name: 'Billing Report', value: 'getBillingReport', description: 'Get billing report', action: 'Get billing report' },
			{ name: 'Collections Report', value: 'getCollectionsReport', description: 'Get collections report', action: 'Get collections report' },
			{ name: 'Matter Report', value: 'getMatterReport', description: 'Get matter report', action: 'Get matter report' },
			{ name: 'Productivity Report', value: 'getProductivityReport', description: 'Get productivity report', action: 'Get productivity report' },
			{ name: 'Timekeeper Report', value: 'getTimekeeperReport', description: 'Get timekeeper report', action: 'Get timekeeper report' },
		],
		default: 'getProductivityReport',
	},
];

export const reportsFields: INodeProperties[] = [
	{ displayName: 'Start Date', name: 'startDate', type: 'dateTime', required: true, displayOptions: { show: { resource: ['reports'], operation: ['getProductivityReport', 'getBillingReport', 'getCollectionsReport', 'getTimekeeperReport', 'getMatterReport'] } }, default: '', description: 'Report start date' },
	{ displayName: 'End Date', name: 'endDate', type: 'dateTime', required: true, displayOptions: { show: { resource: ['reports'], operation: ['getProductivityReport', 'getBillingReport', 'getCollectionsReport', 'getTimekeeperReport', 'getMatterReport'] } }, default: '', description: 'Report end date' },
	{ displayName: 'Filters', name: 'filters', type: 'collection', placeholder: 'Add Filter', default: {}, displayOptions: { show: { resource: ['reports'], operation: ['getProductivityReport', 'getBillingReport', 'getCollectionsReport', 'getTimekeeperReport', 'getMatterReport'] } }, options: [
		{ displayName: 'User ID', name: 'user_id', type: 'number', default: 0, description: 'Filter by user' },
		{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Filter by matter' },
		{ displayName: 'Client ID', name: 'client_id', type: 'number', default: 0, description: 'Filter by client' },
		{ displayName: 'Practice Area ID', name: 'practice_area_id', type: 'number', default: 0, description: 'Filter by practice area' },
	] },
];

export async function executeReportsOperation(this: IExecuteFunctions, operation: string, i: number): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};
	const startDate = this.getNodeParameter('startDate', i) as string;
	const endDate = this.getNodeParameter('endDate', i) as string;
	const filters = this.getNodeParameter('filters', i) as IDataObject;

	const qs: IDataObject = { from: startDate, to: endDate };
	if (filters.user_id) qs.user_id = filters.user_id;
	if (filters.matter_id) qs.matter_id = filters.matter_id;
	if (filters.client_id) qs.client_id = filters.client_id;
	if (filters.practice_area_id) qs.practice_area_id = filters.practice_area_id;

	if (operation === 'getProductivityReport') {
		responseData = await clioApiRequest.call(this, 'GET', '/reports/productivity.json', {}, qs);
		
	}

	if (operation === 'getBillingReport') {
		responseData = await clioApiRequest.call(this, 'GET', '/reports/billing.json', {}, qs);
		
	}

	if (operation === 'getCollectionsReport') {
		responseData = await clioApiRequest.call(this, 'GET', '/reports/collections.json', {}, qs);
		
	}

	if (operation === 'getTimekeeperReport') {
		responseData = await clioApiRequest.call(this, 'GET', '/reports/timekeeper.json', {}, qs);
		
	}

	if (operation === 'getMatterReport') {
		responseData = await clioApiRequest.call(this, 'GET', '/reports/matter.json', {}, qs);
		
	}

	return prepareOutputData(responseData);
}
