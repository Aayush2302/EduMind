import { Router } from "express";
import {
  getMessagesHandler,
  createMessageHandler
} from "../modules/messages/message.controller.js";
import { validateUserContext } from '../middleware/validateUserContext.js';

const router = Router();

router.use(validateUserContext);

router.get("/chats/:chatId/messages", getMessagesHandler);
router.post("/chats/:chatId/messages", createMessageHandler);

export default router;
