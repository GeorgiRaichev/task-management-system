import { apiSlice } from '../api/apiSlice';
import type {
    CreateNotificationRequest,
    NotificationResponse,
    NotificationsResponse
} from './types';

export const notificationsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query<NotificationsResponse, void>({
            query: () => '/notifications',
            providesTags: ['Notifications']
        }),
        createNotification: builder.mutation<NotificationResponse, CreateNotificationRequest>({
            query: (body) => ({
                url: '/notifications',
                method: 'POST',
                body
            }),
            invalidatesTags: ['Notifications']
        }),
        markNotificationAsRead: builder.mutation<NotificationResponse, string>({
            query: (notificationId) => ({
                url: `/notifications/${notificationId}/read`,
                method: 'PUT'
            }),
            invalidatesTags: ['Notifications']
        }),
        markAllNotificationsAsRead: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/notifications/read-all',
                method: 'PUT'
            }),
            invalidatesTags: ['Notifications']
        }),
        deleteNotification: builder.mutation<{ message: string }, string>({
            query: (notificationId) => ({
                url: `/notifications/${notificationId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Notifications']
        })
    })
});

export const {
    useGetNotificationsQuery,
    useCreateNotificationMutation,
    useMarkNotificationAsReadMutation,
    useMarkAllNotificationsAsReadMutation,
    useDeleteNotificationMutation
} = notificationsApi;