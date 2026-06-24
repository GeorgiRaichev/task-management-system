import { apiSlice } from '../api/apiSlice';
import { clearCredentials, setAuthChecked, setCredentials, setUser } from './authSlice';
import type { AuthResponse, LoginRequest, MeResponse, RegisterRequest } from './types';

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (body) => ({
                url: '/auth/login',
                method: 'POST',
                body
            }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                const { data } = await queryFulfilled;

                dispatch(apiSlice.util.resetApiState());
                dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
            },
            invalidatesTags: ['Auth']
        }),
        register: builder.mutation<AuthResponse, RegisterRequest>({
            query: (body) => ({
                url: '/auth/register',
                method: 'POST',
                body
            }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                const { data } = await queryFulfilled;

                dispatch(apiSlice.util.resetApiState());
                dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
            },
            invalidatesTags: ['Auth']
        }),
        logout: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST'
            }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                } finally {
                    dispatch(apiSlice.util.resetApiState());
                    dispatch(clearCredentials());
                }
            },
            invalidatesTags: ['Auth']
        }),
        getMe: builder.query<MeResponse, void>({
            query: () => '/auth/me',
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setUser(data.user));
                } catch {
                    dispatch(setAuthChecked());
                }
            },
            providesTags: ['Auth']
        })
    })
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation, useGetMeQuery } = authApi;