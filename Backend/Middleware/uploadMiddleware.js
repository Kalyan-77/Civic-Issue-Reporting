const multer = require('multer');
const { storage } = require('../Config/cloudinary');

// Export multer instance
const upload = multer({ storage });

module.exports = upload;
