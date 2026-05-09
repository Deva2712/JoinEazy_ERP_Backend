import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST_NR,
  port: process.env.SMTP_PORT_NR || 587,
  secure: process.env.SMTP_SECURE_NR === "true",
  auth: {
    user: process.env.SMTP_USERNAME_NR,
    pass: process.env.SMTP_PASSWORD_NR,
  },
});

export const sendMail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to,
    subject,
    html,
  });
};

export default transporter;
