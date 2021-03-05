require('dotenv').config();
const mongoose = require('mongoose');

mongoose
  //.connect('mongodb://localhost/wine-cellar', {
  .connect(process.env.MONGODB_URI, {
  useNewUrlParser: true, 
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
  })
  .catch(err => {
    console.error('Error connecting to mongo', err);
  });