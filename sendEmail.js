const nodemailer = require("nodemailer");
require('dotenv').config();
const sendEmail = async (to, subject, options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    
    ...(options.text && { text: options.text }),
    ...(options.html && { html: options.html }),
  };

  await transporter.sendMail(mailOptions);

  console.log(`Email sent to ${to}`);
};

module.exports = sendEmail;
