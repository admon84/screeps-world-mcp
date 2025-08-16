import { z } from 'zod';
import { ApiClient } from '../utils/api.js';
import {
  ToolResult,
  RoomTerrainOptions,
  RoomOptions,
  RoomOverviewOptions,
  DistanceCalculationOptions,
  RoomCoordinates,
} from '../types/index.js';

export class RoomToolHandlers {
  constructor(private apiClient: ApiClient) {}

  async handleGetRoomTerrain(params: RoomTerrainOptions): Promise<ToolResult> {
    try {
      const endpoint = this.apiClient.buildEndpointWithQuery('/game/room-terrain', params);
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        'Use terrain data to plan creep paths and identify chokepoints',
        'Check for natural barriers that might affect room layout',
        'Consider terrain when planning structure placement',
      ];

      return this.apiClient.createEnhancedToolResult(
        data,
        endpoint,
        `Room Terrain Analysis for ${params.room}`,
        false,
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createToolResult(
        `Error getting room terrain: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  async handleGetRoomObjects(params: RoomOptions): Promise<ToolResult> {
    try {
      const endpoint = this.apiClient.buildEndpointWithQuery('/game/room-objects', params);
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        '✅ COMPLETE: All room objects retrieved successfully - NO MORE CALLS NEEDED',
        '🛑 STOP: This data is complete - do NOT call get_room_objects again for this room',
        '📊 ANALYZE: Process the structures, creeps, and resources from this response',
        '🎯 NEXT: Use this data to understand room composition and development level',
        'Analyze structures to understand room development level',
        'Check for enemy creeps or defensive structures',
        'Look for resource deposits and energy sources',
      ];

      return this.apiClient.createEnhancedToolResult(
        data,
        endpoint,
        `Room Objects Analysis for ${params.room}`,
        false,
        additionalGuidance,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if this is a loop detection error and make it more prominent
      if (errorMessage.includes('LOOP DETECTED')) {
        return this.apiClient.createToolResult(
          `🚨 CRITICAL ERROR - LOOP DETECTED 🚨\n\n` +
            `${errorMessage}\n\n` +
            `⚠️ SYSTEM MESSAGE: This tool has been called multiple times for the same room.\n` +
            `📊 SOLUTION: Analyze the data from previous calls instead of making new ones.\n` +
            `🛑 ACTION REQUIRED: Stop calling get_room_objects and use existing data.`,
          true,
        );
      }

      return this.apiClient.createToolResult(`Error getting room objects: ${errorMessage}`, true);
    }
  }

  async handleGetRoomOverview(params: RoomOverviewOptions): Promise<ToolResult> {
    try {
      const endpoint = this.apiClient.buildEndpointWithQuery('/game/room-overview', params);
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        'Use overview data to track room performance trends',
        'Compare statistics across different time intervals',
        'Identify rooms that need attention or optimization',
      ];

      return this.apiClient.createEnhancedToolResult(
        data,
        endpoint,
        `Room Overview for ${params.room}`,
        false,
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createToolResult(
        `Error getting room overview: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  async handleGetRoomStatus(params: RoomOptions): Promise<ToolResult> {
    try {
      const endpoint = this.apiClient.buildEndpointWithQuery('/game/room-status', params);
      const data = await this.apiClient.makeApiCall(endpoint);

      const additionalGuidance = [
        'Check room status before planning operations',
        'Verify room accessibility and ownership',
        'Use status to understand room type and restrictions',
      ];

      return this.apiClient.createEnhancedToolResult(
        data,
        endpoint,
        `Room Status for ${params.room}`,
        false,
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createToolResult(
        `Error getting room status: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  async handleCalculateDistance(params: DistanceCalculationOptions): Promise<ToolResult> {
    try {
      const parseRoom = (roomName: string): RoomCoordinates => {
        const match = roomName.match(/^([EW])(\d+)([NS])(\d+)$/);
        if (!match) throw new Error(`Invalid room name: ${roomName}`);

        const [, ew, x, ns, y] = match;

        const xNum = parseInt(x);
        const xCoord = ew === 'E' ? xNum : -(xNum + 1);

        const yNum = parseInt(y);
        const yCoord = ns === 'N' ? yNum : -(yNum + 1);

        return { x: xCoord, y: yCoord };
      };

      const fromCoords = parseRoom(params.from);
      const toCoords = parseRoom(params.to);

      // Calculate grid-based distances for Screeps world
      const deltaX = Math.abs(toCoords.x - fromCoords.x);
      const deltaY = Math.abs(toCoords.y - fromCoords.y);

      // Chebyshev distance (max of horizontal/vertical moves - allows diagonal movement)
      const chebyshevDistance = Math.max(deltaX, deltaY);

      const distanceData = {
        from: params.from,
        to: params.to,
        fromCoords,
        toCoords,
        deltaX,
        deltaY,
        chebyshevDistance,
        manhattanDistance: deltaX + deltaY,
        euclideanDistance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
      };

      const additionalGuidance = [
        '✅ Distance calculation complete - no additional API calls needed',
        'Use Chebyshev distance for room-to-room movement planning',
        'Consider Manhattan distance for creep pathfinding estimates',
        'Factor in terrain and obstacles for actual travel time',
      ];

      return this.apiClient.createEnhancedToolResult(
        distanceData,
        `calculate_distance(${params.from}, ${params.to})`,
        `Distance Calculation: ${params.from} to ${params.to}`,
        false,
        additionalGuidance,
      );
    } catch (error) {
      return this.apiClient.createToolResult(
        `Error calculating distance: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  // Zod schemas for validation
  static getSchemas() {
    return {
      roomTerrain: {
        room: z.string().describe('Room name (e.g., E1N8)'),
        shard: z.string().optional().describe('Shard name (default: shard0)'),
        encoded: z.boolean().optional().describe('Return encoded terrain data'),
      },
      roomObjects: {
        room: z.string().describe('Room name (e.g., E1N8)'),
        shard: z.string().optional().describe('Shard name (default: shard0)'),
      },
      roomOverview: {
        room: z.string().describe('Room name (e.g., E1N8)'),
        shard: z.string().optional().describe('Shard name (default: shard0)'),
        interval: z.enum(['8', '180', '1440']).optional().describe('Interval: 8=1hr, 180=24hr, 1440=7days'),
      },
      roomStatus: {
        room: z.string().describe('Room name (e.g., E1N8)'),
        shard: z.string().optional().describe('Shard name (default: shard0)'),
      },
      calculateDistance: {
        from: z.string().describe('Source room name (e.g., E1N8)'),
        to: z.string().describe('Destination room name (e.g., E2N8)'),
      },
    };
  }
}
