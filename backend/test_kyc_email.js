require('dotenv').config();
const { sendKycApprovedEmail } = require('./src/utils/emailService');

const recipients = 'legerolt@gmail.com, charleskuassi11@gmail.com';

console.log('📧 Expéditeur  :', process.env.SMTP_FROM);
console.log('📧 Destinataires :', recipients);
console.log('🚀 Envoi email KYC APPROVED...\n');

sendKycApprovedEmail({
  to: recipients,
  denominationSociale: 'GALASSY MEUBLE DECOR SARL'
})
  .then((info) => {
    console.log('✅ Email envoyé avec succès !');
    console.log('   MessageId :', info.messageId);
    console.log('   À :', recipients);
  })
  .catch((err) => {
    console.error('❌ Erreur :', err.message);
  });
