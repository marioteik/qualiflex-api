import { z } from "zod";
import { selectProfileSchema } from "./profile";

const matchPhone = /^\(?\d{2}\)?\s?(?:9\d{4}|\d{4})-?\d{4}$/;

export const authZodSchema = z.object({
  id: z.optional(z.string().uuid()),
  email: z
    .string()
    .email()
    .or(z.string().transform(() => ""))
    .optional(),
  phone: z
    .string()
    .regex(matchPhone)
    .or(z.string().transform(() => ""))
    .optional(),
  password: z.optional(z.string().min(1)),
  code: z.optional(z.string().min(1)),
  type: z.enum(["sms", "whatsapp"]).optional(),
});

export const baseUser = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  email_confirm: z.boolean().optional(),
  phone_confirm: z.boolean().optional(),
  ban_duration: z.union([z.string(), z.literal("none")]).optional(),
  role: z.string().optional(),
  password_hash: z.string().optional(),
  seamstress: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
});

const userSchemaCheck = (v: z.infer<typeof baseUser>, ctx: z.RefinementCtx) => {
  const { email, phone, role, seamstress } = v;

  if (!email && !phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Email OU Celular é obrigatório",
      path: ["email"],
    });
  }

  if (email !== undefined && email.trim() !== "") {
    const emailSchema = z.string().email();
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email mal formatado",
        path: ["email"],
      });
    }
  }

  if (phone !== undefined && phone.trim() !== "") {
    if (!matchPhone.test(phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Celular mal formatado",
        path: ["phone"],
      });
    }
  }

  if ((role === "3" || role === "4") && !phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Celular é obrigatório para costureiras e motoristas",
      path: ["phone"],
    });
  }

  if (role === "3") {
    if (!seamstress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Selecionar uma costureira é obrigatório se o papel é "Costureira"',
        path: ["seamstress"],
      });
    } else {
      const seamstressIdSchema = z.string().uuid();
      const seamstressResult = seamstressIdSchema.safeParse(seamstress);

      if (!seamstressResult.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Identificação da costureira mal formatada",
          path: ["seamstress"],
        });
      }
    }
  }
};

export const insertUser = baseUser.superRefine(userSchemaCheck);

export const updateUser = baseUser
  .extend({
    id: z.string(),
  })
  .superRefine(userSchemaCheck);

export const userZodSchema = z.object({
  id: z.string(),
  aud: z.string(),
  confirmationSentAt: z.string().optional(),
  recoverySentAt: z.string().optional(),
  emailChangeSentAt: z.string().optional(),
  newEmail: z.string().optional(),
  newPhone: z.string().optional(),
  invitedAt: z.string().optional(),
  actionLink: z.string().optional(),
  name: z.string().optional(),
  seamstress: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(matchPhone).optional(),
  profile: selectProfileSchema,
  createdAt: z.string(),
  confirmedAt: z.string().optional(),
  emailConfirmedAt: z.string().optional(),
  bannedUntil: z.string().optional(),
  status: z.string().optional(),
  phoneConfirmedAt: z.string().optional(),
  lastSignInAt: z.string().optional(),
  role: z.object({
    id: z.number(),
    role: z.string(),
  }),
  roleId: z.number(),
  roleName: z.string(),
  updatedAt: z.string().optional(),
  isAnonymous: z.boolean().optional(),
});

export const usersSchema = userZodSchema.array();

export const refreshSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required."),
});

export type Auth = z.infer<typeof authZodSchema>;
export type CreateUser = z.infer<typeof insertUser>;
export type UpdateUser = z.infer<typeof updateUser>;
export type BaseUser = z.infer<typeof baseUser>;
export type User = z.infer<typeof userZodSchema>;
export type Users = z.infer<typeof usersSchema>;
