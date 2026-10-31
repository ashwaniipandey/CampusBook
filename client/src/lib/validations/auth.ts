import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(60, 'Name cannot exceed 60 characters'),
    universityId: z
      .string()
      .min(1, 'Please select your university campus'),
    email: z
      .string()
      .min(1, 'University email is required')
      .email('Please enter a valid email address'),
    department: z
      .string()
      .optional(),
    yearOfStudy: z
      .string()
      .optional(),
    studentId: z
      .string()
      .optional(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain exactly 6 digits'),
});

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    otp: z
      .string()
      .length(6, 'Verification code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'Code must contain numbers only'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
