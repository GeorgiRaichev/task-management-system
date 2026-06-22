import { z } from "zod";
import { ProjectGroupMemberRole } from "../models/projectGroup.model.js";

export const createProjectGroupSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Group name must be at least 2 characters"),
    projectId: z.string().min(1, "Project id is required"),
    members: z
      .array(
        z.object({
          userId: z.string().min(1, "User id is required"),
          role: z.nativeEnum(ProjectGroupMemberRole).optional(),
        }),
      )
      .optional(),
  }),
});

export const updateProjectGroupSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Group name must be at least 2 characters")
      .optional(),
  }),
});

export const addProjectGroupMemberSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "User id is required"),
    role: z.nativeEnum(ProjectGroupMemberRole).optional(),
  }),
});
