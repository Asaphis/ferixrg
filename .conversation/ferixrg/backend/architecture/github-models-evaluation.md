# GitHub Models Evaluation for FerixRG

## Decision

**GitHub Models cannot be used for FerixRG.** GitHub’s official documentation states that GitHub Models was fully retired on **July 30, 2026**. The model catalog, playground, inference API, and bring-your-own-key capability are no longer available to any customer. [1]

The user found a real and previously useful product. Before retirement, GitHub Models provided a model marketplace, a playground, a REST inference API, rate-limit information, organization-level calls, billing, and provider-key support. [2] [3] The linked marketplace page remains addressable, but it redirects unauthenticated visitors to GitHub sign-in and does not provide a current FerixRG API route.

## What this means for FerixRG

| Question | Answer |
|---|---|
| Can FerixRG use the linked GitHub Models marketplace today? | **No.** Its model service and API are retired. |
| Is GitHub Copilot the same product? | **No.** GitHub’s documentation explicitly states that GitHub Models was separate from GitHub Copilot. [1] |
| Can GitHub Copilot still help FerixRG? | Yes, as an internal engineering agent for repository work, not as the customer-facing model API behind FerixRG tools. |
| What does GitHub recommend for new AI model access? | Azure AI Foundry. [1] |

## Correct FerixRG action

Do not create a GitHub Models key, dashboard workflow, or adapter. Keep the FerixRG AI service registry provider-neutral and evaluate currently active multi-model/API platforms and specialist services instead. GitHub Copilot may remain an optional internal engineering tool, but it should not be confused with a runtime AI provider for FerixRG users.

## References

[1] [GitHub Models — retired](https://docs.github.com/github-models)

[2] [GitHub Models API announcement](https://github.blog/changelog/2025-05-15-github-models-api-now-available/)

[3] [GitHub Models billing and BYOK announcement](https://github.blog/changelog/2025-06-24-github-models-now-supports-moving-beyond-free-limits/)
