/**
 * Email Service for CampusBook
 * Currently logs OTP to server console as instructed, ready for full nodemailer SMTP integration.
 */
export const sendOtpEmail = async ({ to, otp, type = 'verification', userName = 'Student' }) => {
  const isVerification = type === 'verification';
  const subject = isVerification
    ? 'CampusBook - Verify Your Student Email'
    : 'CampusBook - Reset Your Password';

  const title = isVerification
    ? 'Verify Your University Student Email'
    : 'Password Reset Request';

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

  // Optional: if nodemailer is installed and credentials exist in environment, nodemailer can be used here.
  return { success: true, otp };
};

export default sendOtpEmail;

