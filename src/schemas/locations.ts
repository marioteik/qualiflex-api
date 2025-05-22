import { z } from "zod";

const insertLocationSchema = z.object({
  route: z.string().min(1, "Route is required and cannot be empty"),
  subpremise: z.string().optional(),
  streetNumber: z.string().optional(),
  sublocality: z.string().min(1, "Sublocality is required and cannot be empty"),
  locality: z.string().min(1, "Locality is required and cannot be empty"),
  administrativeAreaLevel1: z
    .string()
    .min(1, "Administrative area level 1 is required and cannot be empty"),
  lat: z.string().or(z.number().transform(String)).optional(),
  lng: z.string().or(z.number().transform(String)).optional(),
  administrativeAreaLevel2: z.string().nullable().optional(),
  country: z.string().min(1, "Country is required and cannot be empty"),
  formattedAddress: z
    .string()
    .min(1, "Formatted address is required and cannot be empty"),
  postalCode: z.string().min(1, "Postal code is required and cannot be empty"),
});

const selectLocationSchema = insertLocationSchema.merge(
  z.object({
    id: z.string().uuid(),
  }),
);

type InsertLocation = z.infer<typeof insertLocationSchema>;
type SelectLocation = z.infer<typeof selectLocationSchema>;

export {
  insertLocationSchema,
  selectLocationSchema,
  type InsertLocation,
  type SelectLocation,
};
