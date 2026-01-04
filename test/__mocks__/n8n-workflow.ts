/*
 * Mock for n8n-workflow module
 */

export interface IDataObject {
	[key: string]: unknown;
}

export interface INodeExecutionData {
	json: IDataObject;
	binary?: unknown;
	pairedItem?: unknown;
}

export interface INodePropertyOptions {
	name: string;
	value: string | number;
	description?: string;
	action?: string;
}

export interface INodeProperties {
	displayName: string;
	name: string;
	type: string;
	default?: unknown;
	required?: boolean;
	description?: string;
	options?: INodePropertyOptions[];
	displayOptions?: unknown;
	typeOptions?: unknown;
	placeholder?: string;
	noDataExpression?: boolean;
}

export interface ICredentialType {
	name: string;
	displayName: string;
	properties: INodeProperties[];
}

export interface INodeTypeDescription {
	displayName: string;
	name: string;
	icon?: string;
	group: string[];
	version: number;
	subtitle?: string;
	description: string;
	defaults: { name: string };
	inputs: string[];
	outputs: string[];
	credentials?: Array<{ name: string; required?: boolean }>;
	webhooks?: Array<{
		name: string;
		httpMethod: string;
		responseMode: string;
		path: string;
	}>;
	properties: INodeProperties[];
}

export interface INodeType {
	description: INodeTypeDescription;
}

export interface IWebhookResponseData {
	webhookResponse?: unknown;
	workflowData: unknown[];
}

export type IHttpRequestMethods = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface IHttpRequestOptions {
	method: IHttpRequestMethods;
	url: string;
	headers?: IDataObject;
	qs?: IDataObject;
	body?: unknown;
	json?: boolean;
	encoding?: string;
	returnFullResponse?: boolean;
}

export interface IExecuteFunctions {
	getCredentials(name: string): Promise<IDataObject>;
	getNodeParameter(name: string, index: number): unknown;
	helpers: {
		httpRequestWithAuthentication: {
			call(context: unknown, credentialType: string, options: IHttpRequestOptions): Promise<unknown>;
		};
		assertBinaryData(index: number, propertyName: string): { mimeType: string };
		getBinaryDataBuffer(index: number, propertyName: string): Promise<Buffer>;
		prepareBinaryData(buffer: Buffer, filename: string): Promise<IDataObject>;
		returnJsonArray(data: unknown[]): unknown[];
	};
	getNode(): { name: string };
}

export interface ILoadOptionsFunctions {
	getCredentials(name: string): Promise<IDataObject>;
}

export interface IHookFunctions {
	getCredentials(name: string): Promise<IDataObject>;
	getNodeWebhookUrl(name: string): string;
	getWorkflowStaticData(type: string): IDataObject;
	getNodeParameter(name: string): unknown;
	logger: {
		warn(message: string): void;
	};
}

export interface IWebhookFunctions {
	getBodyData(): IDataObject;
	getHeaderData(): IDataObject;
	helpers: {
		returnJsonArray(data: unknown[]): unknown[];
	};
}

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

export interface JsonObject {
	[key: string]: JsonValue;
}

export class NodeApiError extends Error {
	constructor(node: { name: string }, error: JsonObject, options?: { message?: string }) {
		super(options?.message || 'API Error');
		this.name = 'NodeApiError';
	}
}

export interface INodePropertyCollection {
	name: string;
	displayName: string;
	values: INodeProperties[];
}
