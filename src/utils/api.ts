import { ConfigManager } from '../config/index.js';
import { ToolResult, ResourceContent } from '../types/index.js';

export interface ApiResponseMetadata {
  endpoint: string;
  timestamp: string;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
    limit: number;
  };
  dataCompleteness: 'complete' | 'partial' | 'empty';
  suggestedNextActions?: string[];
  warnings?: string[];
}

export class ApiClient {
  private responseCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private lastRateLimitInfo: ApiResponseMetadata['rateLimitInfo'] | undefined;
  private recentCalls: Array<{ endpoint: string; timestamp: number; cacheKey: string }> = [];
  private maxRecentCalls = 20; // Track last 20 calls

  constructor(private configManager: ConfigManager) {}

  async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Check cache first
    const cacheKey = this.generateCacheKey(endpoint, options);
    const cachedResult = this.getCachedResult(cacheKey);

    // Track this call for loop detection BEFORE checking cache
    this.trackCall(endpoint, cacheKey);

    // Detect loops early and block the call
    const loopDetection = this.detectLoops();
    if (loopDetection.isLoop) {
      throw new Error(
        `🚨 LOOP DETECTED: This identical API call has been made multiple times recently. ` +
          `Please analyze the existing data instead of making repeated calls. ` +
          `Endpoint: ${endpoint}`,
      );
    }

    if (cachedResult) {
      // Add cache hit indicator
      this.lastRateLimitInfo = undefined; // No rate limit info for cached results
      return {
        ...cachedResult,
        _cacheHit: true,
        _cachedAt: new Date().toISOString(),
      };
    }

