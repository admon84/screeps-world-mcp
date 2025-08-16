import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ConfigManager } from '../config/index.js';
import { ApiClient } from '../utils/api.js';
import { ResourceRegistry } from '../resources/index.js';
import { ToolRegistry } from '../tools/index.js';
import { ScreepsConfig } from '../types/index.js';

export class ScreepsWorldMcp {
  private server: McpServer;
  private configManager: ConfigManager;
  private apiClient: ApiClient;
  private resourceRegistry: ResourceRegistry;
  private toolRegistry: ToolRegistry;

  constructor(config: Partial<ScreepsConfig> = {}) {
    this.configManager = new ConfigManager(config);
    this.apiClient = new ApiClient(this.configManager);

    this.server = new McpServer({
      name: 'screeps-world-mcp',
      version: '1.0.0',
      description: 'MCP server for Screeps World Web API access',
    });

    this.resourceRegistry = new ResourceRegistry(this.apiClient);
    this.toolRegistry = new ToolRegistry(this.apiClient, this.configManager);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Register all resources and tools
    this.resourceRegistry.registerAll(this.server);
    this.toolRegistry.registerAll(this.server);
  }

  public async start(): Promise<void> {
    if (!this.configManager.getToken()) {
      console.log('No token found, set the SCREEPS_TOKEN environment variable and try again');
      return;
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.log('Screeps World MCP Service is running...');
    console.log('Screeps Server:', this.configManager.getBaseUrl());
  }

  public getConfig(): ScreepsConfig {
    return this.configManager.getConfig();
  }

  public updateConfig(updates: Partial<ScreepsConfig>): void {
    this.configManager.updateConfig(updates);
  }

  public getServer(): McpServer {
    return this.server;
  }
}
