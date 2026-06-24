import { apiSlice } from '../api/apiSlice';
import type {
    CreateTaskCommentRequest,
    CreateTaskRequest,
    DeleteTaskCommentRequest,
    TaskCommentResponse,
    TaskCommentsResponse,
    TaskResponse,
    TasksResponse,
    UpdateTaskCommentRequest,
    UpdateTaskRequest
} from './types';

export const tasksApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getProjectTasks: builder.query<TasksResponse, string>({
            query: (projectId) => `/tasks/project/${projectId}`,
            providesTags: ['Tasks']
        }),
        createTask: builder.mutation<TaskResponse, CreateTaskRequest>({
            query: ({ projectId, ...body }) => ({
                url: `/tasks/project/${projectId}`,
                method: 'POST',
                body
            }),
            invalidatesTags: ['Tasks', 'Notifications']
        }),
        updateTask: builder.mutation<TaskResponse, UpdateTaskRequest>({
            query: ({ taskId, data }) => ({
                url: `/tasks/${taskId}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: ['Tasks', 'Notifications']
        }),
        deleteTask: builder.mutation<{ message: string }, string>({
            query: (taskId) => ({
                url: `/tasks/${taskId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Tasks']
        }),
        getTaskComments: builder.query<TaskCommentsResponse, string>({
            query: (taskId) => `/tasks/${taskId}/comments`,
            providesTags: ['Comments']
        }),
        createTaskComment: builder.mutation<TaskCommentResponse, CreateTaskCommentRequest>({
            query: ({ taskId, content }) => ({
                url: `/tasks/${taskId}/comments`,
                method: 'POST',
                body: {
                    content
                }
            }),
            invalidatesTags: ['Comments', 'Notifications']
        }),
        updateTaskComment: builder.mutation<TaskCommentResponse, UpdateTaskCommentRequest>({
            query: ({ commentId, content }) => ({
                url: `/comments/${commentId}`,
                method: 'PUT',
                body: {
                    content
                }
            }),
            invalidatesTags: ['Comments']
        }),
        deleteTaskComment: builder.mutation<{ message: string }, DeleteTaskCommentRequest>({
            query: ({ commentId }) => ({
                url: `/comments/${commentId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Comments']
        })
    })
});

export const {
    useGetProjectTasksQuery,
    useLazyGetProjectTasksQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useGetTaskCommentsQuery,
    useCreateTaskCommentMutation,
    useUpdateTaskCommentMutation,
    useDeleteTaskCommentMutation
} = tasksApi;