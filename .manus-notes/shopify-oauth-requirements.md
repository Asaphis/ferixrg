# Shopify OAuth requirements verified 2026-08-21

Official Shopify documentation states that standalone or API-only apps use the OAuth authorization-code grant. The authorization redirect must include a random state nonce, client_id, requested scopes, and an exact configured redirect_uri. The callback must validate state and the HMAC over the callback parameters before exchanging the code for an offline access token. Shopify access scopes are least-privilege permissions; a write scope includes its matching read scope, so FerixRG should request only the read scopes required for analysis until a user explicitly chooses a supported write workflow. Official source URLs:

- https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant
- https://shopify.dev/docs/api/usage/access-scopes

FerixRG must store OAuth nonce/state and tokens server-side in encrypted storage, never in the browser or logs, and must not mark a connection as connected until the callback is verified and the token exchange succeeds.
