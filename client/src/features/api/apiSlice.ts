import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';

const baseUrl = import.meta.env.VITE_API_URL;

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl,
        credentials: 'include',
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.accessToken;

            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }

            return headers;
        }
    }),
    tagTypes: [
        'Auth',
        'Users',
        'Projects',
        'Groups',
        'Tasks',
        'Activities',
        'Notifications',
        'Attachments',
        'Comments'
    ],
    endpoints: () => ({})
});