const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'xqjvfmwu',
  api_key: '842916197562263',
  api_secret: 'oDOo7NtCobJTmUEuOdeBtKSUlkI',
  secure: true
});

cloudinary.uploader.upload("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", {folder: 'test'})
  .then(res => console.log('Upload success with Root:', res.public_id))
  .catch(err => console.error('Upload error with Root:', err.message));
