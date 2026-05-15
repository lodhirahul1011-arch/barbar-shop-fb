const nodemailer = require("nodemailer");

const {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_USER,
  MAIL_PASS,
  MAIL_FROM,
} = process.env;

const transporter = nodemailer.createTransport({
  host: MAIL_HOST || "smtp.gmail.com",
  port: Number(MAIL_PORT || 587),
  secure: String(MAIL_SECURE || "false") === "true", // true for 465
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

async function sendMail(to, subject, html) {
  if (!MAIL_USER || !MAIL_PASS) {
    throw new Error("Mail credentials missing: set MAIL_USER and MAIL_PASS in .env");
  }
  return transporter.sendMail({
    from: MAIL_FROM || MAIL_USER,
    to,
    subject,
    html,
  });
}

module.exports = { sendMail };
