const express = require('express');
require('express-async-errors');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const docsRoutes = require('./routes/docs');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/docs', docsRoutes);

app.use(errorHandler);

module.exports = app;
