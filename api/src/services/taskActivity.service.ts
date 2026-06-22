import { TaskActivityAction, TaskActivityModel } from '../models/taskActivity.model.js';

type CreateTaskActivityData = {
    taskId: string;
    projectId: string;
    userId: string;
    action: TaskActivityAction;
    message: string;
    changes?: Record<string, unknown>;
};

export const createTaskActivity = async ({
    taskId,
    projectId,
    userId,
    action,
    message,
    changes = {}
}: CreateTaskActivityData) => {
    return TaskActivityModel.create({
        task: taskId,
        project: projectId,
        user: userId,
        action,
        message,
        changes
    });
};