/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData, buildQueryParams, decimalToCents } from '../../utils/helpers';

export const expensesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['expenses'] } },
		options: [
			{ name: 'Create', value: 'createExpense', description: 'Create an expense', action: 'Create an expense' },
			{ name: 'Delete', value: 'deleteExpense', description: 'Delete an expense', action: 'Delete an expense' },
			{ name: 'Get', value: 'getExpense', description: 'Get an expense by ID', action: 'Get an expense' },
			{ name: 'List', value: 'listExpenses', description: 'List all expenses', action: 'List all expenses' },
			{ name: 'Update', value: 'updateExpense', description: 'Update an expense', action: 'Update an expense' },
		],
		default: 'listExpenses',
	},
];

export const expensesFields: INodeProperties[] = [
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', displayOptions: { show: { resource: ['expenses'], operation: ['listExpenses'] } }, default: false, description: 'Whether to return all results or only up to a given limit' },
	{ displayName: 'Limit', name: 'limit', type: 'number', displayOptions: { show: { resource: ['expenses'], operation: ['listExpenses'], returnAll: [false] } }, typeOptions: { minValue: 1, maxValue: 200 }, default: 50, description: 'Max number of results to return' },
	{ displayName: 'Filters', name: 'filters', type: 'collection', placeholder: 'Add Filter', default: {}, displayOptions: { show: { resource: ['expenses'], operation: ['listExpenses'] } }, options: [
		{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Filter by matter' },
	] },
	{ displayName: 'Expense ID', name: 'expenseId', type: 'number', required: true, displayOptions: { show: { resource: ['expenses'], operation: ['getExpense', 'updateExpense', 'deleteExpense'] } }, default: 0, description: 'The ID of the expense' },
	{ displayName: 'Matter ID', name: 'matterId', type: 'number', required: true, displayOptions: { show: { resource: ['expenses'], operation: ['createExpense'] } }, default: 0, description: 'ID of the matter' },
	{ displayName: 'Amount', name: 'amount', type: 'number', required: true, displayOptions: { show: { resource: ['expenses'], operation: ['createExpense'] } }, typeOptions: { numberPrecision: 2 }, default: 0, description: 'Expense amount in dollars' },
	{ displayName: 'Additional Fields', name: 'additionalFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['expenses'], operation: ['createExpense'] } }, options: [
		{ displayName: 'Date', name: 'date', type: 'dateTime', default: '', description: 'Date of expense' },
		{ displayName: 'Note', name: 'note', type: 'string', default: '', description: 'Description' },
	] },
	{ displayName: 'Update Fields', name: 'updateFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['expenses'], operation: ['updateExpense'] } }, options: [
		{ displayName: 'Amount', name: 'total', type: 'number', typeOptions: { numberPrecision: 2 }, default: 0, description: 'Amount' },
		{ displayName: 'Note', name: 'note', type: 'string', default: '', description: 'Description' },
	] },
];

export async function executeExpensesOperation(this: IExecuteFunctions, operation: string, i: number): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listExpenses') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = buildQueryParams(filters);
		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/expenses.json', {}, qs);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			qs['page[size]'] = limit;
			responseData = await clioApiRequest.call(this, 'GET', '/expenses.json', {}, qs);
			
		}
	}

	if (operation === 'getExpense') {
		const expenseId = this.getNodeParameter('expenseId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/expenses/${expenseId}.json`);
		
	}

	if (operation === 'createExpense') {
		const matterId = this.getNodeParameter('matterId', i) as number;
		const amount = this.getNodeParameter('amount', i) as number;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const data: IDataObject = { matter: { id: matterId }, total: decimalToCents(amount), type: 'ExpenseEntry' };
		if (additionalFields.date) data.date = additionalFields.date;
		if (additionalFields.note) data.note = additionalFields.note;

		const body: IDataObject = { data };
		responseData = await clioApiRequest.call(this, 'POST', '/expenses.json', body);
		
	}

	if (operation === 'updateExpense') {
		const expenseId = this.getNodeParameter('expenseId', i) as number;
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		if (updateFields.total) updateFields.total = decimalToCents(updateFields.total as number);
		const body: IDataObject = { data: updateFields };
		responseData = await clioApiRequest.call(this, 'PATCH', `/expenses/${expenseId}.json`, body);
		
	}

	if (operation === 'deleteExpense') {
		const expenseId = this.getNodeParameter('expenseId', i) as number;
		await clioApiRequest.call(this, 'DELETE', `/expenses/${expenseId}.json`);
		responseData = { success: true, expenseId };
	}

	return prepareOutputData(responseData);
}
