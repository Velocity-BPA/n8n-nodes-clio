/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  IHookFunctions,
  ILoadOptionsFunctions,
  IDataObject,
  IHttpRequestMethods,
  IHttpRequestOptions,
  INodePropertyOptions,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { API_ENDPOINTS, DEFAULT_PAGE_SIZE } from '../constants/constants';

export interface IClioApiResponse {
  data: IDataObject | IDataObject[];
  meta?: {
    paging?: {
      next?: string;
      previous?: string;
    };
    records?: number;
  };
}

export function getBaseUrl(region: string): string {
  return API_ENDPOINTS[region] || API_ENDPOINTS.us;
}

export async function clioApiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
  headers: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
  const credentials = await this.getCredentials('clioOAuth2Api');
  const region = (credentials.region as string) || 'us';
  const baseUrl = getBaseUrl(region);

  const options: IHttpRequestOptions = {
    method,
    url: `${baseUrl}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
    qs,
    json: true,
  };

  if (Object.keys(body).length > 0) {
    options.body = body;
  }

  try {
    const response = await this.helpers.httpRequestWithAuthentication.call(
      this,
      'clioOAuth2Api',
      options,
    );

    if (response.data !== undefined) {
      return response.data;
    }

    return response;
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: (error as Error).message,
    });
  }
}

export async function clioApiRequestWithMeta(
  this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
): Promise<IClioApiResponse> {
  const credentials = await this.getCredentials('clioOAuth2Api');
  const region = (credentials.region as string) || 'us';
  const baseUrl = getBaseUrl(region);

  const options: IHttpRequestOptions = {
    method,
    url: `${baseUrl}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    qs,
    json: true,
  };

  if (Object.keys(body).length > 0) {
    options.body = body;
  }

  try {
    const response = await this.helpers.httpRequestWithAuthentication.call(
      this,
      'clioOAuth2Api',
      options,
    );

    return response as IClioApiResponse;
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: (error as Error).message,
    });
  }
}

export async function clioApiRequestAllItems(
  this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
  limit = 0,
): Promise<IDataObject[]> {
  const returnData: IDataObject[] = [];
  let pageNumber = 1;
  const pageSize = DEFAULT_PAGE_SIZE;

  qs['page[size]'] = pageSize;

  let hasMore = true;

  while (hasMore) {
    qs['page[number]'] = pageNumber;

    const response = await clioApiRequestWithMeta.call(this, method, endpoint, body, qs);

    if (Array.isArray(response.data)) {
      returnData.push(...response.data);
    } else if (response.data) {
      returnData.push(response.data);
    }

    hasMore = !!(response.meta?.paging?.next);

    if (limit > 0 && returnData.length >= limit) {
      return returnData.slice(0, limit);
    }

    pageNumber++;

    if (pageNumber > 1000) {
      break;
    }
  }

  return returnData;
}

export async function loadOptionsRequest(
  this: ILoadOptionsFunctions,
  endpoint: string,
  labelField = 'name',
  valueField = 'id',
): Promise<INodePropertyOptions[]> {
  const data = await clioApiRequestAllItems.call(this, 'GET', endpoint, {}, {});

  return data.map((item: IDataObject) => ({
    name: (item[labelField] as string) || String(item[valueField]),
    value: item[valueField] as string | number,
  }));
}

export async function clioApiDownload(
  this: IExecuteFunctions,
  endpoint: string,
): Promise<Buffer> {
  const credentials = await this.getCredentials('clioOAuth2Api');
  const region = (credentials.region as string) || 'us';
  const baseUrl = getBaseUrl(region);

  const options: IHttpRequestOptions = {
    method: 'GET',
    url: `${baseUrl}${endpoint}`,
    headers: { Accept: '*/*' },
    encoding: 'arraybuffer',
    returnFullResponse: true,
  };

  try {
    const response = await this.helpers.httpRequestWithAuthentication.call(
      this,
      'clioOAuth2Api',
      options,
    );

    return Buffer.from(response.body as ArrayBuffer);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: (error as Error).message,
    });
  }
}

export async function clioApiUpload(
  this: IExecuteFunctions,
  endpoint: string,
  binaryData: Buffer,
  filename: string,
  mimeType: string,
  additionalFields: IDataObject = {},
): Promise<IDataObject> {
  const credentials = await this.getCredentials('clioOAuth2Api');
  const region = (credentials.region as string) || 'us';
  const baseUrl = getBaseUrl(region);

  const formData: IDataObject = {
    file: {
      value: binaryData,
      options: {
        filename,
        contentType: mimeType,
      },
    },
    ...additionalFields,
  };

  const options: IHttpRequestOptions = {
    method: 'POST',
    url: `${baseUrl}${endpoint}`,
    headers: { Accept: 'application/json' },
    body: formData,
  };

  try {
    const response = await this.helpers.httpRequestWithAuthentication.call(
      this,
      'clioOAuth2Api',
      options,
    );

    return (response.data || response) as IDataObject;
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: (error as Error).message,
    });
  }
}

// Aliases for backward compatibility
export const clioApiRequestWithPagination = clioApiRequestAllItems;
export const uploadDocument = clioApiUpload;
export const downloadDocument = clioApiDownload;
