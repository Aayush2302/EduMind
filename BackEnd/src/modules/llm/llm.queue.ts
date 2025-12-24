import { Queue } from 'bullmq';
import { redis } from '../../config/redis.js';

export const llmQueue = new Queue('llm-jobs',{
    connection : redis
});