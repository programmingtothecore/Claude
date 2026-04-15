const { z } = require('zod');

const GENDER = z.enum(['male', 'female', 'nonbinary', 'other']);
const SEEKING = z.enum(['male', 'female', 'nonbinary', 'any']);

const signupSchema = z.object({
  email: z.string().email().max(200).transform((s) => s.trim().toLowerCase()),
  password: z.string().min(8).max(200),
  display_name: z.string().min(1).max(60).transform((s) => s.trim()),
  age: z.coerce.number().int().min(18).max(120),
  gender: GENDER,
  seeking_gender: SEEKING,
  location: z.string().max(100).optional().default(''),
});

const loginSchema = z.object({
  email: z.string().email().max(200).transform((s) => s.trim().toLowerCase()),
  password: z.string().min(1).max(200),
});

const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(60).optional(),
  age: z.coerce.number().int().min(18).max(120).optional(),
  gender: GENDER.optional(),
  seeking_gender: SEEKING.optional(),
  location: z.string().max(100).optional(),
  who_i_am: z.string().max(2000).optional(),
  who_i_want_to_be: z.string().max(2000).optional(),
  what_im_looking_for: z.string().max(2000).optional(),
  seeking_age_min: z.coerce.number().int().min(18).max(120).optional(),
  seeking_age_max: z.coerce.number().int().min(18).max(120).optional(),
}).refine(
  (d) => d.seeking_age_min == null || d.seeking_age_max == null || d.seeking_age_min <= d.seeking_age_max,
  { message: 'seeking_age_min must be <= seeking_age_max' }
);

const connectSchema = z.object({
  to_user_id: z.coerce.number().int().positive(),
});

const messageSchema = z.object({
  to_user_id: z.coerce.number().int().positive(),
  body: z.string().min(1).max(2000),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(200),
});

const forgotRequestSchema = z.object({
  email: z.string().email().max(200).transform((s) => s.trim().toLowerCase()),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10).max(200),
  new_password: z.string().min(8).max(200),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

const blockSchema = z.object({
  user_id: z.coerce.number().int().positive(),
});

const reportSchema = z.object({
  user_id: z.coerce.number().int().positive(),
  reason: z.enum(['inappropriate_photo', 'harassment', 'spam', 'underage', 'fake', 'other']),
  details: z.string().max(1000).optional().default(''),
});

const photoOrderSchema = z.object({
  photo_ids: z.array(z.coerce.number().int().positive()).min(1).max(6),
});

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const err = new Error('invalid request: ' + result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    err.status = 400;
    err.expose = true;
    throw err;
  }
  return result.data;
}

module.exports = {
  parse,
  signupSchema,
  loginSchema,
  updateProfileSchema,
  connectSchema,
  messageSchema,
  changePasswordSchema,
  forgotRequestSchema,
  resetPasswordSchema,
  deleteAccountSchema,
  blockSchema,
  reportSchema,
  photoOrderSchema,
};
