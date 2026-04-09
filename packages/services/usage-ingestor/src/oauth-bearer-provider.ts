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
 * @param scope - The OAuth scope to request (e.g. `https://<namespace>.servicebus.windows.net/.default` for Azure Event Hub)
 */
export function createOAuthBearerProvider(
  scope: string,
): () => Promise<OauthbearerProviderResponse> {
  const credential = new DefaultAzureCredential();

  return async () => {
    const token = await credential.getToken(scope);
    return { value: token.token };
  };
}
