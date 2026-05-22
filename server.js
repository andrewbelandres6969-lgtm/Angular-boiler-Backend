require('rootpath')();
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const errorHandler = require('./_middleware/error-handler');

const app = express();

// Render runs behind a proxy
app.set('trust proxy', 1);

// CORS — specific origin only because credentials/cookies are used
const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow no-origin requests like Postman, curl, server-to-server
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.log('Blocked by CORS:', origin);
        return callback(new Error('CORS policy: origin not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API routes
app.use('/accounts', require('./accounts/accounts.controller'));

// Swagger docs
app.use('/api-docs', require('./_helpers/swagger'));

// Global error handler
app.use(errorHandler);

const port = parseInt(process.env.PORT || '4000', 10);
app.listen(port, () => console.log(`Server listening on port ${port}`));