    const url = `${this.configManager.getBaseUrl()}${endpoint}`;
    const headers = {
      ...this.configManager.getAuthHeaders(),
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Extract rate limit information
      this.lastRateLimitInfo = this.extractRateLimitInfo(response);

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(
            `Rate limit exceeded. Retry after ${retryAfter || 'unknown'} seconds. Consider reducing API call frequency.`,
          );
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the result
      this.setCachedResult(cacheKey, data, this.getCacheTTL(endpoint));

      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private trackCall(endpoint: string, cacheKey: string): void {
    this.recentCalls.push({
      endpoint,
      cacheKey,
      timestamp: Date.now(),
    });

    // Keep only recent calls
    if (this.recentCalls.length > this.maxRecentCalls) {
      this.recentCalls.shift();
    }
  }

  private detectLoops(): { isLoop: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let isLoop = false;

    // Check for identical calls within last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentIdenticalCalls = new Map<string, number>();

    this.recentCalls
      .filter((call) => call.timestamp > fiveMinutesAgo)
      .forEach((call) => {
        const count = recentIdenticalCalls.get(call.cacheKey) || 0;
        recentIdenticalCalls.set(call.cacheKey, count + 1);
      });

    // Check for repetitive patterns - be more aggressive
    for (const [cacheKey, count] of recentIdenticalCalls.entries()) {
      if (count >= 2) {
        isLoop = true;
        warnings.push(`🚨 CRITICAL LOOP DETECTED: Identical call made ${count} times in the last 5 minutes`);
        warnings.push(`🛑 STOP IMMEDIATELY: You already have all the data from this endpoint`);
        warnings.push(`💡 MANDATORY: Analyze the existing data - DO NOT make more calls`);
        warnings.push(`⚠️ SYSTEM: Further identical calls will be blocked`);
      }
    }

    // Check for endpoint overuse
    const endpointCounts = new Map<string, number>();
    this.recentCalls.forEach((call) => {
      const count = endpointCounts.get(call.endpoint) || 0;
      endpointCounts.set(call.endpoint, count + 1);
    });

    for (const [endpoint, count] of endpointCounts.entries()) {
      if (count >= 5) {
        warnings.push(`⚠️ OVERUSE WARNING: ${endpoint} called ${count} times recently`);
        warnings.push(`🎯 SUGGESTION: Consider using different endpoints or analyzing existing data`);
      }
    }

    return { isLoop, warnings };
  }

  private generateCacheKey(endpoint: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  private getCachedResult(cacheKey: string): any | null {
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() < cached.timestamp + cached.ttl) {
      return cached.data;
    }

    if (cached) {
      // Clean up expired cache entry
      this.responseCache.delete(cacheKey);
    }

    return null;
  }

  private setCachedResult(cacheKey: string, data: any, ttl: number): void {
    this.responseCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private getCacheTTL(endpoint: string): number {
    // Cache TTL in milliseconds based on endpoint type

    // Resource endpoints (more static data)
    if (endpoint.includes('/auth/me')) {
      return 15 * 60 * 1000; // 15 minutes - user info rarely changes
    }
    if (endpoint.includes('/version')) {
      return 60 * 60 * 1000; // 1 hour - version changes only on server updates
    }
    if (endpoint.includes('/game/world-size')) {
      return 60 * 60 * 1000; // 1 hour - world size never changes
    }
    if (endpoint.includes('/game/shards/info')) {
      return 10 * 60 * 1000; // 10 minutes - shard list changes rarely
    }
    if (endpoint.includes('/user/world-status')) {
      return 2 * 60 * 1000; // 2 minutes - user status updates periodically
    }
    if (endpoint.includes('/game/time')) {
      return 5 * 1000; // 5 seconds - game time updates every tick
    }
    if (endpoint.includes('/game/market/stats')) {
      return 60 * 1000; // 1 minute - market stats update regularly
    }

    // Tool endpoints (more dynamic data)
    if (endpoint.includes('room-terrain')) {
      return 5 * 60 * 1000; // 5 minutes - terrain rarely changes
    }
    if (endpoint.includes('room-status')) {
      return 60 * 1000; // 1 minute - status changes occasionally
    }
    if (endpoint.includes('room-objects')) {
      return 10 * 1000; // 10 seconds - objects change frequently
    }
    if (endpoint.includes('user/stats') || endpoint.includes('user/overview')) {
      return 30 * 1000; // 30 seconds - stats update periodically
    }
    if (endpoint.includes('market')) {
      return 15 * 1000; // 15 seconds - market data changes frequently
    }

    return 30 * 1000; // Default 30 seconds
  }

  private extractRateLimitInfo(response: Response): ApiResponseMetadata['rateLimitInfo'] {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        resetTime: parseInt(reset),
      };
    }
    return undefined;
  }

  createEnhancedToolResult(
    data: any,
    endpoint: string,
    description: string,
    isError = false,
    additionalGuidance?: string[],
  ): ToolResult {
    // Detect loops and add warnings
    const loopDetection = this.detectLoops();

    const metadata: ApiResponseMetadata = {
      endpoint,
      timestamp: new Date().toISOString(),
      rateLimitInfo: this.lastRateLimitInfo,
      dataCompleteness: this.assessDataCompleteness(data),
      suggestedNextActions: this.generateSuggestedActions(data, endpoint),
      warnings: [...this.generateWarnings(data, endpoint), ...loopDetection.warnings],
    };

    if (additionalGuidance) {
      metadata.suggestedNextActions = [...(metadata.suggestedNextActions || []), ...additionalGuidance];
    }

    // Add loop-specific guidance
    if (loopDetection.isLoop) {
      metadata.suggestedNextActions = [
        '🚨 CRITICAL: Loop detected - DO NOT make more API calls',
        '📊 ANALYZE: Use the data you already have',
        '🎯 FOCUS: Draw conclusions from existing information',
        ...(metadata.suggestedNextActions || []),
      ];
    }

    const formattedResponse = this.formatResponse(data, metadata, description);

    return {
      content: [
        {
          type: 'text' as const,
          text: formattedResponse,
        },
      ],
      isError: isError || loopDetection.isLoop, // Mark as error if loop detected
    };
  }

