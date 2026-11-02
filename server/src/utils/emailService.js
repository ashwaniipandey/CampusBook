import nodemailer from 'nodemailer';
import { AppError } from '../middlewares/errorHandler.js';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);

export const sendOtpEmail = async ({ to, otp, type = 'verification', userName = 'Student' }) => {
  const isVerification = type === 'verification';
  const subject = isVerification
    ? 'CampusBook - Verify Your Student Email'
    : 'CampusBook - Reset Your Password';

  const title = isVerification
    ? 'Verify Your University Student Email'
    : 'Password Reset Request';

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;
  const smtpValues = [EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM];
  const hasSmtpSettings = smtpValues.some(Boolean);
  if (hasSmtpSettings && smtpValues.some((value) => !value)) {
    throw new AppError('SMTP email settings are incomplete. Configure EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM.', 503);
  }

  if (hasSmtpSettings) {
    const port = Number(EMAIL_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new AppError('EMAIL_PORT must be a valid TCP port.', 503);
    }

    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port,
      secure: port === 465,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      tls: { minVersion: 'TLSv1.2' },
    });

    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text: `${title}\n\nHello ${userName}, your CampusBook code is ${otp}. It expires in 10 minutes.`,
      html: `<p>${escapeHtml(title)}</p><p>Hello ${escapeHtml(userName)},</p><p>Your CampusBook code is <strong>${escapeHtml(otp)}</strong>. It expires in 10 minutes.</p>`,
    });
  } else if (process.env.NODE_ENV === 'production') {
    throw new AppError('Email delivery is not configured. Contact support.', 503);
  } else {
    console.log('\n' + '='.repeat(64));
    console.log('   CAMPUSBOOK EMAIL SERVICE (CONSOLE DISPATCH)');
    console.log('='.repeat(64));
    console.log(`   To       : ${to}`);
    console.log(`   User     : ${userName}`);
    console.log(`   Subject  : ${subject}`);
    console.log(`   Purpose  : ${title}`);
    console.log('   ------------------------------------------------------------');
    console.log(`   >>> OTP VERIFICATION CODE: [ ${otp} ] <<<`);
    console.log('   ------------------------------------------------------------');
    console.log('   Valid for: 10 minutes');
    console.log('   Note     : Console mock dispatch active (nodemailer ready)');
    console.log('='.repeat(64) + '\n');
  }

  return { success: true };
};

export default sendOtpEmail;
