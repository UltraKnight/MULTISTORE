// require('dotenv').config();
const { MONGODB_URI } = process.env;
const cookieParser = require('cookie-parser');
const express = require('express');
const mongoose = require('mongoose');
const logger = require('morgan');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

//Include passport configuration
require('./configs/passport');

mongoose
  .connect(MONGODB_URI)
  .then((x) => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
  })
  .catch((err) => {
    console.error('Error connecting to mongo', err);
  });

const app = express();
const isProduction = process.env.NODE_ENV === 'production' || process.env.ENV === 'production';

// enable file upload
const fileUpload = require('express-fileupload');
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
  }),
);

app.set('trust proxy', 1);

// Middleware Setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: false,
    cookie: {
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction, // false = not using https
      httpOnly: true, //site on http only - cookie not available for JS
      maxAge: 60000000, //cookie time to live
    },
    rolling: true, //session gets refreshed
  }),
);

//Initializes passport
app.use(passport.initialize());
//Initializes passport session
app.use(passport.session());

// default value for title local
app.locals.title = 'Multistore';

//Allowing our frontend to get
//resources from our backend (API)
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      const allowedOrigins = [process.env.CLIENT_HOSTNAME, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      const normalizedOrigins = allowedOrigins.filter(Boolean);

      if (!origin || normalizedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  }),
);

app.set('view engine', 'ejs');

const index = require('./routes/index');
app.use('/', index);

const authRoutes = require('./routes/auth-routes');
app.use('/api', authRoutes);

const profile = require('./routes/profile');
app.use('/api', profile);

const category = require('./routes/category');
app.use('/api', category);

const product = require('./routes/product');
app.use('/api', product);

const order = require('./routes/order');
app.use('/api', order);

const rate = require('./routes/rate');
app.use('/api', rate);

const aiRoutes = require('./routes/ai-routes');
app.use('/api', aiRoutes);

module.exports = app;
