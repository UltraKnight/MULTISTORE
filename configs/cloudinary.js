const cloudinary = require('cloudinary').v2; // methods to connect with cloudinary cloud

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

module.exports = cloudinary; // export the configured cloudinary instance
