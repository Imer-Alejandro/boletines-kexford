const { z } = require('zod');

const emailSchema = z.string().trim().email().max(320);

const CLOUDINARY_PATTERN = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//;

const campaignSchema = z.object({
  name: z.string().trim().min(3),
  title: z.string().trim().min(3),
  content: z.string().trim().optional(),
  subject: z.string().trim().min(3),
  image_url: z.string().url().refine(
    (val) => CLOUDINARY_PATTERN.test(val),
    'image_url debe ser una URL válida de Cloudinary (https://res.cloudinary.com/.../image/upload/...)'
  ),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  daily_limit: z.number().int().positive().default(50),
  hourly_limit: z.number().int().positive().default(7),
  min_interval_seconds: z.number().int().positive().default(30),
  max_interval_seconds: z.number().int().positive().default(90),
  max_attempts: z.number().int().positive().default(3),
});

module.exports = { emailSchema, campaignSchema, CLOUDINARY_PATTERN };
