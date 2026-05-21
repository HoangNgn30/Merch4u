// emailService.js
import nodemailer from 'nodemailer';

// Configure the SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // e.g., 'smtp.gmail.com' for Gmail
  port: 587, // use 587 instead of 465 to avoid timeouts/blocks
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL, // your SMTP username
    pass: process.env.EMAIL_PASS,    // your SMTP password
  },
});

// Function to send email
async function sendEmail(to, subject, text, html) {
  try {
   
    const info = await transporter.sendMail({
      from: process.env.EMAIL, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

export {sendEmail};