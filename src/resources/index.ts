import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiClient } from '../utils/api.js';
import { AuthResourceHandlers } from './auth.js';
import { GameResourceHandlers } from './game.js';
import { UserResourceHandlers } from './user.js';

export class ResourceRegistry {
  private authHandlers: AuthResourceHandlers;
  private gameHandlers: GameResourceHandlers;
  private userHandlers: UserResourceHandlers;

  constructor(private apiClient: ApiClient) {
    this.authHandlers = new AuthResourceHandlers(apiClient);
    this.gameHandlers = new GameResourceHandlers(apiClient);
    this.userHandlers = new UserResourceHandlers(apiClient);
  }

  registerAll(server: McpServer): void {
    // Authentication Resources
    server.registerResource(
      'auth_me',
      'screeps://auth/me',
      {
        title: 'Current User Info',
        description: 'Get current authenticated user information',
        mimeType: 'application/json',
      },
      (uri) => this.authHandlers.handleAuthMe(uri),
    );

    // Game Resources
    server.registerResource(
      'game_time',
      'screeps://game/time',
      {
        title: 'Game Time',
        description: 'Current game time and tick information',
        mimeType: 'application/json',
      },
      (uri) => this.gameHandlers.handleGameTime(uri),
    );

    server.registerResource(
      'world_size',
      'screeps://game/world-size',
      {
        title: 'World Size',
        description: 'Get world dimensions and size information',
        mimeType: 'application/json',
      },
      (uri) => this.gameHandlers.handleWorldSize(uri),
    );

    server.registerResource(
      'shards_info',
      'screeps://game/shards/info',
      {
        title: 'Shard Information',
        description: 'Get information about available shards',
        mimeType: 'application/json',
      },
      (uri) => this.gameHandlers.handleShardsInfo(uri),
    );

    server.registerResource(
      'market_stats',
      'screeps://game/market/stats',
      {
        title: 'Market Statistics',
        description: 'Get market statistics and trading information',
        mimeType: 'application/json',
      },
      (uri) => this.gameHandlers.handleMarketStats(uri),
    );

    server.registerResource(
      'version',
      'screeps://version',
      {
        title: 'API Version',
        description: 'Get API version and server information including features, shards, and user count',
        mimeType: 'application/json',
      },
      (uri) => this.gameHandlers.handleVersion(uri),
    );

    // User Resources
    server.registerResource(
      'user_world_status',
      'screeps://user/world-status',
      {
        title: 'User World Status',
        description: 'Get current user world status and statistics',
        mimeType: 'application/json',
      },
      (uri) => this.userHandlers.handleUserWorldStatus(uri),
    );
  }
}
