require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

transporter.sendMail({
  from: `"GMD Creance" <${process.env.SMTP_FROM}>`,
  to: process.env.SMTP_FROM,
  subject: 'Test Brevo - GMD Creance',
  html: '<h2 style="color:#166534">Test reussi !</h2><p>Brevo SMTP fonctionne correctement sur votre projet GMD Creance.</p>'
}, (err, info) => {
  if (err) console.log('ERREUR:', err.message);
  else console.log('Email envoye avec succes ! MessageId:', info.messageId);
});
