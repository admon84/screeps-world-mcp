# Screeps World MCP Service

![Made with AI](https://img.shields.io/badge/Made%20with-AI-lightgrey?style=for-the-badge)

Integrates live Screeps server data directly into AI development workflows.

## Features

- **Comprehensive API Coverage**: Room operations, user data, market information, map analytics, and utilities
- **AI-Optimized**: Enhanced responses with loop detection, caching, and completion indicators
- **Rate Limit Aware**: Monitoring and guidance to prevent API limit issues
- **TypeScript**: Full type safety with zod schema validation
- **MCP Protocol**: Compatible with MCP-enabled clients

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your Screeps credentials:
```bash
cp .env.example .env
# Edit .env with your Screeps config
```

3. Build the project:
```bash
npm run build
```

4. Start the service:
```bash
npm start
```

## Configuration

The service can be configured via environment variables or constructor parameters:

- `SCREEPS_BASE_URL`: API base URL (defaults to official server)
- `SCREEPS_TOKEN`: Your Screeps authentication token
- `SCREEPS_USERNAME`: Your Screeps username (optional)

### Getting Your Screeps Token

1. Go to [Screeps Account Settings](https://screeps.com/a/#!/account/auth-tokens)
2. Create a new auth token
3. Add it to your `.env` file

## Development

Run TypeScript in watch mode:
```bash
npm run dev
```

Format code with Prettier:
```bash
npm run format
```

## Usage Examples

After completing the [setup](#setup), add to your `mcp.json`:

```json
{
  "mcpServers": {
    "screeps-world": {
      "command": "node",
      "args": ["/path/to/screeps-world-mcp/dist/index.js"],
      "env": {
        "SCREEPS_TOKEN": "your_token_here"
      }
    }
  }
}
```

## AI Usage Guidelines

1. **Follow Response Guidance**: Each response includes completion indicators and suggested next steps
2. **Avoid Redundant Calls**: The server detects and warns against repetitive identical calls  
3. **Start with Resources**: Get foundational data (version, shards) before using tools for specific queries
4. **Respect Rate Limits**: Monitor remaining API calls shown in responses

## Available Resources

Resources provide static or server-wide data:

- **auth_me**: Current authenticated user information
- **game_time**: Current game time and tick information
- **world_size**: World dimensions and size information
- **shards_info**: Information about available shards
- **user_world_status**: Current user world status and statistics
- **market_stats**: Market statistics and trading information
- **version**: API version and server information

## Available Tools

Tools allow interactive queries with parameters:

### Room Information
- **get_room_terrain**: Get terrain information for a specific room
- **get_room_objects**: Get objects and users in a specific room
- **get_room_overview**: Get room overview and statistics
- **get_room_status**: Get room status information

### Market Information
- **get_market_orders_index**: Get market orders index
- **get_my_market_orders**: Get user's market orders
- **get_market_orders**: Get market orders for a specific resource
- **get_money_history**: Get user money transaction history

### User Data
- **get_user_name**: Get user name
- **get_user_stats**: Get user statistics with optional interval
- **get_user_rooms**: Get user rooms with optional interval
- **find_user**: Find user by ID or username
- **get_user_overview**: Get user overview statistics with interval and stat filtering
- **get_user_memory**: Get user memory data
- **execute_console_command**: Execute console command in Screeps

### Map & Analytics
- **get_map_stats**: Get map statistics for specified rooms

### Experimental Features
- **get_pvp_info**: Get PvP information
- **get_nukes_info**: Get active nukes information by shard

### Utilities
- **calculate_distance**: Calculate distance between two rooms
- **auth_signin**: Sign in to Screeps to get authentication token