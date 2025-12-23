import { z } from 'zod';

export const createChatSchema = z.object({
    title: z.string().min(1, 'Chat title is required'),
    studyMode: z.enum(["simple", "step", "interview"]).optional()
});