/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
} from 'n8n-workflow';
import { clioApiRequest } from './transport/clioApi';
import { WEBHOOK_EVENTS } from './constants';

const LICENSING_NOTICE = `
[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`;

let licensingNoticeShown = false;

export class ClioTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Clio Trigger',
		name: 'clioTrigger',
		icon: 'file:clio.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Receive webhook notifications from Clio',
		defaults: { name: 'Clio Trigger' },
		inputs: [],
		outputs: ['main'],
		credentials: [{ name: 'clioOAuth2Api', required: true }],
		webhooks: [{ name: 'default', httpMethod: 'POST', responseMode: 'onReceived', path: 'webhook' }],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: WEBHOOK_EVENTS,
				default: [],
				description: 'The events to listen to',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Fields',
						name: 'fields',
						type: 'string',
						default: '',
						description: 'Comma-separated list of fields to include in webhook payload',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId) {
					try {
						const webhookRecord = await clioApiRequest.call(
							this,
							'GET',
							`/webhooks/${webhookData.webhookId}.json`,
						) as IDataObject;
						if (webhookRecord && webhookRecord.url === webhookUrl) {
							return true;
						}
					} catch {
						delete webhookData.webhookId;
					}
				}

				try {
					const webhooks = await clioApiRequest.call(this, 'GET', '/webhooks.json') as IDataObject[];
					if (Array.isArray(webhooks)) {
						for (const webhook of webhooks) {
							if (webhook.url === webhookUrl) {
								webhookData.webhookId = webhook.id;
								return true;
							}
						}
					}
				} catch {
					// Unable to check webhooks
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				if (!licensingNoticeShown) {
					this.logger.warn(LICENSING_NOTICE);
					licensingNoticeShown = true;
				}

				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const webhookData = this.getWorkflowStaticData('node');
				const events = this.getNodeParameter('events') as string[];
				const options = this.getNodeParameter('options') as IDataObject;

				const body: IDataObject = { data: { url: webhookUrl, events } };
				if (options.fields) {
					(body.data as IDataObject).fields = options.fields;
				}

				try {
					const webhookRecord = await clioApiRequest.call(this, 'POST', '/webhooks.json', body) as IDataObject;
					if (webhookRecord?.id) {
						webhookData.webhookId = webhookRecord.id;
						return true;
					}
				} catch (error) {
					throw new Error(`Failed to create Clio webhook: ${(error as Error).message}`);
				}

				return false;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId) {
					try {
						await clioApiRequest.call(this, 'DELETE', `/webhooks/${webhookData.webhookId}.json`);
					} catch (error) {
						this.logger.warn(`Failed to delete Clio webhook: ${(error as Error).message}`);
					}
					delete webhookData.webhookId;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as IDataObject;
		const headerData = this.getHeaderData() as IDataObject;

		if (bodyData.type === 'webhook.verification') {
			return {
				webhookResponse: { status: 200, body: { challenge: bodyData.challenge } },
				workflowData: [],
			};
		}

		const returnData: IDataObject = {
			event: bodyData.type || bodyData.event,
			data: bodyData.data || bodyData,
			timestamp: headerData['x-clio-timestamp'] || new Date().toISOString(),
			raw: bodyData,
		};

		return { workflowData: [this.helpers.returnJsonArray([returnData])] };
	}
}
