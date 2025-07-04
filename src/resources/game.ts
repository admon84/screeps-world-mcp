import { ApiClient } from '../utils/api.js';
import { ResourceContent } from '../types/index.js';

export class GameResourceHandlers {
  constructor(private apiClient: ApiClient) {}

  async handleGameTime(uri: URL): Promise<ResourceContent> {
    try {
      const endpoint = '/game/time';
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        'Game time advances every tick (approximately every 3 seconds)',
        'Use this timestamp for synchronizing with game events',
        'Time data is cached briefly to optimize performance',
      ];

      return this.apiClient.createEnhancedResourceContent(
        uri.href,
        data,
        endpoint,
        'Current Game Time and Tick Information',
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createErrorResourceContent(uri.href, error);
    }
  }

  async handleWorldSize(uri: URL): Promise<ResourceContent> {
    try {
      const endpoint = '/game/world-size';
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        'World dimensions never change - this is static configuration data',
        'Use width/height for room coordinate calculations and map boundaries',
        'Safe to cache this data indefinitely in your applications',
      ];

      return this.apiClient.createEnhancedResourceContent(
        uri.href,
        data,
        endpoint,
        'World Dimensions and Size Information',
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createErrorResourceContent(uri.href, error);
    }
  }

  async handleShardsInfo(uri: URL): Promise<ResourceContent> {
    try {
      const endpoint = '/game/shards/info';
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        `Available shards: ${data?.shards?.length || 'unknown'} shards detected`,
        'Shard list changes rarely - only when server adds/removes shards',
        'Use shard info for multi-shard strategies and server selection',
        'Check shard status and tick rates for performance planning',
      ];

      return this.apiClient.createEnhancedResourceContent(
        uri.href,
        data,
        endpoint,
        'Available Shards Information',
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createErrorResourceContent(uri.href, error);
    }
  }

  async handleMarketStats(uri: URL): Promise<ResourceContent> {
    try {
      const endpoint = '/game/market/stats';
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        'Market statistics provide global economy overview',
        'Credit totals and transaction volumes update regularly',
        'Use for economic analysis and market trend identification',
        'Combine with specific market orders for detailed trading data',
      ];

      return this.apiClient.createEnhancedResourceContent(
        uri.href,
        data,
        endpoint,
        'Global Market Statistics and Trading Information',
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createErrorResourceContent(uri.href, error);
    }
  }

  async handleVersion(uri: URL): Promise<ResourceContent> {
    try {
      const endpoint = '/version';
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        'Server version and features are static until server updates',
        'Use feature flags to determine available API capabilities',
        'User count and shard info provide server health insights',
        'Safe to cache version data for the duration of your session',
      ];

      return this.apiClient.createEnhancedResourceContent(
        uri.href,
        data,
        endpoint,
        'API Version and Server Information',
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createErrorResourceContent(uri.href, error);
    }
  }
}
