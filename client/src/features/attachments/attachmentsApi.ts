import { apiSlice } from '../api/apiSlice';
import type {
    TaskAttachmentResponse,
    TaskAttachmentsResponse,
    UploadTaskAttachmentRequest
} from './types';

export const attachmentsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getTaskAttachments: builder.query<TaskAttachmentsResponse, string>({
            query: (taskId) => `/tasks/${taskId}/attachments`,
            providesTags: ['Attachments']
        }),

        uploadTaskAttachment: builder.mutation<TaskAttachmentResponse, UploadTaskAttachmentRequest>({
            query: ({ taskId, file }) => {
                const formData = new FormData();

                formData.append('file', file);

                return {
                    url: `/tasks/${taskId}/attachments`,
                    method: 'POST',
                    body: formData
                };
            },
            invalidatesTags: ['Attachments', 'Notifications']
        }),

        deleteTaskAttachment: builder.mutation<{ message: string }, string>({
            query: (attachmentId) => ({
                url: `/attachments/${attachmentId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Attachments']
        })
    })
});

export const {
    useGetTaskAttachmentsQuery,
    useUploadTaskAttachmentMutation,
    useDeleteTaskAttachmentMutation
} = attachmentsApi;