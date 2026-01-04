/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData, buildQueryParams } from '../../utils/helpers';
import { CONTACT_TYPES } from '../../constants';

export const contactsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['contacts'] } },
		options: [
			{ name: 'Create', value: 'createContact', description: 'Create a new contact', action: 'Create a contact' },
			{ name: 'Delete', value: 'deleteContact', description: 'Delete a contact', action: 'Delete a contact' },
			{ name: 'Get', value: 'getContact', description: 'Get a contact by ID', action: 'Get a contact' },
			{ name: 'List', value: 'listContacts', description: 'List all contacts', action: 'List all contacts' },
			{ name: 'Update', value: 'updateContact', description: 'Update a contact', action: 'Update a contact' },
		],
		default: 'listContacts',
	},
];

export const contactsFields: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: { resource: ['contacts'], operation: ['listContacts'] } },
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: { show: { resource: ['contacts'], operation: ['listContacts'], returnAll: [false] } },
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
		displayOptions: { show: { resource: ['contacts'], operation: ['listContacts'] } },
		options: [
			{ displayName: 'Type', name: 'type', type: 'options', options: CONTACT_TYPES, default: '', description: 'Filter by type' },
			{ displayName: 'Query', name: 'query', type: 'string', default: '', description: 'Search query' },
			{ displayName: 'Created Since', name: 'created_since', type: 'dateTime', default: '', description: 'Filter by creation date' },
			{ displayName: 'Updated Since', name: 'updated_since', type: 'dateTime', default: '', description: 'Filter by update date' },
		],
	},
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['contacts'], operation: ['getContact', 'updateContact', 'deleteContact'] } },
		default: 0,
		description: 'The ID of the contact',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		required: true,
		displayOptions: { show: { resource: ['contacts'], operation: ['createContact'] } },
		options: CONTACT_TYPES,
		default: 'Person',
		description: 'Type of contact',
	},
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		displayOptions: { show: { resource: ['contacts'], operation: ['createContact'], type: ['Person'] } },
		default: '',
		description: 'First name (for Person type)',
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		displayOptions: { show: { resource: ['contacts'], operation: ['createContact'], type: ['Person'] } },
		default: '',
		description: 'Last name (for Person type)',
	},
	{
		displayName: 'Company Name',
		name: 'companyName',
		type: 'string',
		displayOptions: { show: { resource: ['contacts'], operation: ['createContact'], type: ['Company'] } },
		default: '',
		description: 'Company name (for Company type)',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['contacts'], operation: ['createContact'] } },
		options: [
			{ displayName: 'Email', name: 'email', type: 'string', default: '', description: 'Primary email address' },
			{ displayName: 'Phone', name: 'phone', type: 'string', default: '', description: 'Primary phone number' },
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['contacts'], operation: ['updateContact'] } },
		options: [
			{ displayName: 'First Name', name: 'first_name', type: 'string', default: '', description: 'First name' },
			{ displayName: 'Last Name', name: 'last_name', type: 'string', default: '', description: 'Last name' },
			{ displayName: 'Name', name: 'name', type: 'string', default: '', description: 'Full name or company name' },
		],
	},
];

export async function executeContactsOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listContacts') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = buildQueryParams(filters);

		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/contacts.json', {}, qs);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			qs['page[size]'] = limit;
			responseData = await clioApiRequest.call(this, 'GET', '/contacts.json', {}, qs);
			
		}
	}

	if (operation === 'getContact') {
		const contactId = this.getNodeParameter('contactId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/contacts/${contactId}.json`);
		
	}

	if (operation === 'createContact') {
		const type = this.getNodeParameter('type', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const data: IDataObject = { type };

		if (type === 'Person') {
			data.first_name = this.getNodeParameter('firstName', i, '') as string;
			data.last_name = this.getNodeParameter('lastName', i, '') as string;
		} else {
			data.name = this.getNodeParameter('companyName', i, '') as string;
		}

		if (additionalFields.email) {
			data.email_addresses = [{ name: 'Primary', address: additionalFields.email, default_email: true }];
		}
		if (additionalFields.phone) {
			data.phone_numbers = [{ name: 'Primary', number: additionalFields.phone, default_number: true }];
		}

		const body: IDataObject = { data };
		responseData = await clioApiRequest.call(this, 'POST', '/contacts.json', body);
		
	}

	if (operation === 'updateContact') {
		const contactId = this.getNodeParameter('contactId', i) as number;
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

		const body: IDataObject = { data: updateFields };
		responseData = await clioApiRequest.call(this, 'PATCH', `/contacts/${contactId}.json`, body);
		
	}

	if (operation === 'deleteContact') {
		const contactId = this.getNodeParameter('contactId', i) as number;
		await clioApiRequest.call(this, 'DELETE', `/contacts/${contactId}.json`);
		responseData = { success: true, contactId };
	}

	return prepareOutputData(responseData);
}
