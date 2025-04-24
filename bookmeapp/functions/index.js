const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// Configura tus credenciales de correo en variables de entorno de Firebase
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().mail.user,
    pass: functions.config().mail.pass
  }
});

exports.onReservation = functions.firestore
  .document('users/{userId}/reservations/{resId}')
  .onCreate(async (snap, context) => {
    const res = snap.data();
    const userId = context.params.userId;
    const companyId = res.companyId;

    // Cargar emails
    const userRec = await admin.auth().getUser(userId);
    const compDoc = await db.collection('users').doc(companyId).get();
    const companyEmail = compDoc.data().email; // guarda email al registrar empresa

    const mailOptionsUser = {
      from: '"BookMeApp" <noreply@bookmeapp.com>',
      to: userRec.email,
      subject: 'Tu reserva está confirmada',
      text: `Has reservado ${res.serviceName} el ${res.slot.date} de ${res.slot.from} a ${res.slot.to}.`
    };
    const mailOptionsCompany = {
      from: '"BookMeApp" <noreply@bookmeapp.com>',
      to: companyEmail,
      subject: 'Nueva reserva recibida',
      text: `Se ha reservado ${res.serviceName} el ${res.slot.date} de ${res.slot.from} a ${res.slot.to}.`
    };

    await transporter.sendMail(mailOptionsUser);
    await transporter.sendMail(mailOptionsCompany);
  });
