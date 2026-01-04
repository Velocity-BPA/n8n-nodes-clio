/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	INodeExecutionData,
} from 'n8n-workflow';

import { mattersOperations, mattersFields, executeMattersOperation } from './actions/matters';
import { contactsOperations, contactsFields, executeContactsOperation } from './actions/contacts';
import { activitiesOperations, activitiesFields, executeActivitiesOperation } from './actions/activities';
import { billsOperations, billsFields, executeBillsOperation } from './actions/bills';
import { expensesOperations, expensesFields, executeExpensesOperation } from './actions/expenses';
import { tasksOperations, tasksFields, executeTasksOperation } from './actions/tasks';
import { calendarEntriesOperations, calendarEntriesFields, executeCalendarEntriesOperation } from './actions/calendarEntries';
import { documentsOperations, documentsFields, executeDocumentsOperation } from './actions/documents';
import { notesOperations, notesFields, executeNotesOperation } from './actions/notes';
import { communicationsOperations, communicationsFields, executeCommunicationsOperation } from './actions/communications';
import { trustAccountsOperations, trustAccountsFields, executeTrustAccountsOperation } from './actions/trustAccounts';
import { usersOperations, usersFields, executeUsersOperation } from './actions/users';
import { practiceAreasOperations, practiceAreasFields, executePracticeAreasOperation } from './actions/practiceAreas';
import { customFieldsOperations, customFieldsFields, executeCustomFieldsOperation } from './actions/customFields';
import { reportsOperations, reportsFields, executeReportsOperation } from './actions/reports';
import { webhooksOperations, webhooksFields, executeWebhooksOperation } from './actions/webhooks';

const LICENSING_NOTICE = `
[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`;

let licensingNoticeShown = false;

export class Clio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Clio',
		name: 'clio',
		icon: 'file:clio.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Clio legal practice management API',
		defaults: { name: 'Clio' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'clioOAuth2Api', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Activity', value: 'activities', description: 'Manage time entries and activities' },
					{ name: 'Bill', value: 'bills', description: 'Manage invoices and billing' },
					{ name: 'Calendar Entry', value: 'calendarEntries', description: 'Manage calendar events' },
					{ name: 'Communication', value: 'communications', description: 'Log emails, calls, and messages' },
					{ name: 'Contact', value: 'contacts', description: 'Manage clients and contacts' },
					{ name: 'Custom Field', value: 'customFields', description: 'Manage custom field values' },
					{ name: 'Document', value: 'documents', description: 'Manage documents and folders' },
					{ name: 'Expense', value: 'expenses', description: 'Track expenses' },
					{ name: 'Matter', value: 'matters', description: 'Manage legal matters/cases' },
					{ name: 'Note', value: 'notes', description: 'Add notes to matters and contacts' },
					{ name: 'Practice Area', value: 'practiceAreas', description: 'Manage practice areas' },
					{ name: 'Report', value: 'reports', description: 'Generate reports' },
					{ name: 'Task', value: 'tasks', description: 'Manage tasks and to-dos' },
					{ name: 'Trust Account', value: 'trustAccounts', description: 'Manage IOLTA/trust accounts' },
					{ name: 'User', value: 'users', description: 'Manage firm users' },
					{ name: 'Webhook', value: 'webhooks', description: 'Manage webhook subscriptions' },
				],
				default: 'matters',
			},
			...mattersOperations, ...contactsOperations, ...activitiesOperations, ...billsOperations,
			...expensesOperations, ...tasksOperations, ...calendarEntriesOperations, ...documentsOperations,
			...notesOperations, ...communicationsOperations, ...trustAccountsOperations, ...usersOperations,
			...practiceAreasOperations, ...customFieldsOperations, ...reportsOperations, ...webhooksOperations,
			...mattersFields, ...contactsFields, ...activitiesFields, ...billsFields,
			...expensesFields, ...tasksFields, ...calendarEntriesFields, ...documentsFields,
			...notesFields, ...communicationsFields, ...trustAccountsFields, ...usersFields,
			...practiceAreasFields, ...customFieldsFields, ...reportsFields, ...webhooksFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		if (!licensingNoticeShown) {
			this.logger.warn(LICENSING_NOTICE);
			licensingNoticeShown = true;
		}

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result: INodeExecutionData[] = [];

				switch (resource) {
					case 'matters': result = await executeMattersOperation.call(this, operation, i); break;
					case 'contacts': result = await executeContactsOperation.call(this, operation, i); break;
					case 'activities': result = await executeActivitiesOperation.call(this, operation, i); break;
					case 'bills': result = await executeBillsOperation.call(this, operation, i); break;
					case 'expenses': result = await executeExpensesOperation.call(this, operation, i); break;
					case 'tasks': result = await executeTasksOperation.call(this, operation, i); break;
					case 'calendarEntries': result = await executeCalendarEntriesOperation.call(this, operation, i); break;
					case 'documents': result = await executeDocumentsOperation.call(this, operation, i); break;
					case 'notes': result = await executeNotesOperation.call(this, operation, i); break;
					case 'communications': result = await executeCommunicationsOperation.call(this, operation, i); break;
					case 'trustAccounts': result = await executeTrustAccountsOperation.call(this, operation, i); break;
					case 'users': result = await executeUsersOperation.call(this, operation, i); break;
					case 'practiceAreas': result = await executePracticeAreasOperation.call(this, operation, i); break;
					case 'customFields': result = await executeCustomFieldsOperation.call(this, operation, i); break;
					case 'reports': result = await executeReportsOperation.call(this, operation, i); break;
					case 'webhooks': result = await executeWebhooksOperation.call(this, operation, i); break;
					default: throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
