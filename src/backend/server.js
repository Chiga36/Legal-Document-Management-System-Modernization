// src/backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import API routes
const userRouter = require('./api/users');
const authRouter = require('./api/auth');
const documentRouter = require('./api/documents');

// Import middleware
const { logRequest, logger } = require('./middleware/logging');

// Create Express application
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
.then(() => {
  logger.info('Connected to MongoDB');
})
.catch((error) => {
  logger.error('Error connecting to MongoDB', { error: error.message });
  process.exit(1);
});

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

// Parsing and compression middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging middleware
app.use(morgan('combined'));
app.use(logRequest);

// API routes
app.use('/api', userRouter);
app.use('/api', authRouter);
app.use('/api', documentRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'OK' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).send({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send({ error: 'Not found' });
});

// Start server
app.listen(port, () => {
  logger.info(`Server started on port ${port}`);
});

module.exports = app; // For testing purposes