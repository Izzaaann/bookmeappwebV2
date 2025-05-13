const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// Configuración del transportador de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().mail.user,
    pass: functions.config().mail.pass
  }
});

// Función para nuevo comentario
exports.onNewReview = functions.firestore
  .document('business/{companyId}/reviews/{reviewId}')
  .onCreate(async (snap, context) => {
    const review = snap.data();
    const companyId = context.params.companyId;

    const companyDoc = await db.collection('business').doc(companyId).get();
    const companyEmail = companyDoc.exists ? companyDoc.data().email : null;

    if (!companyEmail) {
      console.log('No se encontró el email de la empresa');
      return;
    }

    const mailOptions = {
      from: '"BookMeApp" <noreply@bookmeapp.com>',
      to: companyEmail,
      subject: 'Tienes una nueva valoración',
      text: `El usuario ${review.userName} te ha dejado una valoración de ${review.stars} estrellas:\n\n"${review.comment}"`
    };

    await transporter.sendMail(mailOptions);
    console.log('Correo enviado correctamente a la empresa');
  });

// Función para edición de comentario
exports.onReviewUpdated = functions.firestore
  .document('business/{companyId}/reviews/{reviewId}')
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const companyId = context.params.companyId;

    const userId = after.userId;
    const userDoc = await admin.auth().getUser(userId);
    const userEmail = userDoc.email;

    if (!userEmail) {
      console.log('No se encontró el email del usuario');
      return;
    }

    const mailOptions = {
      from: '"BookMeApp" <noreply@bookmeapp.com>',
      to: userEmail,
      subject: 'Tu valoración ha sido respondida',
      text: `La empresa ha respondido a tu reseña:\n\n"${after.response || 'Sin contenido.'}"`
    };

    await transporter.sendMail(mailOptions);
    console.log('Correo de respuesta enviado correctamente al usuario');
  });
