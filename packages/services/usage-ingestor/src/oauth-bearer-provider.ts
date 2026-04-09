import { DefaultAzureCredential } from '@azure/identity';
import type { OauthbearerProviderResponse } from 'kafkajs';

/**
 * Creates an OAuthBearer token provider for KafkaJS using Azure Identity.
 *
 * Uses {@link DefaultAzureCredential} which automatically supports Azure Workload Identity
 * (federated identity in Kubernetes), Managed Identity, Azure CLI, and other credential types.
 *
 * When deployed in Kubernetes with Azure Workload Identity configured, the following
 * environment variables are expected to be injected by the webhook:
 *   - AZURE_CLIENT_ID
 *   - AZURE_TENANT_ID
 *   - AZURE_FEDERATED_TOKEN_FILE
 *   - AZURE_AUTHORITY_HOST
 *
 * This function should be called once during service initialization.
 * The returned provider function can be called multiple times by KafkaJS
 * for reauthentication; the credential instance is reused across calls.
 *
 * @param scope - The OAuth scope to request (e.g. `https://<namespace>.servicebus.windows.net/.default` for Azure Event Hub)
 */
export function createOAuthBearerProvider(
  scope: string,
): () => Promise<OauthbearerProviderResponse> {
  const credential = new DefaultAzureCredential();

  return async () => {
    try {
      const token = await credential.getToken(scope);
      return { value: token.token };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error during token acquisition';
      throw new Error(
        `Failed to acquire Azure OAuth token for scope "${scope}": ${message}. ` +
          'Ensure Azure Workload Identity is configured correctly ' +
          '(AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_FEDERATED_TOKEN_FILE).',
        { cause: error },
      );
    }
  };
}
