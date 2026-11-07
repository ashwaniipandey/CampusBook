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

export const parseSender = (fromStr) => {
  const fallback = { name: 'CampusBook', email: 'no-reply@campusbook.edu' };
  if (!fromStr || typeof fromStr !== 'string') return fallback;

  const match = fromStr.trim().match(/^(?:["']?([^"']+)["']?\s*)?<([^>]+)>$/);
  if (match) {
    return {
      name: (match[1] || 'CampusBook').trim(),
      email: match[2].trim(),
    };
  }
  const plain = fromStr.trim();
  if (plain) {
    return {
      name: 'CampusBook',
      email: plain,
    };
  }
  return fallback;
};

export const checkEmailProviderStatus = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const brevoKey = process.env.BREVO_API_KEY?.trim();
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

  if (brevoKey) {
    const sender = parseSender(EMAIL_FROM);
    console.log(`✉️  [Email Service] Active provider: Brevo HTTP API (Sender: ${sender.name} <${sender.email}>)`);
    return 'brevo';
  }

  if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS) {
    const port = Number(EMAIL_PORT) || 587;
    console.log(`✉️  [Email Service] Active provider: SMTP (${EMAIL_HOST}:${port}, user: ${EMAIL_USER})`);
    return 'smtp';
  }

  const missingSmtp = [];
  if (!EMAIL_HOST) missingSmtp.push('EMAIL_HOST');
  if (!EMAIL_USER) missingSmtp.push('EMAIL_USER');
  if (!EMAIL_PASS) missingSmtp.push('EMAIL_PASS');

  const warnMsg = `⚠️  [Email Service] No email provider configured! Verification and password reset emails will fail in production. Set BREVO_API_KEY (recommended on Render) or SMTP credentials (missing: ${missingSmtp.join(', ')}).`;

  if (isProd) {
    console.warn(warnMsg);
  } else {
    console.log(`ℹ️  [Email Service] Console mock dispatch active (no provider configured; missing BREVO_API_KEY or ${missingSmtp.join(', ')})`);
  }
  return 'none';
};

export const sendOtpEmail = async ({ to, otp, type = 'verification', userName = 'Student' }) => {
  const isVerification = type === 'verification';
  const subject = isVerification
    ? 'CampusBook - Verify Your Student Email'
    : 'CampusBook - Reset Your Password';

  const title = isVerification
    ? 'Verify Your University Student Email'
    : 'Password Reset Request';

  const textContent = `${title}\n\nHello ${userName}, your CampusBook code is ${otp}. It expires in 10 minutes.`;
  const htmlContent = `<p>${escapeHtml(title)}</p><p>Hello ${escapeHtml(userName)},</p><p>Your CampusBook code is <strong>${escapeHtml(otp)}</strong>. It expires in 10 minutes.</p>`;

  const brevoApiKey = process.env.BREVO_API_KEY?.trim();
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;
  const fromAddress = EMAIL_FROM || 'CampusBook <no-reply@campusbook.edu>';

  // 1. Brevo HTTP API Path
  if (brevoApiKey) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const sender = parseSender(fromAddress);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender,
          to: [{ email: to, name: userName }],
          subject,
          htmlContent,
          textContent,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMsg = errorText;
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed.message || parsed.error || errorText;
        } catch {}
        const error = new Error(`Brevo API error (${res.status}): ${errorMsg}`);
        error.code = `BREVO_HTTP_${res.status}`;
        error.response = errorText;
        throw error;
      }
      return { success: true, provider: 'brevo' };
    } catch (err) {
      console.error('Email delivery error (Brevo):', {
        message: err.message,
        code: err.code || (err.name === 'AbortError' ? 'ETIMEDOUT' : undefined),
        response: err.response,
        stack: err.stack,
      });
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // 2. Nodemailer SMTP Path
  if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS) {
    const port = Number(EMAIL_PORT) || 587;
    try {
      const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port,
        secure: port === 465,
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        tls: { minVersion: 'TLSv1.2' },
      });

      await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });
      return { success: true, provider: 'smtp' };
    } catch (err) {
      console.error('Email delivery error (SMTP):', {
        message: err.message,
        code: err.code,
        command: err.command,
        response: err.response,
        stack: err.stack,
      });
      throw err;
    }
  }

  // 3. Fallback: Check production vs development
  if (process.env.NODE_ENV === 'production') {
    const missing = [];
    if (!brevoApiKey) missing.push('BREVO_API_KEY');
    if (!EMAIL_HOST) missing.push('EMAIL_HOST');
    if (!EMAIL_USER) missing.push('EMAIL_USER');
    if (!EMAIL_PASS) missing.push('EMAIL_PASS');
    const err = new AppError('Email delivery is not configured. Contact support.', 503, 'EMAIL_NOT_CONFIGURED');
    console.error('Email delivery error (Not Configured):', {
      message: err.message,
      missingVariables: missing,
    });
    throw err;
  }

  // Development console dispatch
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
  console.log('   Note     : Console mock dispatch active (no provider configured)');
  console.log('='.repeat(64) + '\n');

  return { success: true, provider: 'console' };
};

export default sendOtpEmail;
