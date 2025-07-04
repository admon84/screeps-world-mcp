import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiClient } from '../utils/api.js';
import { ConfigManager } from '../config/index.js';
import { RoomToolHandlers } from './room.js';
import { UserToolHandlers } from './user.js';
import { MarketToolHandlers } from './market.js';
import { MiscToolHandlers } from './misc.js';
import { AuthSigninOptions } from '../types/index.js';

export class ToolRegistry {
  private roomHandlers: RoomToolHandlers;
  private userHandlers: UserToolHandlers;
  private marketHandlers: MarketToolHandlers;
  private miscHandlers: MiscToolHandlers;

  constructor(
    private apiClient: ApiClient,
    private configManager: ConfigManager,
  ) {
    this.roomHandlers = new RoomToolHandlers(apiClient);
    this.userHandlers = new UserToolHandlers(apiClient);
    this.marketHandlers = new MarketToolHandlers(apiClient);
    this.miscHandlers = new MiscToolHandlers(apiClient);
  }

  private async convertResult(resultPromise: Promise<any>): Promise<any> {
    const result = await resultPromise;
    return result as any;
  }

  registerAll(server: McpServer): void {
    const roomSchemas = RoomToolHandlers.getSchemas();
    const userSchemas = UserToolHandlers.getSchemas();
    const marketSchemas = MarketToolHandlers.getSchemas();
    const miscSchemas = MiscToolHandlers.getSchemas();

    // Room Tools
    server.registerTool(
      'get_room_terrain',
      {
        title: 'Get Room Terrain',
        description: 'Get terrain information for a specific room',
        inputSchema: roomSchemas.roomTerrain,
      },
      (params) => this.roomHandlers.handleGetRoomTerrain(params),
    );

    server.registerTool(
      'get_room_objects',
      {
        title: 'Get Room Objects',
        description: 'Get objects and users in a specific room',
        inputSchema: roomSchemas.roomObjects,
      },
      (params) => this.roomHandlers.handleGetRoomObjects(params),
    );

    server.registerTool(
      'get_room_overview',
      {
        title: 'Get Room Overview',
        description: 'Get room overview and statistics',
        inputSchema: roomSchemas.roomOverview,
      },
      (params) => this.roomHandlers.handleGetRoomOverview(params),
    );

    server.registerTool(
      'get_room_status',
      {
        title: 'Get Room Status',
        description: 'Get room status information',
        inputSchema: roomSchemas.roomStatus,
      },
      (params) => this.roomHandlers.handleGetRoomStatus(params),
    );

    server.registerTool(
      'calculate_distance',
      {
        title: 'Calculate Distance',
        description: 'Calculate distance between two rooms',
        inputSchema: roomSchemas.calculateDistance,
      },
      (params) => this.roomHandlers.handleCalculateDistance(params),
    );

    // User Tools
    server.registerTool(
      'get_user_name',
      {
        title: 'Get User Name',
        description: 'Get user name',
        inputSchema: userSchemas.getUserName,
      },
      () => this.userHandlers.handleGetUserName() as any,
    );

    server.registerTool(
      'get_user_stats',
      {
        title: 'Get User Statistics',
        description: 'Get user statistics',
        inputSchema: userSchemas.getUserStats,
      },
      (params) => this.userHandlers.handleGetUserStats(params),
    );

    server.registerTool(
      'get_user_rooms',
      {
        title: 'Get User Rooms',
        description: 'Get user rooms',
        inputSchema: userSchemas.getUserRooms,
      },
      (params) => this.userHandlers.handleGetUserRooms(params),
    );

    server.registerTool(
      'find_user',
      {
        title: 'Find User',
        description: 'Find user by ID or username',
        inputSchema: userSchemas.findUser,
      },
      (params) => this.userHandlers.handleFindUser(params),
    );

    server.registerTool(
      'get_user_overview',
      {
        title: 'Get User Overview',
        description: 'Get user overview statistics',
        inputSchema: userSchemas.getUserOverview,
      },
      (params) => this.userHandlers.handleGetUserOverview(params),
    );

    server.registerTool(
      'execute_console_command',
      {
        title: 'Execute Console Command',
        description: 'Execute console command in Screeps',
        inputSchema: userSchemas.executeConsoleCommand,
      },
      (params) => this.userHandlers.handleExecuteConsoleCommand(params),
    );

    server.registerTool(
      'get_user_memory',
      {
        title: 'Get User Memory',
        description: 'Get user memory data',
        inputSchema: userSchemas.getUserMemory,
      },
      (params) => this.userHandlers.handleGetUserMemory(params),
    );

    server.registerTool(
      'auth_signin',
      {
        title: 'Sign In',
        description: 'Sign in to get authentication token on private servers',
        inputSchema: userSchemas.authSignin,
      },
      async (params: AuthSigninOptions) => {
        const result = await this.userHandlers.handleAuthSignin(params);

        // Handle token update if signin was successful
        try {
          // We need to extract the token from the API response
          const data = await this.apiClient.makeApiCall('/auth/signin', {
            method: 'POST',
            body: JSON.stringify({ email: params.email, password: params.password }),
          });

          if (data.token) {
            this.configManager.setToken(data.token);
          }
        } catch (error) {
          // Token update failed, but the original result is still valid
        }

        return result;
      },
    );

    // Market Tools
    server.registerTool(
      'get_market_orders_index',
      {
        title: 'Get Market Orders Index',
        description: 'Get market orders index',
        inputSchema: marketSchemas.getMarketOrdersIndex,
      },
      () => this.marketHandlers.handleGetMarketOrdersIndex(),
    );

    server.registerTool(
      'get_my_market_orders',
      {
        title: 'Get My Market Orders',
        description: "Get user's market orders",
        inputSchema: marketSchemas.getMyMarketOrders,
      },
      () => this.marketHandlers.handleGetMyMarketOrders(),
    );

    server.registerTool(
      'get_market_orders',
      {
        title: 'Get Market Orders',
        description: 'Get market orders for a specific resource',
        inputSchema: marketSchemas.getMarketOrders,
      },
      (params) => this.marketHandlers.handleGetMarketOrders(params),
    );

    server.registerTool(
      'get_money_history',
      {
        title: 'Get Money History',
        description: 'Get user money transaction history',
        inputSchema: marketSchemas.getMoneyHistory,
      },
      (params) => this.marketHandlers.handleGetMoneyHistory(params),
    );

    server.registerTool(
      'get_map_stats',
      {
        title: 'Get Map Statistics',
        description: 'Get map statistics for specified rooms',
        inputSchema: marketSchemas.getMapStats,
      },
      (params) => this.marketHandlers.handleGetMapStats(params),
    );

    // Miscellaneous Tools
    server.registerTool(
      'get_pvp_info',
      {
        title: 'Get PvP Information',
        description: 'Get PvP information from experimental endpoint',
        inputSchema: miscSchemas.getPvpInfo,
      },
      (params) => this.miscHandlers.handleGetPvpInfo(params),
    );

    server.registerTool(
      'get_nukes_info',
      {
        title: 'Get Nukes Information',
        description: 'Get active nukes information by shard',
        inputSchema: miscSchemas.getNukesInfo,
      },
      () => this.miscHandlers.handleGetNukesInfo(),
    );
  }
}
