import { ApiClient } from '../utils/api.js';
import { ResourceContent } from '../types/index.js';

export class UserResourceHandlers {
  constructor(private apiClient: ApiClient) {}

  async handleUserWorldStatus(uri: URL): Promise<ResourceContent> {
    try {
      const endpoint = '/user/world-status';
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        'User world status shows your global presence and empire state',
        'Status includes GCL, power level, and overall progression metrics',
        'Data updates periodically - cached for performance optimization',
        'Use for empire management and strategic planning decisions',
      ];

      return this.apiClient.createEnhancedResourceContent(
        uri.href,
        data,
        endpoint,
        'User World Status and Statistics',
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createErrorResourceContent(uri.href, error);
    }
  }
}
