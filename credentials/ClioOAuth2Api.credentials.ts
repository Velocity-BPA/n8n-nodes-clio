/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IAuthenticateGeneric,
  ICredentialDataDecryptedObject,
  ICredentialTestRequest,
  ICredentialType,
  IHttpRequestHelper,
  INodeProperties,
} from 'n8n-workflow';

export class ClioOAuth2Api implements ICredentialType {
  name = 'clioOAuth2Api';
  displayName = 'Clio OAuth2 API';
  documentationUrl = 'https://app.clio.com/api/v4/documentation';
  extends = ['oAuth2Api'];

  properties: INodeProperties[] = [
    {
      displayName: 'Grant Type',
      name: 'grantType',
      type: 'hidden',
      default: 'authorizationCode',
    },
    {
      displayName: 'Region',
      name: 'region',
      type: 'options',
      options: [
        { name: 'United States', value: 'us' },
        { name: 'European Union', value: 'eu' },
        { name: 'Canada', value: 'ca' },
        { name: 'Australia', value: 'au' },
      ],
      default: 'us',
      description: 'The Clio region your account is in',
    },
    {
      displayName: 'Authorization URL',
      name: 'authUrl',
      type: 'hidden',
      default: '={{$self["region"] === "eu" ? "https://eu.app.clio.com/oauth/authorize" : $self["region"] === "ca" ? "https://ca.app.clio.com/oauth/authorize" : $self["region"] === "au" ? "https://au.app.clio.com/oauth/authorize" : "https://app.clio.com/oauth/authorize"}}',
    },
    {
      displayName: 'Access Token URL',
      name: 'accessTokenUrl',
      type: 'hidden',
      default: '={{$self["region"] === "eu" ? "https://eu.app.clio.com/oauth/token" : $self["region"] === "ca" ? "https://ca.app.clio.com/oauth/token" : $self["region"] === "au" ? "https://au.app.clio.com/oauth/token" : "https://app.clio.com/oauth/token"}}',
    },
    {
      displayName: 'Scope',
      name: 'scope',
      type: 'hidden',
      default: '',
    },
    {
      displayName: 'Auth URI Query Parameters',
      name: 'authQueryParameters',
      type: 'hidden',
      default: '',
    },
    {
      displayName: 'Authentication',
      name: 'authentication',
      type: 'hidden',
      default: 'body',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.oauthTokenData.access_token}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.region === "eu" ? "https://eu.app.clio.com/api/v4" : $credentials.region === "ca" ? "https://ca.app.clio.com/api/v4" : $credentials.region === "au" ? "https://au.app.clio.com/api/v4" : "https://app.clio.com/api/v4"}}',
      url: '/users/who_am_i',
    },
  };

  async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
    const region = credentials.region as string;
    let baseUrl: string;

    switch (region) {
      case 'eu':
        baseUrl = 'https://eu.app.clio.com';
        break;
      case 'ca':
        baseUrl = 'https://ca.app.clio.com';
        break;
      case 'au':
        baseUrl = 'https://au.app.clio.com';
        break;
      default:
        baseUrl = 'https://app.clio.com';
    }

    return {
      authUrl: `${baseUrl}/oauth/authorize`,
      accessTokenUrl: `${baseUrl}/oauth/token`,
    };
  }
}
