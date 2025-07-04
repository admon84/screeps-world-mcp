import { z } from 'zod';
import { ApiClient } from '../utils/api.js';
import {
  ToolResult,
  IntervalOptions,
  UserFindOptions,
  UserOverviewOptions,
  UserMemoryOptions,
  AuthSigninOptions,
} from '../types/index.js';

export class UserToolHandlers {
  constructor(private apiClient: ApiClient) {}

  async handleGetUserName(): Promise<ToolResult> {
    try {
      const endpoint = '/user/name';
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        'User name retrieved successfully',
        'This is your authenticated username - no additional calls needed',
        'Use this username for player identification and lookups',
      ];

      return this.apiClient.createEnhancedToolResult(data, endpoint, 'User Name', false, additionalGuidance);
    } catch (error) {
      return this.apiClient.createToolResult(
        `Error getting user name: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  async handleGetUserStats(params: IntervalOptions): Promise<ToolResult> {
    try {
      const endpoint = this.apiClient.buildEndpointWithQuery('/user/stats', params);
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        `User statistics retrieved for ${params.interval || 'default'} interval`,
        'Analyze performance trends and patterns from this data',
        'Compare different time periods to identify improvements',
        'Statistical data is complete - no additional stats calls needed',
      ];

      return this.apiClient.createEnhancedToolResult(
        data,
        endpoint,
        `User Statistics${params.interval ? ` (${params.interval} interval)` : ''}`,
        false,
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createToolResult(
        `Error getting user stats: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  async handleGetUserRooms(params: IntervalOptions): Promise<ToolResult> {
    try {
      const endpoint = this.apiClient.buildEndpointWithQuery('/user/rooms', params);
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        `User rooms data retrieved for ${params.interval || 'default'} interval`,
        'Review room ownership and control levels',
        'Identify rooms that need attention or optimization',
        'Room data is complete - analyze the provided information',
      ];

      return this.apiClient.createEnhancedToolResult(
        data,
        endpoint,
        `User Rooms${params.interval ? ` (${params.interval} interval)` : ''}`,
        false,
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createToolResult(
        `Error getting user rooms: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  async handleFindUser(params: UserFindOptions): Promise<ToolResult> {
    try {
      const endpoint = this.apiClient.buildEndpointWithQuery('/user/find', params);
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        `User lookup completed for ${params.username || params.id}`,
        'Use this information for player analysis or communication',
        'Player information is complete - no additional lookups needed',
        'Check user stats or rooms for more detailed information if needed',
      ];

      return this.apiClient.createEnhancedToolResult(
        data,
        endpoint,
        `User Lookup: ${params.username || params.id}`,
        false,
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createToolResult(
        `Error finding user: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  async handleGetUserOverview(params: UserOverviewOptions): Promise<ToolResult> {
    try {
      const endpoint = this.apiClient.buildEndpointWithQuery('/user/overview', params);
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        `User overview retrieved for ${params.interval || 'default'} interval`,
        `${params.statName ? `Focused on ${params.statName} statistics` : 'General overview provided'}`,
        'Analyze trends and performance metrics from this data',
        'Overview data is complete - use for strategic planning',
      ];

      return this.apiClient.createEnhancedToolResult(
        data,
        endpoint,
        `User Overview${params.interval ? ` (${params.interval})` : ''}${params.statName ? ` - ${params.statName}` : ''}`,
        false,
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createToolResult(
        `Error getting user overview: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  async handleExecuteConsoleCommand(params: { expression: string }): Promise<ToolResult> {
    try {
      const endpoint = '/user/console';
      const data = await this.apiClient.makeApiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify({ expression: params.expression }),
      });

      const additionalGuidance = [
        `Console command executed: ${params.expression}`,
        'Review the command result for any errors or output',
        'Use console commands for real-time game interaction',
        'Command execution complete - check result for next steps',
      ];

      return this.apiClient.createEnhancedToolResult(
        data,
        endpoint,
        `Console Command: ${params.expression}`,
        false,
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createToolResult(
        `Error executing console command: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  async handleGetUserMemory(params: UserMemoryOptions): Promise<ToolResult> {
    try {
      const endpoint = this.apiClient.buildEndpointWithQuery('/user/memory', params);
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        `User memory retrieved${params.path ? ` for path: ${params.path}` : ''}`,
        'Parse and analyze the memory data structure',
        'Use memory data for game state understanding',
        'Memory data is complete - no additional memory calls needed',
      ];

      return this.apiClient.createEnhancedToolResult(
        data,
        endpoint,
        `User Memory${params.path ? ` (${params.path})` : ''}`,
        false,
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createToolResult(
        `Error getting user memory: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  async handleAuthSignin(params: AuthSigninOptions): Promise<ToolResult> {
    try {
      const data = await this.apiClient.makeApiCall('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: params.email, password: params.password }),
      });

      if (data.token) {
        // Update the config with the new token - we need access to the config manager for this
        // This will be handled in the registry
      }

      return this.apiClient.createToolResult(
        `Sign in successful!\nToken: ${
          data.token ? '[REDACTED]' : 'Not provided'
        }\nResponse: ${JSON.stringify({ ...data, token: data.token ? '[REDACTED]' : undefined }, null, 2)}`,
      );
    } catch (error) {
      return this.apiClient.createToolResult(
        `Sign in failed: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  // Zod schemas for validation
  static getSchemas() {
    return {
      getUserName: {},
      getUserStats: {
        interval: z.enum(['8', '180', '1440']).optional().describe('Interval: 8=1hr, 180=24hr, 1440=7days'),
      },
      getUserRooms: {
        interval: z.enum(['8', '180', '1440']).optional().describe('Interval: 8=1hr, 180=24hr, 1440=7days'),
      },
      findUser: {
        id: z.string().optional().describe('User ID'),
        username: z.string().optional().describe('Username'),
      },
      getUserOverview: {
        interval: z.enum(['8', '180', '1440']).optional().describe('Interval: 8=1hr, 180=24hr, 1440=7days'),
        statName: z
          .enum([
            'creepsLost',
            'creepsProduced',
            'energyConstruction',
            'energyControl',
            'energyCreeps',
            'energyHarvested',
          ])
          .optional()
          .describe('Statistic name'),
      },
      executeConsoleCommand: {
        expression: z.string().describe('Console expression to execute'),
      },
      getUserMemory: {
        path: z.string().optional().describe('Memory path (e.g., flags.Flag1)'),
        shard: z.string().optional().describe('Shard name (default: shard0)'),
      },
      authSignin: {
        email: z.string().describe('Email or username'),
        password: z.string().describe('Password'),
      },
    };
  }
}
