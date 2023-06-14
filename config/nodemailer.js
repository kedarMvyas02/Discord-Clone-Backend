const nodemailer = require("nodemailer");
const AppError = require("../ErrorHandlers/AppError");

const sendEmail = async (options) => {
  // validation of who is sending and authorization to send email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) defining whom to send and all other options (header, message, etc.)
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };
  // 3) now actually send the email
  await transporter.sendMail(mailOptions, (error, info, next) => {
    if (error) {
      return next(new AppError(error, 500));
    } else {
      next();
    }
  });
};

module.exports = sendEmail;
