import express from 'express';
import { googleLogin, verifyToken, signin, signup,logout } from '../modules/auth/authController.js';
import { validateUserContext } from '../middleware/validateUserContext.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin); 
router.post('/google-signin', googleLogin);
router.post('/verify-token', verifyToken);
router.post('/signout' ,logout);

router.get('/protected', validateUserContext, (req,res) => {
    res.json({ message: 'Protected route accessed successfully', user: req.userContext });
});

export default router;