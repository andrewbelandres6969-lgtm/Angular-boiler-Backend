require('rootpath')();
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');


const errorHandler = require('./_middleware/error-handler');
const db = require('./_helpers/db');

const app = express();

// Render runs behind a proxy; req.ip relies on this being set.
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS — must be a specific origin (no '*') because we send credentials.
// Support multiple allowed origins (comma-separated in CORS_ORIGIN)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200,http://localhost:3000,https://angular-21-boilerplate-frontend-two.vercel.app')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy: origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Ensure preflight requests are handled
app.options('*', cors(corsOptions));

// API routes
app.use('/accounts', require('./accounts/accounts.controller'));

// Swagger docs
app.use('/api-docs', require('./_helpers/swagger'));

// global error handler
app.use(errorHandler);

const port = parseInt(process.env.PORT || '4000', 10);

db.initialized
    .then(() => {
        app.listen(port, () => console.log(`Server listening on port ${port}`));
    })
    .catch((error) => {
        console.error('Database initialization failed:', error.message);
        process.exit(1);
    });