
// functions/index.js

const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

// Gmail hisobingiz ma'lumotlari
// Gmail hisobingiz maʼlumotlarini kodga kiritish o‘rniga Firebase Functions
// konfiguratsiyasidan foydalanamiz. Bu maʼlumotlarni CLI orqali o‘rnatish
// mumkin: `firebase functions:config:set gmail.email="you@example.com" gmail.password="app-password"`
const gmailEmail = functions.config().gmail?.email;
const gmailPassword = functions.config().gmail?.password;

// Simple validation to ensure credentials are provided. Without valid
// credentials the transporter will fail silently and email sending will
// always be rejected.
if (!gmailEmail || !gmailPassword) {
  console.warn(
    'Gmail credentials are not set in Firebase functions config. ' +
      'Run `firebase functions:config:set gmail.email="<your-email>" gmail.password="<your-app-password>` to configure.'
  );
}

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
  // Force TLS for additional security.  Gmail requires TLS
  secure: true,
});

exports.sendVerificationEmail = functions.https.onCall(async (data, context) => {
  const userEmail = data.email;
  const verificationCode = data.code;

  const mailOptions = {
    // Use the configured Gmail address for the FROM field.  If no address
    // has been set via functions.config(), fall back to a generic no-reply
    // address to avoid leaking placeholder credentials.
    from: `"Streaming Network of Dreams" <${gmailEmail || 'no-reply@soundora.com'}>`,
    to: userEmail,
    subject: `Streaming Network of Dreams - Tasdiqlash kodingiz`,
    text: `Streaming Network of Dreams ilovasiga xush kelibsiz! Sizning tasdiqlash kodingiz: ${verificationCode}`,
    html: `<p>Streaming Network of Dreams ilovasiga xush kelibsiz!</p><p>Sizning tasdiqlash kodingiz: <strong>${verificationCode}</strong></p>`,
  };

  try {
    await mailTransport.sendMail(mailOptions);
    console.log(`Verification code sent to: ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error("There was an error while sending the email:", error);
    return { success: false, error: error.message };
  }
});
