/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { clioApiRequest, clioApiRequestWithPagination, uploadDocument, downloadDocument } from '../../transport/clioApi';
import { prepareOutputData, buildQueryParams } from '../../utils/helpers';

export const documentsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['documents'] } },
		options: [
			{ name: 'Delete', value: 'deleteDocument', description: 'Delete a document', action: 'Delete a document' },
			{ name: 'Download', value: 'downloadDocument', description: 'Download a document', action: 'Download a document' },
			{ name: 'Get', value: 'getDocument', description: 'Get a document by ID', action: 'Get a document' },
			{ name: 'List', value: 'listDocuments', description: 'List all documents', action: 'List all documents' },
			{ name: 'Upload', value: 'uploadDocument', description: 'Upload a document', action: 'Upload a document' },
		],
		default: 'listDocuments',
	},
];

export const documentsFields: INodeProperties[] = [
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', displayOptions: { show: { resource: ['documents'], operation: ['listDocuments'] } }, default: false, description: 'Whether to return all results or only up to a given limit' },
	{ displayName: 'Limit', name: 'limit', type: 'number', displayOptions: { show: { resource: ['documents'], operation: ['listDocuments'], returnAll: [false] } }, typeOptions: { minValue: 1, maxValue: 200 }, default: 50, description: 'Max number of results to return' },
	{ displayName: 'Filters', name: 'filters', type: 'collection', placeholder: 'Add Filter', default: {}, displayOptions: { show: { resource: ['documents'], operation: ['listDocuments'] } }, options: [
		{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Filter by matter' },
		{ displayName: 'Query', name: 'query', type: 'string', default: '', description: 'Search query' },
	] },
	{ displayName: 'Document ID', name: 'documentId', type: 'number', required: true, displayOptions: { show: { resource: ['documents'], operation: ['getDocument', 'deleteDocument', 'downloadDocument'] } }, default: 0, description: 'The ID of the document' },
	{ displayName: 'File Name', name: 'fileName', type: 'string', required: true, displayOptions: { show: { resource: ['documents'], operation: ['uploadDocument'] } }, default: '', description: 'Name for the document' },
	{ displayName: 'Binary Property', name: 'binaryPropertyName', type: 'string', required: true, displayOptions: { show: { resource: ['documents'], operation: ['uploadDocument'] } }, default: 'data', description: 'Name of the binary property containing the file' },
	{ displayName: 'Additional Fields', name: 'additionalFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['documents'], operation: ['uploadDocument'] } }, options: [
		{ displayName: 'Matter ID', name: 'matter_id', type: 'number', default: 0, description: 'Associated matter' },
		{ displayName: 'Description', name: 'description', type: 'string', default: '', description: 'Document description' },
	] },
];

export async function executeDocumentsOperation(this: IExecuteFunctions, operation: string, i: number): Promise<INodeExecutionData[]> {
	let responseData: IDataObject | IDataObject[] = {};

	if (operation === 'listDocuments') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = buildQueryParams(filters);
		if (returnAll) {
			responseData = await clioApiRequestWithPagination.call(this, 'GET', '/documents.json', {}, qs);
		} else {
			const limit = this.getNodeParameter('limit', i) as number;
			qs['page[size]'] = limit;
			responseData = await clioApiRequest.call(this, 'GET', '/documents.json', {}, qs);
			
		}
	}

	if (operation === 'getDocument') {
		const documentId = this.getNodeParameter('documentId', i) as number;
		responseData = await clioApiRequest.call(this, 'GET', `/documents/${documentId}.json`);
		
	}

	if (operation === 'uploadDocument') {
		const fileName = this.getNodeParameter('fileName', i) as string;
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
		const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

		const docData: IDataObject = {};
		if (additionalFields.matter_id) docData.matter = { id: additionalFields.matter_id };
		if (additionalFields.description) docData.description = additionalFields.description;

		responseData = await uploadDocument.call(this, '/documents.json', buffer, fileName, binaryData.mimeType || 'application/octet-stream', docData);
	}

	if (operation === 'deleteDocument') {
		const documentId = this.getNodeParameter('documentId', i) as number;
		await clioApiRequest.call(this, 'DELETE', `/documents/${documentId}.json`);
		responseData = { success: true, documentId };
	}

	if (operation === 'downloadDocument') {
		const documentId = this.getNodeParameter('documentId', i) as number;
		const fileBuffer = await downloadDocument.call(this, `/documents/${documentId}/download.json`);
		const binaryData = await this.helpers.prepareBinaryData(fileBuffer, `document_${documentId}`);
		return [{ json: { documentId }, binary: { data: binaryData } }];
	}

	return prepareOutputData(responseData);
}