  private assessDataCompleteness(data: any): 'complete' | 'partial' | 'empty' {
    if (
      !data ||
      (Array.isArray(data) && data.length === 0) ||
      (typeof data === 'object' && Object.keys(data).length === 0)
    ) {
      return 'empty';
    }

    // Check for common pagination indicators
    if (data.hasMore || data.nextPage || data.continuation) {
      return 'partial';
    }

    return 'complete';
  }

  private generateSuggestedActions(data: any, endpoint: string): string[] {
    const actions: string[] = [];

    // Rate limit guidance
    if (this.lastRateLimitInfo && this.lastRateLimitInfo.remaining < 10) {
      actions.push(
        `⚠️ Rate limit warning: Only ${this.lastRateLimitInfo.remaining} requests remaining. Consider using other endpoints or waiting.`,
      );
    }

    // Endpoint-specific guidance with completion indicators
    if (endpoint.includes('room-terrain') && data?.terrain) {
      actions.push(
        '✅ Room terrain data retrieved successfully. You can now analyze room layout, find exits, or plan paths.',
      );
      actions.push('🎯 NEXT STEPS: Use this terrain data for pathfinding analysis - no need to fetch terrain again');
    }

    if (endpoint.includes('room-objects') && data?.objects) {
      actions.push(
        '✅ Room objects data retrieved successfully. You can now analyze structures, creeps, and resources in the room.',
      );
      actions.push(
        '🎯 NEXT STEPS: Process the objects data to understand room composition - additional calls not needed',
      );
    }

    if (endpoint.includes('room-overview') && data?.stats) {
      actions.push('✅ Room overview statistics retrieved successfully. You can now analyze room performance trends.');
      actions.push('🎯 NEXT STEPS: Compare these statistics with other rooms or time periods using the data provided');
    }

    if (endpoint.includes('room-status') && data?.status) {
      actions.push(
        '✅ Room status information retrieved successfully. You can now understand room accessibility and type.',
      );
      actions.push('🎯 NEXT STEPS: Use this status information for planning - no additional status calls needed');
    }

    if (endpoint.includes('market/orders') && data?.list) {
      actions.push(
        `✅ Market orders retrieved (${data.list.length} orders). You can now analyze market trends or find trading opportunities.`,
      );
      actions.push(
        '🎯 NEXT STEPS: Analyze the price trends and order volumes from this data - market data is complete',
      );
    }

    if (endpoint.includes('user/stats') && data?.stats) {
      actions.push(
        '✅ User statistics retrieved successfully. You can now analyze performance trends or compare different time periods.',
      );
      actions.push(
        '🎯 NEXT STEPS: Calculate trends and insights from this statistical data - no more stats calls needed',
      );
    }

    if (endpoint.includes('user/memory') && data?.data) {
      actions.push('✅ User memory data retrieved successfully. You can now access stored game state information.');
      actions.push('🎯 NEXT STEPS: Parse and analyze the memory data structure - memory data is complete');
    }

    if (endpoint.includes('calculate_distance')) {
      actions.push('✅ Distance calculation completed successfully. All distance metrics have been calculated.');
      actions.push(
        '🎯 NEXT STEPS: Use the calculated distances for planning - no additional distance calculations needed',
      );
    }

    // Data completeness guidance
    if (this.assessDataCompleteness(data) === 'empty') {
      actions.push(
        'ℹ️ No data found for this query. Consider checking different parameters or trying a different endpoint.',
      );
      actions.push(
        "🎯 NEXT STEPS: Verify your query parameters or try a different approach - repeated calls won't help",
      );
    } else if (this.assessDataCompleteness(data) === 'complete') {
      actions.push('✅ COMPLETE: All requested data has been successfully retrieved');
      actions.push('🎯 STOP: No additional API calls needed - proceed with data analysis');
    }

    // General completion guidance
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const dataKeys = Object.keys(data);
      if (dataKeys.length > 0) {
        actions.push(`📊 DATA READY: Response contains ${dataKeys.length} data fields - sufficient for analysis`);
      }
    }

