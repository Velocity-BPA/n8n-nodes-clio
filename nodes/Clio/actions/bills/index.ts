/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData, buildQueryParams, decimalToCents } from '../../utils/helpers';
import { BILL_STATES } from '../../constants';

export const billsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['bills'] } },
		options: [
			{ name: 'Create', value: 'createBill', description: 'Create a bill', action: 'Create a bill' },
			{ name: 'Delete', value: 'deleteBill', description: 'Delete a bill', action: 'Delete a bill' },
			{ name: 'Get', value: 'getBill', description: 'Get a bill by ID', action: 'Get a bill' },
			{ name: 'List', value: 'listBills', description: 'List all bills', action: 'List all bills' },
			{ name: 'Record Payment', value: 'recordPayment', description: 'Record a payment', action: 'Record a payment' },
			{ name: 'Update', value: 'updateBill', description: 'Update a bill', action: 'Update a bill' },
		],
		default: 'listBills',
	},
];

export const billsFields: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: { resource: ['bills'], operation: ['listBills'] } },
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: { show: { resource: ['bills'], operation: ['listBills'], returnAll: [false] } },
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
		displayOptions: { show: { resource: ['bills'], operation: ['listBills'] } },
		options: [
			{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Filter by matter' },
			{ displayName: 'State', name: 'state', type: 'options', options: BILL_STATES, default: '', description: 'Filter by bill state' },
			{ displayName: 'Client ID', name: 'client_id', type: 'number', default: 0, description: 'Filter by client' },
		],
	},
	{
		displayName: 'Bill ID',
		name: 'billId',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['bills'], operation: ['getBill', 'updateBill', 'deleteBill', 'recordPayment'] } },
		default: 0,
		description: 'The ID of the bill',
	},
	{
		displayName: 'Matter ID',
		name: 'matterId',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['bills'], operation: ['createBill'] } },
		default: 0,
		description: 'ID of the matter',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['bills'], operation: ['createBill'] } },
		options: [
			{ displayName: 'Due Date', name: 'due_at', type: 'dateTime', default: '', description: 'Due date for the bill' },
			{ displayName: 'Issue Date', name: 'issued_at', type: 'dateTime', default: '', description: 'Issue date' },
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['bills'], operation: ['updateBill'] } },
		options: [
			{ displayName: 'State', name: 'state', type: 'options', options: BILL_STATES, default: '', description: 'Bill state' },
			{ displayName: 'Due Date', name: 'due_at', type: 'dateTime', default: '', description: 'Due date' },
		],
	},
	{
		displayName: 'Payment Amount',
		name: 'paymentAmount',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['bills'], operation: ['recordPayment'] } },
		typeOptions: { numberPrecision: 2 },
		default: 0,
		description: 'Payment amount in dollars',
	},
	{
		displayName: 'Payment Date',
		name: 'paymentDate',
		type: 'dateTime',
		required: true,
		displayOptions: { show: { resource: ['bills'], operation: ['recordPayment'] } },
		default: '',
		description: 'Date of payment',
	},
];

export async function executeBillsOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listBills') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = buildQueryParams(filters);

		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/bills.json', {}, qs);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			qs['page[size]'] = limit;
			responseData = await clioApiRequest.call(this, 'GET', '/bills.json', {}, qs);
			
		}
	}

	if (operation === 'getBill') {
		const billId = this.getNodeParameter('billId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/bills/${billId}.json`);
		
	}

	if (operation === 'createBill') {
		const matterId = this.getNodeParameter('matterId', i) as number;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const data: IDataObject = { matter: { id: matterId } };
		if (additionalFields.due_at) data.due_at = additionalFields.due_at;
		if (additionalFields.issued_at) data.issued_at = additionalFields.issued_at;

		const body: IDataObject = { data };
		responseData = await clioApiRequest.call(this, 'POST', '/bills.json', body);
		
	}

	if (operation === 'updateBill') {
		const billId = this.getNodeParameter('billId', i) as number;
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

		const body: IDataObject = { data: updateFields };
		responseData = await clioApiRequest.call(this, 'PATCH', `/bills/${billId}.json`, body);
		
	}

	if (operation === 'deleteBill') {
		const billId = this.getNodeParameter('billId', i) as number;
		await clioApiRequest.call(this, 'DELETE', `/bills/${billId}.json`);
		responseData = { success: true, billId };
	}

	if (operation === 'recordPayment') {
		const billId = this.getNodeParameter('billId', i) as number;
		const paymentAmount = this.getNodeParameter('paymentAmount', i) as number;
		const paymentDate = this.getNodeParameter('paymentDate', i) as string;

		const body: IDataObject = {
			data: {
				bill: { id: billId },
				amount: decimalToCents(paymentAmount),
				date: paymentDate,
			},
		};
		responseData = await clioApiRequest.call(this, 'POST', '/payments.json', body);
		
	}

	return prepareOutputData(responseData);
}
