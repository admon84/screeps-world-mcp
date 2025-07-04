import { ApiClient } from '../utils/api.js';
import { ResourceContent } from '../types/index.js';

export class AuthResourceHandlers {
  constructor(private apiClient: ApiClient) {}

  async handleAuthMe(uri: URL): Promise<ResourceContent> {
    try {
      const endpoint = '/auth/me';
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        'Use this authentication info to verify user identity',
        'Username and user ID are stable - safe to cache long-term',
        'This resource confirms your API token is valid and active',
      ];

      return this.apiClient.createEnhancedResourceContent(
        uri.href,
        data,
        endpoint,
        'Current User Authentication Info',
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createErrorResourceContent(uri.href, error);
    }
  }
}
