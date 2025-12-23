import { Router } from 'express';
import {
  createFolderHandler,
  getFoldersHandler,
  deleteFolderHandler
} from '../modules/folders/folder.controller.js';
import { validateUserContext } from '../middleware/validateUserContext.js';

const router = Router();

// All folder routes require authenticated user
router.use(validateUserContext);

// Create a new folder
router.post('/createFolder', createFolderHandler);

// Get all folders of logged-in user
router.get('/getFolders', getFoldersHandler);

// Soft delete a folder
router.delete('/:folderId', deleteFolderHandler);

export default router;
