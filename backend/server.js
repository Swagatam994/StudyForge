import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRouter from './routes/authRouter.js';

const app = express();
dotenv.config();

const PORT = process.env.PORT || 3000;
const dbPath = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);

mongoose
  .connect(dbPath)
  .then(() => {
    console.log('Connected to mongo');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log('Error ', err);
  });
