# Privacy

This n8n community node sends the parameters you (or your workflow) pass to its operations — `content`, `question`, `bucket`, `memory_id`, pagination args — to the Engram REST API at `https://api.lumetra.io` (or the self-hosted base URL you configured in the credential). Memories are stored under your Engram tenant, scoped by the API key you provided.

The node does not collect, log, or transmit data to any third party other than the Engram service you've explicitly authorized. It does not read other n8n resources (workflows, executions, other credentials) — only the parameters supplied to each operation.

For Engram's own data-handling and retention policy, see <https://lumetra.io/privacy>.
