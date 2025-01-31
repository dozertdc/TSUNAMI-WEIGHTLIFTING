import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes';
import nutritionRoutes from './routes/nutrition.routes';
import exerciseRoutes from './routes/exercises.routes';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/exercises', exerciseRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    details: err.message 
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});