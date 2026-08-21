# AI Content Improver gateway review

The current central gateway uses one Cloudflare Workers AI adapter. Design Copilot already enforces configuration checks, a 12,000-character message limit, sensitive-credential detection, bounded context, a 30-second request timeout, typed unavailable states, and model/usage return fields.

The AI Content Improver should reuse the same adapter and response format, but apply a content-specific system instruction that returns a proposed revision only. It must never claim to publish, edit a connected store, inspect an unprovided page, or apply changes automatically. The workspace route must enforce editor permission, canonical `ai-content-improver` tool context, bounded source text, audit activity, and existing usage accounting.

The existing workspace regression suite already mocks the central gateway, workspace access, tool runs, daily neuron usage, usage ledger, and workspace activity. The new regression should assert the `ai-content-improver` tool context, `content_improver` usage reference, and `ai.content_improver.completed` audit event, while retaining the same protected daily reserve behavior as Design Copilot.
