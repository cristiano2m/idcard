const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const config = require('../infrastructure/config/config');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(require('./middleware/corsConfig'));
app.use(require('./middleware/requestLogger'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use(express.static(path.join(__dirname, '../../../frontend')));

app.get('/health', (req, res) => res.json({ status: 'ok', env: config.env, driver: config.dbDriver }));

app.use('/api', require('./routes/index'));
app.use('/api/docs', require('./routes/docs.routes'));

app.use(require('./middleware/notFoundHandler'));
app.use(require('./middleware/errorHandler'));

module.exports = app;
