const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'xqjvfmwu',
  api_key: '367258795951277',
  api_secret: 'MECO0xbvfVZ09-FrTRz8GEh6Qpl',
  secure: true
});

cloudinary.uploader.upload("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", {folder: 'test'})
  .then(res => console.log('Upload success:', res.public_id))
  .catch(err => console.error('Upload error:', err.message));
