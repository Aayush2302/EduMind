import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/auth.routes.js';
import folderRoutes from './routes/folder.routes.js';
import chatRoutes from './routes/chat.routes.js';
import messageRoutes from "./routes/message.routes.js";
import { env } from './config/env.js';

const app = express();

app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());


app.get("/", (_, res)=>{
    res.json({message: "API is working"});
})

app.use('/api/auth', router);
app.use('/api/folders', folderRoutes);
app.use('/api/', chatRoutes);
app.use('/api/', messageRoutes);

export default app;