    return actions;
  }

  private generateWarnings(data: any, endpoint: string): string[] {
    const warnings: string[] = [];

    // Rate limit warnings
    if (this.lastRateLimitInfo) {
      if (this.lastRateLimitInfo.remaining < 5) {
        warnings.push(`🚨 CRITICAL: Only ${this.lastRateLimitInfo.remaining} API calls remaining before rate limit!`);
      } else if (this.lastRateLimitInfo.remaining < 20) {
        warnings.push(
          `⚠️ WARNING: Low API calls remaining (${this.lastRateLimitInfo.remaining}). Plan your next calls carefully.`,
        );
      }
    }

    // Data-specific warnings
    if (endpoint.includes('room-objects') && data?.objects && data.objects.length > 100) {
      warnings.push('⚠️ Large dataset returned. Consider filtering or processing in smaller chunks.');
    }

    return warnings;
  }

  private formatResponse(data: any, metadata: ApiResponseMetadata, description: string): string {
    const sections: string[] = [];

    // Header with description
    sections.push(`# ${description}`);
    sections.push(`📅 **Timestamp**: ${metadata.timestamp}`);
    sections.push(`🔗 **Endpoint**: ${metadata.endpoint}`);

    // Cache information
    if (data._cacheHit) {
      sections.push(`\n## 🚀 Cache Status`);
      sections.push(`- **Status**: ✅ Cache HIT - Data served from cache`);
      sections.push(`- **Cached At**: ${data._cachedAt}`);
      sections.push(`- **Performance**: This request used cached data, saving API rate limits`);
    } else {
      sections.push(`\n## 🚀 Cache Status`);
      sections.push(`- **Status**: 🔄 Cache MISS - Fresh data retrieved from API`);
      sections.push(`- **Performance**: This request consumed API rate limits`);
    }

    // Rate limit info (only for non-cached responses)
    if (metadata.rateLimitInfo && !data._cacheHit) {
      sections.push(`\n## 🚦 Rate Limit Status`);
      sections.push(`- **Remaining**: ${metadata.rateLimitInfo.remaining}/${metadata.rateLimitInfo.limit}`);
      sections.push(`- **Resets at**: ${new Date(metadata.rateLimitInfo.resetTime * 1000).toISOString()}`);
    }

    // Data completeness
    sections.push(`\n## 📊 Data Status`);
    sections.push(`- **Completeness**: ${metadata.dataCompleteness}`);

    // Warnings
    if (metadata.warnings && metadata.warnings.length > 0) {
      sections.push(`\n## ⚠️ Warnings`);
      metadata.warnings.forEach((warning) => sections.push(`- ${warning}`));
    }

    // Main data (clean up cache metadata)
    const cleanData = { ...data };
    delete cleanData._cacheHit;
    delete cleanData._cachedAt;

    sections.push(`\n## 📋 Data`);
    sections.push(`\`\`\`json`);
    sections.push(JSON.stringify(cleanData, null, 2));
    sections.push(`\`\`\``);

    // Suggested actions
    if (metadata.suggestedNextActions && metadata.suggestedNextActions.length > 0) {
      sections.push(`\n## 🎯 Suggested Next Actions`);
      metadata.suggestedNextActions.forEach((action) => sections.push(`- ${action}`));
    }

    // Add cache-specific guidance
    if (data._cacheHit) {
      sections.push(`\n## 💡 Cache Guidance`);
      sections.push(`- ✅ This data was served from cache - no need to call the same endpoint again immediately`);
      sections.push(`- 🔄 If you need fresher data, wait for cache to expire or use a different endpoint`);
      sections.push(`- 💰 Cache hits help preserve your API rate limits`);
    }

    // Clear completion indicator
    sections.push(`\n## ✅ Query Complete`);
    sections.push(
      `This query has been completed successfully. All requested data has been retrieved and formatted above.`,
    );

    return sections.join('\n');
  }

  // Legacy method for backward compatibility
  createToolResult(text: string, isError = false): ToolResult {
    return {
      content: [
        {
          type: 'text' as const,
          text,
        },
      ],
      isError,
    };
  }

  createResourceContent(uri: string, data: any): ResourceContent {
    return {
      contents: [
        {
          uri: uri,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  createErrorResourceContent(uri: string, error: unknown): ResourceContent {
    return {
      contents: [
        {
          uri: uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              error: error instanceof Error ? error.message : String(error),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async handleToolCall<T>(
    endpoint: string,
    params: T,
    description: string,
    options: RequestInit = {},
  ): Promise<ToolResult> {
    try {
      const data = await this.makeApiCall(endpoint, options);
      return this.createToolResult(`${description}:\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      return this.createToolResult(
        `Error ${description.toLowerCase()}: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  }

  buildQueryParams(params: Record<string, any>): URLSearchParams {
    const urlParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlParams.append(key, String(value));
      }
    });

    return urlParams;
  }

  buildEndpointWithQuery(baseEndpoint: string, params: Record<string, any>): string {
    const queryParams = this.buildQueryParams(params);
    const queryString = queryParams.toString();
    return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
  }

  // Enhanced resource content with metadata
  createEnhancedResourceContent(
    uri: string,
    data: any,
    endpoint: string,
    description: string,
    additionalGuidance?: string[],
  ): ResourceContent {
    // Detect loops and add warnings for resources too
    const loopDetection = this.detectLoops();

    const metadata: ApiResponseMetadata = {
      endpoint,
      timestamp: new Date().toISOString(),
      rateLimitInfo: this.lastRateLimitInfo,
      dataCompleteness: this.assessDataCompleteness(data),
      suggestedNextActions: this.generateResourceGuidance(data, endpoint),
      warnings: [...this.generateWarnings(data, endpoint), ...loopDetection.warnings],
    };

    if (additionalGuidance) {
      metadata.suggestedNextActions = [...(metadata.suggestedNextActions || []), ...additionalGuidance];
    }

    // Add loop-specific guidance for resources
    if (loopDetection.isLoop) {
      metadata.suggestedNextActions = [
        '🚨 CRITICAL: Loop detected - STOP accessing this resource repeatedly',
        '📊 ANALYZE: Use the resource data you already have',
        '🎯 FOCUS: This resource data is static/semi-static - no need to refetch',
        ...(metadata.suggestedNextActions || []),
      ];
    }

    const formattedResponse = this.formatResourceResponse(data, metadata, description, uri);

    return {
      contents: [
        {
          uri: uri,
          mimeType: 'text/markdown',
          text: formattedResponse,
        },
      ],
    };
  }

  private generateResourceGuidance(data: any, endpoint: string): string[] {
    const actions: string[] = [];

    // Rate limit guidance
    if (this.lastRateLimitInfo && this.lastRateLimitInfo.remaining < 10) {
      actions.push(
        `⚠️ Rate limit warning: Only ${this.lastRateLimitInfo.remaining} requests remaining. Resources are cached - use them efficiently.`,
      );
    }

    // Resource-specific guidance
    if (endpoint.includes('/auth/me') && data?.username) {
      actions.push('✅ User authentication verified successfully');
      actions.push('🎯 STATIC DATA: This user info rarely changes - no need to refetch frequently');
    }

    if (endpoint.includes('/game/time') && data?.time) {
      actions.push('✅ Game time retrieved successfully');
      actions.push('🎯 DYNAMIC DATA: Game time updates every tick but is cached appropriately');
    }

    if (endpoint.includes('/game/world-size') && data?.width) {
      actions.push('✅ World size information retrieved successfully');
      actions.push('🎯 STATIC DATA: World size never changes - cache this data locally');
    }

    if (endpoint.includes('/game/shards/info') && data?.shards) {
      actions.push(`✅ Shard information retrieved (${data.shards?.length || 0} shards available)`);
      actions.push('🎯 SEMI-STATIC DATA: Shard list changes rarely - safe to cache long-term');
    }

    if (endpoint.includes('/version') && data?.version) {
      actions.push('✅ Server version and features retrieved successfully');
      actions.push('🎯 STATIC DATA: Version info changes only during server updates - cache indefinitely');
    }

    if (endpoint.includes('/game/market/stats') && data?.credits) {
      actions.push('✅ Market statistics retrieved successfully');
      actions.push('🎯 DYNAMIC DATA: Market stats update regularly but are cached appropriately');
    }

    if (endpoint.includes('/user/world-status') && data?.status) {
      actions.push('✅ User world status retrieved successfully');
      actions.push('🎯 SEMI-DYNAMIC DATA: User status changes periodically - cached for efficiency');
    }

    // General resource completion guidance
    actions.push('📊 RESOURCE COMPLETE: All data loaded successfully');
    actions.push('💡 EFFICIENCY TIP: Resources are designed to be accessed once and cached');

    return actions;
  }

  private formatResourceResponse(data: any, metadata: ApiResponseMetadata, description: string, uri: string): string {
    const sections: string[] = [];

    // Header with description
    sections.push(`# 📚 ${description}`);
    sections.push(`📅 **Timestamp**: ${metadata.timestamp}`);
    sections.push(`🔗 **Resource URI**: ${uri}`);
    sections.push(`🔗 **API Endpoint**: ${metadata.endpoint}`);

    // Cache information
    if (data._cacheHit) {
      sections.push(`\n## 🚀 Cache Status`);
      sections.push(`- **Status**: ✅ Cache HIT - Resource served from cache`);
      sections.push(`- **Cached At**: ${data._cachedAt}`);
      sections.push(`- **Performance**: This resource used cached data, optimizing performance`);
    } else {
      sections.push(`\n## 🚀 Cache Status`);
      sections.push(`- **Status**: 🔄 Cache MISS - Fresh resource data retrieved`);
      sections.push(`- **Performance**: This resource consumed API rate limits`);
    }

    // Rate limit info (only for non-cached responses)
    if (metadata.rateLimitInfo && !data._cacheHit) {
      sections.push(`\n## 🚦 Rate Limit Status`);
      sections.push(`- **Remaining**: ${metadata.rateLimitInfo.remaining}/${metadata.rateLimitInfo.limit}`);
      sections.push(`- **Resets at**: ${new Date(metadata.rateLimitInfo.resetTime * 1000).toISOString()}`);
    }

    // Data completeness
    sections.push(`\n## 📊 Resource Status`);
    sections.push(`- **Completeness**: ${metadata.dataCompleteness}`);
    sections.push(`- **Type**: MCP Resource (static/semi-static data)`);

    // Warnings
    if (metadata.warnings && metadata.warnings.length > 0) {
      sections.push(`\n## ⚠️ Warnings`);
      metadata.warnings.forEach((warning) => sections.push(`- ${warning}`));
    }

    // Main data (clean up cache metadata)
    const cleanData = { ...data };
    delete cleanData._cacheHit;
    delete cleanData._cachedAt;

    sections.push(`\n## 📋 Resource Data`);
    sections.push(`\`\`\`json`);
    sections.push(JSON.stringify(cleanData, null, 2));
    sections.push(`\`\`\``);

    // Suggested actions
    if (metadata.suggestedNextActions && metadata.suggestedNextActions.length > 0) {
      sections.push(`\n## 🎯 Resource Guidance`);
      metadata.suggestedNextActions.forEach((action) => sections.push(`- ${action}`));
    }

    // Resource-specific guidance
    if (data._cacheHit) {
      sections.push(`\n## 💡 Cache Optimization`);
      sections.push(`- ✅ This resource was served from cache - excellent performance`);
      sections.push(`- 🔄 Resources are designed to be accessed efficiently`);
      sections.push(`- 💰 Cache hits preserve your API rate limits for tools that need fresh data`);
    }

    // Clear completion indicator
    sections.push(`\n## ✅ Resource Complete`);
    sections.push(`This resource has been loaded successfully. Resource data is now available for use.`);
    sections.push(`📌 **Remember**: Resources provide foundational data - use tools for dynamic queries.`);

    return sections.join('\n');
  }
}
