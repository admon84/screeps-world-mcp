import { z } from 'zod';
import { ApiClient } from '../utils/api.js';
import { ToolResult, PvpInfoOptions } from '../types/index.js';

export class MiscToolHandlers {
  constructor(private apiClient: ApiClient) {}

  async handleGetPvpInfo(params: PvpInfoOptions): Promise<ToolResult> {
    try {
      const endpoint = this.apiClient.buildEndpointWithQuery('/experimental/pvp', params);
      const data = await this.apiClient.makeApiCall(endpoint);

      return this.apiClient.createToolResult(`PvP Information:\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      return this.apiClient.createToolResult(
        `Error getting PvP info: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  async handleGetNukesInfo(): Promise<ToolResult> {
    try {
      const data = await this.apiClient.makeApiCall('/experimental/nukes');
      return this.apiClient.createToolResult(`Active Nukes Information:\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      return this.apiClient.createToolResult(
        `Error getting nukes info: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  // Zod schemas for validation
  static getSchemas() {
    return {
      getPvpInfo: {
        interval: z.number().optional().describe('Interval parameter'),
        start: z.number().optional().describe('Start parameter'),
      },
      getNukesInfo: {},
    };
  }
}
