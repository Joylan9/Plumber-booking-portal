const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const port = Number(process.env.SMTP_PORT || 587);

  // Create a transporter using SMTP configurations
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Construct standard message format
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.html, // Using HTML format for a premium experience
  };

  // Dispatch the email
  const info = await transporter.sendMail(message);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Message sent: %s`, info.messageId);
  }
};

module.exports = sendEmail;
