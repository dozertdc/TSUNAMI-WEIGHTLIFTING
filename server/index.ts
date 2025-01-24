import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes';
import exerciseRoutes from './routes/exercises.routes';

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS before other middleware
app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Add logging middleware to debug route hits
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// Mount routes with logging
app.use('/api/exercises', (req, res, next) => {
  console.log('Exercise route hit:', req.method, req.url);
  next();
}, exerciseRoutes);

app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});