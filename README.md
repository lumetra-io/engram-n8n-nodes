# n8n-nodes-engram-memory

n8n community node for **[Engram](https://lumetra.io)** — durable, explainable memory for AI agents, by Lumetra.

This node lets you store, query, and manage memories in Engram from any n8n workflow. It exposes six operations against the Engram REST API:

| Operation | What it does |
|---|---|
| Store Memory | Save a fact or piece of context to a bucket |
| Query Memory | Ask a natural-language question and get a synthesized answer with cited memories |
| List Memories | List raw memories in a bucket (paginated) |
| List Buckets | List buckets in your tenant |
| Delete Memory | Delete a single memory by ID |
| Clear Memories | Wipe every memory in a bucket (destructive) |

The node is `usableAsTool`, so you can wire it directly into n8n's AI Agent nodes as a tool.

## Install

In your n8n instance:

1. Go to **Settings → Community Nodes**.
2. Click **Install a community node**.
3. Enter `@lumetra/n8n-nodes-engram-memory` and confirm.
4. After install, search for **Engram** in the node panel.

> Community nodes must be enabled on your n8n instance. For self-hosted n8n, set `N8N_COMMUNITY_PACKAGES_ENABLED=true`. n8n Cloud users on supported plans can install community nodes from the UI directly.

## Credentials

Create an **Engram API** credential:

- **API Key** — your Engram key (starts with `eng_live_…`). Create one at <https://lumetra.io>.
- **Base URL** — leave at `https://api.lumetra.io` for Lumetra Cloud, or override for self-hosted Engram.

The credential's *Test* button calls `GET /v1/buckets?limit=1` to verify the key.

## Example workflow

A minimal "remember then recall" workflow:

1. **Engram → Store Memory** with `bucket = chatbot`, `content = "Acme's primary contact is Dana Lee, COO."`
2. **Engram → Query Memory** with `bucket = chatbot`, `question = "Who's the contact at Acme?"`
3. The query node returns `{ success, answer, memories_found, explanation: { retrieved_memories: [...] } }`.

For multi-agent setups, give each project its own bucket name.

## Field mapping note

The user-facing **Question** field maps to the REST API's `query` field — we use "question" here to stay consistent with Engram's other surfaces (Dify, Claude, ChatGPT plugins).

## Development

```bash
npm install
npm run build   # tsc → dist/
```

To test locally inside Docker n8n:

```bash
docker run -it --rm \
  -p 5678:5678 \
  -e N8N_COMMUNITY_PACKAGES_ENABLED=true \
  -v ~/.n8n:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

Then **Settings → Community Nodes → Install** and enter `@lumetra/n8n-nodes-engram-memory` (after the package is published to npm), or use `npm link` for an unpublished local build.

## Privacy

See [PRIVACY.md](./PRIVACY.md).

## License

MIT © Lumetra, Inc.
