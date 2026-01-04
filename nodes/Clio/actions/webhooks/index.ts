/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData } from '../../utils/helpers';
import { WEBHOOK_EVENTS } from '../../constants';

export const webhooksOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['webhooks'] } },
		options: [
			{ name: 'Create', value: 'createWebhook', description: 'Create a webhook subscription', action: 'Create a webhook' },
			{ name: 'Delete', value: 'deleteWebhook', description: 'Delete a webhook subscription', action: 'Delete a webhook' },
			{ name: 'Get Events', value: 'getWebhookEvents', description: 'Get available webhook events', action: 'Get webhook events' },
			{ name: 'List', value: 'listWebhooks', description: 'List all webhook subscriptions', action: 'List webhooks' },
		],
		default: 'listWebhooks',
	},
];

export const webhooksFields: INodeProperties[] = [
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', displayOptions: { show: { resource: ['webhooks'], operation: ['listWebhooks'] } }, default: false, description: 'Whether to return all results or only up to a given limit' },
	{ displayName: 'Limit', name: 'limit', type: 'number', displayOptions: { show: { resource: ['webhooks'], operation: ['listWebhooks'], returnAll: [false] } }, typeOptions: { minValue: 1, maxValue: 200 }, default: 50, description: 'Max number of results to return' },
	{ displayName: 'Webhook ID', name: 'webhookId', type: 'number', required: true, displayOptions: { show: { resource: ['webhooks'], operation: ['deleteWebhook'] } }, default: 0, description: 'The ID of the webhook' },
	{ displayName: 'URL', name: 'url', type: 'string', required: true, displayOptions: { show: { resource: ['webhooks'], operation: ['createWebhook'] } }, default: '', description: 'URL to receive webhook notifications' },
	{ displayName: 'Events', name: 'events', type: 'multiOptions', required: true, displayOptions: { show: { resource: ['webhooks'], operation: ['createWebhook'] } }, options: WEBHOOK_EVENTS, default: [], description: 'Events to subscribe to' },
	{ displayName: 'Additional Fields', name: 'additionalFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['webhooks'], operation: ['createWebhook'] } }, options: [
		{ displayName: 'Fields', name: 'fields', type: 'string', default: '', description: 'Comma-separated list of fields to include in webhook payload' },
	] },
];

export async function executeWebhooksOperation(this: IExecuteFunctions, operation: string, i: number): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listWebhooks') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/webhooks.json', {}, {});
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			const qs: IDataObject = { 'page[size]': limit };
			responseData = await clioApiRequest.call(this, 'GET', '/webhooks.json', {}, qs);
			
		}
	}

	if (operation === 'createWebhook') {
		const url = this.getNodeParameter('url', i) as string;
		const events = this.getNodeParameter('events', i) as string[];
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const data: IDataObject = { url, events };
		if (additionalFields.fields) data.fields = additionalFields.fields;

		const body: IDataObject = { data };
		responseData = await clioApiRequest.call(this, 'POST', '/webhooks.json', body);
		
	}

	if (operation === 'deleteWebhook') {
		const webhookId = this.getNodeParameter('webhookId', i) as number;
		await clioApiRequest.call(this, 'DELETE', `/webhooks/${webhookId}.json`);
		responseData = { success: true, webhookId };
	}

	if (operation === 'getWebhookEvents') {
		responseData = WEBHOOK_EVENTS.map((event: { name: string; value: string }) => ({
			name: event.name,
			value: event.value,
		}));
	}

	return prepareOutputData(responseData);
}
