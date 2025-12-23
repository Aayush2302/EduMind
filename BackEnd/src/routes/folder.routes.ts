import { Router } from 'express';
import { createFolderHandler,
    getFoldersHandler,
    deleteFolderHandler
 } from '../modules/folders/folder.controller.js';

 import { validateUserContext } from '../middleware/validateUserContext.js';

 const router = Router();

 router.use(validateUserContext);

 router.post('/createFolder', createFolderHandler);
    router.get('/getFolders', getFoldersHandler);
    router.delete('/:folderId', deleteFolderHandler);

    export default router;