import { z } from "zod";
import { ProjectStatus } from "../models/project.model.js";

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Project name must be at least 2 characters"),
    description: z.string().min(5, "Description must be at least 5 characters"),
    deadline: z.coerce.date(),
    status: z.nativeEnum(ProjectStatus).optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Project name must be at least 2 characters")
      .optional(),
    description: z
      .string()
      .min(5, "Description must be at least 5 characters")
      .optional(),
    deadline: z.coerce.date().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
  }),
});