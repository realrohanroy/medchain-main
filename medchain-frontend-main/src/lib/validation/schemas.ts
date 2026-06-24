import { z } from "zod";

export const loginSchema = z.object({
    walletAddress: z.string().min(42, "Invalid wallet address").max(42),
});

export const uploadRecordSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(10, "Description is required"),
    recordType: z.enum(["Lab Result", "Prescription", "Scan", "General"]),
    file: z.any().refine((file) => file !== null, "File is required"),
});

export const grantAccessSchema = z.object({
    doctorAddress: z.string().min(42, "Invalid doctor wallet address").max(42),
    durationDays: z.number().int().min(1, "Minimum duration is 1 day").max(365, "Maximum is 365 days"),
    recordId: z.string().optional(), // If empty, grants general access
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type UploadRecordFormData = z.infer<typeof uploadRecordSchema>;
export type GrantAccessFormData = z.infer<typeof grantAccessSchema>;
