import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class Engram implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Engram',
		name: 'engram',
		icon: 'file:engram.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Durable, explainable memory for AI agents (Lumetra Engram)',
		defaults: {
			name: 'Engram',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'engramApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Store Memory',
						value: 'storeMemory',
						description: 'Save a fact or piece of context to a bucket',
						action: 'Store a memory',
					},
					{
						name: 'Query Memory',
						value: 'queryMemory',
						description: 'Ask a natural-language question against a bucket',
						action: 'Query memories',
					},
					{
						name: 'List Memories',
						value: 'listMemories',
						description: 'List raw memories in a bucket',
						action: 'List memories in a bucket',
					},
					{
						name: 'List Buckets',
						value: 'listBuckets',
						description: 'List all buckets in the tenant',
						action: 'List buckets',
					},
					{
						name: 'Delete Memory',
						value: 'deleteMemory',
						description: 'Delete a single memory by ID',
						action: 'Delete a memory',
					},
					{
						name: 'Clear Memories',
						value: 'clearMemories',
						description: 'Delete every memory in a bucket (destructive)',
						action: 'Clear all memories in a bucket',
					},
				],
				default: 'storeMemory',
			},
			// Bucket — used by every op except listBuckets
			{
				displayName: 'Bucket',
				name: 'bucket',
				type: 'string',
				default: 'default',
				required: true,
				placeholder: 'default',
				description: 'Bucket name. Created on first write if it does not exist.',
				displayOptions: {
					hide: {
						operation: ['listBuckets'],
					},
				},
			},
			// storeMemory
			{
				displayName: 'Content',
				name: 'content',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				required: true,
				description: 'The fact or context to store',
				displayOptions: {
					show: {
						operation: ['storeMemory'],
					},
				},
			},
			// queryMemory — user-facing name is "question" (matches Engram plugins)
			{
				displayName: 'Question',
				name: 'question',
				type: 'string',
				typeOptions: { rows: 2 },
				default: '',
				required: true,
				description: 'Natural-language question to ask Engram',
				displayOptions: {
					show: {
						operation: ['queryMemory'],
					},
				},
			},
			// listMemories / listBuckets pagination
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 1000 },
				default: 50,
				description: 'Max number of records to return',
				displayOptions: {
					show: {
						operation: ['listMemories', 'listBuckets'],
					},
				},
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 0,
				description: 'Pagination offset',
				displayOptions: {
					show: {
						operation: ['listMemories', 'listBuckets'],
					},
				},
			},
			// deleteMemory
			{
				displayName: 'Memory ID',
				name: 'memoryId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the memory to delete',
				displayOptions: {
					show: {
						operation: ['deleteMemory'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = (await this.getCredentials('engramApi')) as {
			apiKey: string;
			baseUrl?: string;
		};
		const baseUrl = (credentials.baseUrl || 'https://api.lumetra.io').replace(/\/+$/, '');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				let method: IHttpRequestMethods = 'GET';
				let url = '';
				let body: IDataObject | undefined;
				let qs: IDataObject | undefined;

				if (operation === 'storeMemory') {
					const bucket = this.getNodeParameter('bucket', i) as string;
					const content = this.getNodeParameter('content', i) as string;
					method = 'POST';
					url = `${baseUrl}/v1/buckets/${encodeURIComponent(bucket)}/memories`;
					body = { content };
				} else if (operation === 'queryMemory') {
					const bucket = this.getNodeParameter('bucket', i) as string;
					const question = this.getNodeParameter('question', i) as string;
					method = 'POST';
					url = `${baseUrl}/v1/query`;
					// Engram REST expects "query"; we expose "question" in the UI to match
					// the other Engram plugins (Dify, Claude, ChatGPT).
					body = { query: question, buckets: [bucket] };
				} else if (operation === 'listMemories') {
					const bucket = this.getNodeParameter('bucket', i) as string;
					const limit = this.getNodeParameter('limit', i) as number;
					const offset = this.getNodeParameter('offset', i) as number;
					method = 'GET';
					url = `${baseUrl}/v1/buckets/${encodeURIComponent(bucket)}/memories`;
					qs = { limit, offset };
				} else if (operation === 'listBuckets') {
					const limit = this.getNodeParameter('limit', i) as number;
					const offset = this.getNodeParameter('offset', i) as number;
					method = 'GET';
					url = `${baseUrl}/v1/buckets`;
					qs = { limit, offset };
				} else if (operation === 'deleteMemory') {
					const bucket = this.getNodeParameter('bucket', i) as string;
					const memoryId = this.getNodeParameter('memoryId', i) as string;
					method = 'DELETE';
					url = `${baseUrl}/v1/buckets/${encodeURIComponent(bucket)}/memories/${encodeURIComponent(
						memoryId,
					)}`;
				} else if (operation === 'clearMemories') {
					const bucket = this.getNodeParameter('bucket', i) as string;
					method = 'DELETE';
					url = `${baseUrl}/v1/buckets/${encodeURIComponent(bucket)}/memories`;
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
						itemIndex: i,
					});
				}

				const options: IHttpRequestOptions = {
					method,
					url,
					json: true,
					headers: {
						'Content-Type': 'application/json',
					},
				};
				if (body !== undefined) options.body = body;
				if (qs !== undefined) options.qs = qs;

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'engramApi',
					options,
				);

				returnData.push({
					json: response as IDataObject,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				if ((error as { context?: Record<string, unknown> }).context) {
					(error as { context: Record<string, unknown> }).context.itemIndex = i;
					throw error;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
