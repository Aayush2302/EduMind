import { Router } from 'express';
import {
    createChatHandler,
    getChatsHandler,
    archiveChatHandler
} from '../modules/chats/chat.controller.js';
import { validateUserContext } from '../middleware/validateUserContext.js';

const router = Router();

// All chat routes require authenticated user context
router.use(validateUserContext);

// Create a new chat inside a folder
router.post('/folders/:folderId/chats', createChatHandler);

// Get all chats of a folder
router.get('/folders/:folderId/chats', getChatsHandler);

// Archive (soft delete) a chat
router.delete('/chats/:chatId', archiveChatHandler);

export default router;
