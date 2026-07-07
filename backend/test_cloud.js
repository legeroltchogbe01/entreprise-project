const cloudinary = require('cloudinary').v2;
process.env.CLOUDINARY_URL = '"cloudinary://367258795951277:MECO0xbvfVZ09-FrTRz8GEh6Qpl@xqjvfmwu"';
try {
  cloudinary.config(true);
  console.log('Quoted URL:', cloudinary.config());
} catch(e) {
  console.log('Error parsing:', e.message);
}
