/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData, buildQueryParams, decimalToCents } from '../../utils/helpers';
import { TRUST_TRANSACTION_TYPES } from '../../constants';

export const trustAccountsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['trustAccounts'] } },
		options: [
			{ name: 'Create Transaction', value: 'createTrustTransaction', description: 'Create a trust transaction', action: 'Create a trust transaction' },
			{ name: 'Get Account', value: 'getTrustAccount', description: 'Get a trust account by ID', action: 'Get a trust account' },
			{ name: 'Get Balance', value: 'getTrustBalance', description: 'Get trust balance for matter', action: 'Get trust balance' },
			{ name: 'List Accounts', value: 'listTrustAccounts', description: 'List all trust accounts', action: 'List all trust accounts' },
			{ name: 'List Transactions', value: 'listTrustTransactions', description: 'List trust transactions', action: 'List trust transactions' },
		],
		default: 'listTrustAccounts',
	},
];

export const trustAccountsFields: INodeProperties[] = [
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', displayOptions: { show: { resource: ['trustAccounts'], operation: ['listTrustAccounts', 'listTrustTransactions'] } }, default: false, description: 'Whether to return all results or only up to a given limit' },
	{ displayName: 'Limit', name: 'limit', type: 'number', displayOptions: { show: { resource: ['trustAccounts'], operation: ['listTrustAccounts', 'listTrustTransactions'], returnAll: [false] } }, typeOptions: { minValue: 1, maxValue: 200 }, default: 50, description: 'Max number of results to return' },
	{ displayName: 'Trust Account ID', name: 'trustAccountId', type: 'number', required: true, displayOptions: { show: { resource: ['trustAccounts'], operation: ['getTrustAccount', 'createTrustTransaction'] } }, default: 0, description: 'The ID of the trust account' },
	{ displayName: 'Matter ID', name: 'matterId', type: 'number', required: true, displayOptions: { show: { resource: ['trustAccounts'], operation: ['getTrustBalance', 'createTrustTransaction'] } }, default: 0, description: 'The ID of the matter' },
	{ displayName: 'Filters', name: 'filters', type: 'collection', placeholder: 'Add Filter', default: {}, displayOptions: { show: { resource: ['trustAccounts'], operation: ['listTrustTransactions'] } }, options: [
		{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Filter by matter' },
		{ displayName: 'Trust Account ID', name: 'trust_account_id', type: 'number', default: 0, description: 'Filter by trust account' },
	] },
	{ displayName: 'Transaction Type', name: 'transactionType', type: 'options', required: true, displayOptions: { show: { resource: ['trustAccounts'], operation: ['createTrustTransaction'] } }, options: TRUST_TRANSACTION_TYPES, default: 'TrustDeposit', description: 'Type of transaction' },
	{ displayName: 'Amount', name: 'amount', type: 'number', required: true, displayOptions: { show: { resource: ['trustAccounts'], operation: ['createTrustTransaction'] } }, typeOptions: { numberPrecision: 2 }, default: 0, description: 'Transaction amount in dollars' },
	{ displayName: 'Additional Fields', name: 'additionalFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['trustAccounts'], operation: ['createTrustTransaction'] } }, options: [
		{ displayName: 'Date', name: 'date', type: 'dateTime', default: '', description: 'Transaction date' },
		{ displayName: 'Description', name: 'description', type: 'string', default: '', description: 'Transaction description' },
		{ displayName: 'Check Number', name: 'check_number', type: 'string', default: '', description: 'Check number if applicable' },
	] },
];

export async function executeTrustAccountsOperation(this: IExecuteFunctions, operation: string, i: number): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listTrustAccounts') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/trust_accounts.json', {}, {});
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			const qs: IDataObject = { 'page[size]': limit };
			responseData = await clioApiRequest.call(this, 'GET', '/trust_accounts.json', {}, qs);
			
		}
	}

	if (operation === 'getTrustAccount') {
		const trustAccountId = this.getNodeParameter('trustAccountId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/trust_accounts/${trustAccountId}.json`);
		
	}

	if (operation === 'getTrustBalance') {
		const matterId = this.getNodeParameter('matterId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/matters/${matterId}/trust_balance.json`);
		
	}

	if (operation === 'listTrustTransactions') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = buildQueryParams(filters);
		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/trust_line_items.json', {}, qs);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			qs['page[size]'] = limit;
			responseData = await clioApiRequest.call(this, 'GET', '/trust_line_items.json', {}, qs);
			
		}
	}

	if (operation === 'createTrustTransaction') {
		const trustAccountId = this.getNodeParameter('trustAccountId', i) as number;
		const matterId = this.getNodeParameter('matterId', i) as number;
		const transactionType = this.getNodeParameter('transactionType', i) as string;
		const amount = this.getNodeParameter('amount', i) as number;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const data: IDataObject = {
			type: transactionType,
			trust_account: { id: trustAccountId },
			matter: { id: matterId },
			amount: decimalToCents(amount),
		};

		if (additionalFields.date) data.date = additionalFields.date;
		if (additionalFields.description) data.description = additionalFields.description;
		if (additionalFields.check_number) data.check_number = additionalFields.check_number;

		const body: IDataObject = { data };
		responseData = await clioApiRequest.call(this, 'POST', '/trust_line_items.json', body);
		
	}

	return prepareOutputData(responseData);
}
