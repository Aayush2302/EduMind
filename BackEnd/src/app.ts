import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());


app.get("/", (_, res)=>{
    res.json({message: "API is working"});
})

export default app;