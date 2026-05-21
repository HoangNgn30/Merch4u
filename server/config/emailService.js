// emailService.js
import dotenv from 'dotenv';
dotenv.config();

// Function to send email via EmailJS HTTP API
async function sendEmail(to, subject, text, html) {
  try {
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    if (!serviceId || !templateId || !publicKey || !privateKey) {
      console.error('EmailJS configuration error: Missing environment variables.');
      return { success: false, error: 'Chưa cấu hình đầy đủ biến môi trường EmailJS' };
    }

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          to_email: to,
          subject: subject,
          html_content: html, // Được chèn vào template EmailJS thông qua {{{html_content}}}
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS API error: ${response.status} - ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email via EmailJS:', error);
    return { success: false, error: error.message };
  }
}

export { sendEmail };