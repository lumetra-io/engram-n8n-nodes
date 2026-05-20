import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class EngramApi implements ICredentialType {
	name = 'engramApi';

	displayName = 'Engram API';

	documentationUrl = 'https://lumetra.io/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your Engram API key (starts with eng_live_…). Create one at https://lumetra.io.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.lumetra.io',
			description:
				'Engram API base URL. Leave as default for Lumetra Cloud, or override for self-hosted Engram.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/v1/buckets',
			method: 'GET',
			qs: {
				limit: 1,
			},
		},
	};
}
