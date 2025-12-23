import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/auth.routes.js';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());


app.get("/", (_, res)=>{
    res.json({message: "API is working"});
})

app.use('/api/auth', router);

export default app;