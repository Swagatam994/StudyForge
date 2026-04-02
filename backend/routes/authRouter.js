import { signup, login, googleLogin } from '../controller/authContoller.js';
import express from 'express';

const authRouter = express.Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.post('/googleLogin', googleLogin);

export default authRouter;
