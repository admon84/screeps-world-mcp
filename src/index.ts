import { ScreepsWorldMcp } from './server/screeps.js';

const service = new ScreepsWorldMcp();
service.start().catch(console.error);
