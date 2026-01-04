/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination } from '../../transport/clioApi';
import { prepareOutputData, buildQueryParams } from '../../utils/helpers';

export const notesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['notes'] } },
		options: [
			{ name: 'Create', value: 'createNote', description: 'Create a note', action: 'Create a note' },
			{ name: 'Delete', value: 'deleteNote', description: 'Delete a note', action: 'Delete a note' },
			{ name: 'Get', value: 'getNote', description: 'Get a note by ID', action: 'Get a note' },
			{ name: 'List', value: 'listNotes', description: 'List all notes', action: 'List all notes' },
			{ name: 'Update', value: 'updateNote', description: 'Update a note', action: 'Update a note' },
		],
		default: 'listNotes',
	},
];

export const notesFields: INodeProperties[] = [
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', displayOptions: { show: { resource: ['notes'], operation: ['listNotes'] } }, default: false, description: 'Whether to return all results or only up to a given limit' },
	{ displayName: 'Limit', name: 'limit', type: 'number', displayOptions: { show: { resource: ['notes'], operation: ['listNotes'], returnAll: [false] } }, typeOptions: { minValue: 1, maxValue: 200 }, default: 50, description: 'Max number of results to return' },
	{ displayName: 'Filters', name: 'filters', type: 'collection', placeholder: 'Add Filter', default: {}, displayOptions: { show: { resource: ['notes'], operation: ['listNotes'] } }, options: [
		{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Filter by matter' },
		{ displayName: 'Contact ID', name: 'contact_id', type: 'number', default: 0, description: 'Filter by contact' },
	] },
	{ displayName: 'Note ID', name: 'noteId', type: 'number', required: true, displayOptions: { show: { resource: ['notes'], operation: ['getNote', 'updateNote', 'deleteNote'] } }, default: 0, description: 'The ID of the note' },
	{ displayName: 'Subject', name: 'subject', type: 'string', required: true, displayOptions: { show: { resource: ['notes'], operation: ['createNote'] } }, default: '', description: 'Note subject' },
	{ displayName: 'Detail', name: 'detail', type: 'string', typeOptions: { rows: 4 }, displayOptions: { show: { resource: ['notes'], operation: ['createNote'] } }, default: '', description: 'Note content' },
	{ displayName: 'Additional Fields', name: 'additionalFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['notes'], operation: ['createNote'] } }, options: [
		{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Associated matter' },
		{ displayName: 'Contact ID', name: 'contact_id', type: 'number', default: 0, description: 'Associated contact' },
		{ displayName: 'Date', name: 'date', type: 'dateTime', default: '', description: 'Note date' },
	] },
	{ displayName: 'Update Fields', name: 'updateFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['notes'], operation: ['updateNote'] } }, options: [
		{ displayName: 'Subject', name: 'subject', type: 'string', default: '', description: 'Note subject' },
		{ displayName: 'Detail', name: 'detail', type: 'string', typeOptions: { rows: 4 }, default: '', description: 'Note content' },
	] },
];

export async function executeNotesOperation(this: IExecuteFunctions, operation: string, i: number): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listNotes') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = buildQueryParams(filters);
		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/notes.json', {}, qs);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			qs['page[size]'] = limit;
			responseData = await clioApiRequest.call(this, 'GET', '/notes.json', {}, qs);
			
		}
	}

	if (operation === 'getNote') {
		const noteId = this.getNodeParameter('noteId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/notes/${noteId}.json`);
		
	}

	if (operation === 'createNote') {
		const subject = this.getNodeParameter('subject', i) as string;
		const detail = this.getNodeParameter('detail', i, '') as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const data: IDataObject = { subject, detail };
		if (additionalFields.matter_id) data.matter = { id: additionalFields.matter_id };
		if (additionalFields.contact_id) data.contact = { id: additionalFields.contact_id };
		if (additionalFields.date) data.date = additionalFields.date;

		const body: IDataObject = { data };
		responseData = await clioApiRequest.call(this, 'POST', '/notes.json', body);
		
	}

	if (operation === 'updateNote') {
		const noteId = this.getNodeParameter('noteId', i) as number;
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		const body: IDataObject = { data: updateFields };
		responseData = await clioApiRequest.call(this, 'PATCH', `/notes/${noteId}.json`, body);
		
	}

	if (operation === 'deleteNote') {
		const noteId = this.getNodeParameter('noteId', i) as number;
		await clioApiRequest.call(this, 'DELETE', `/notes/${noteId}.json`);
		responseData = { success: true, noteId };
	}

	return prepareOutputData(responseData);
}
