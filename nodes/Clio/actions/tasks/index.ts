/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData, buildQueryParams } from '../../utils/helpers';
import { TASK_PRIORITIES } from '../../constants';

export const tasksOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['tasks'] } },
		options: [
			{ name: 'Complete', value: 'completeTask', description: 'Mark task complete', action: 'Complete a task' },
			{ name: 'Create', value: 'createTask', description: 'Create a task', action: 'Create a task' },
			{ name: 'Delete', value: 'deleteTask', description: 'Delete a task', action: 'Delete a task' },
			{ name: 'Get', value: 'getTask', description: 'Get a task by ID', action: 'Get a task' },
			{ name: 'List', value: 'listTasks', description: 'List all tasks', action: 'List all tasks' },
			{ name: 'Update', value: 'updateTask', description: 'Update a task', action: 'Update a task' },
		],
		default: 'listTasks',
	},
];

export const tasksFields: INodeProperties[] = [
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', displayOptions: { show: { resource: ['tasks'], operation: ['listTasks'] } }, default: false, description: 'Whether to return all results or only up to a given limit' },
	{ displayName: 'Limit', name: 'limit', type: 'number', displayOptions: { show: { resource: ['tasks'], operation: ['listTasks'], returnAll: [false] } }, typeOptions: { minValue: 1, maxValue: 200 }, default: 50, description: 'Max number of results to return' },
	{ displayName: 'Filters', name: 'filters', type: 'collection', placeholder: 'Add Filter', default: {}, displayOptions: { show: { resource: ['tasks'], operation: ['listTasks'] } }, options: [
		{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Filter by matter' },
		{ displayName: 'Assignee ID', name: 'assignee_id', type: 'number', default: 0, description: 'Filter by assignee' },
		{ displayName: 'Status', name: 'status', type: 'options', options: [{ name: 'Incomplete', value: 'incomplete' }, { name: 'Complete', value: 'complete' }], default: '', description: 'Filter by status' },
	] },
	{ displayName: 'Task ID', name: 'taskId', type: 'number', required: true, displayOptions: { show: { resource: ['tasks'], operation: ['getTask', 'updateTask', 'deleteTask', 'completeTask'] } }, default: 0, description: 'The ID of the task' },
	{ displayName: 'Name', name: 'name', type: 'string', required: true, displayOptions: { show: { resource: ['tasks'], operation: ['createTask'] } }, default: '', description: 'Task name' },
	{ displayName: 'Additional Fields', name: 'additionalFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['tasks'], operation: ['createTask'] } }, options: [
		{ displayName: 'Description', name: 'description', type: 'string', default: '', description: 'Task description' },
		{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Associated matter' },
		{ displayName: 'Due Date', name: 'due_at', type: 'dateTime', default: '', description: 'Due date' },
		{ displayName: 'Priority', name: 'priority', type: 'options', options: TASK_PRIORITIES, default: 'Normal', description: 'Task priority' },
		{ displayName: 'Assignee ID', name: 'assignee_id', type: 'number', default: 0, description: 'User to assign to' },
	] },
	{ displayName: 'Update Fields', name: 'updateFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['tasks'], operation: ['updateTask'] } }, options: [
		{ displayName: 'Name', name: 'name', type: 'string', default: '', description: 'Task name' },
		{ displayName: 'Description', name: 'description', type: 'string', default: '', description: 'Description' },
		{ displayName: 'Due Date', name: 'due_at', type: 'dateTime', default: '', description: 'Due date' },
		{ displayName: 'Priority', name: 'priority', type: 'options', options: TASK_PRIORITIES, default: '', description: 'Priority' },
	] },
];

export async function executeTasksOperation(this: IExecuteFunctions, operation: string, i: number): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listTasks') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = buildQueryParams(filters);
		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/tasks.json', {}, qs);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			qs['page[size]'] = limit;
			responseData = await clioApiRequest.call(this, 'GET', '/tasks.json', {}, qs);
			
		}
	}

	if (operation === 'getTask') {
		const taskId = this.getNodeParameter('taskId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/tasks/${taskId}.json`);
		
	}

	if (operation === 'createTask') {
		const name = this.getNodeParameter('name', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const data: IDataObject = { name };
		if (additionalFields.description) data.description = additionalFields.description;
		if (additionalFields.matter_id) data.matter = { id: additionalFields.matter_id };
		if (additionalFields.due_at) data.due_at = additionalFields.due_at;
		if (additionalFields.priority) data.priority = additionalFields.priority;
		if (additionalFields.assignee_id) data.assignee = { id: additionalFields.assignee_id };

		const body: IDataObject = { data };
		responseData = await clioApiRequest.call(this, 'POST', '/tasks.json', body);
		
	}

	if (operation === 'updateTask') {
		const taskId = this.getNodeParameter('taskId', i) as number;
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		const body: IDataObject = { data: updateFields };
		responseData = await clioApiRequest.call(this, 'PATCH', `/tasks/${taskId}.json`, body);
		
	}

	if (operation === 'deleteTask') {
		const taskId = this.getNodeParameter('taskId', i) as number;
		await clioApiRequest.call(this, 'DELETE', `/tasks/${taskId}.json`);
		responseData = { success: true, taskId };
	}

	if (operation === 'completeTask') {
		const taskId = this.getNodeParameter('taskId', i) as number;
		const body: IDataObject = { data: { status: 'complete' } };
		responseData = await clioApiRequest.call(this, 'PATCH', `/tasks/${taskId}.json`, body);
		
	}

	return prepareOutputData(responseData);
}
