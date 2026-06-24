import { apiSlice } from '../api/apiSlice';
import { setUser } from '../auth/authSlice';
import type {
    ProfileMutationResponse,
    ProfileResponse,
    UpdatePasswordRequest,
    UpdateProfileRequest
} from './types';

export const profileApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getProfile: builder.query<ProfileResponse, void>({
            query: () => '/profile',
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                const { data } = await queryFulfilled;
                dispatch(setUser(data.user));
            },
            providesTags: ['Auth']
        }),
        updateProfile: builder.mutation<ProfileMutationResponse, UpdateProfileRequest>({
            query: (body) => ({
                url: '/profile',
                method: 'PUT',
                body
            }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                const { data } = await queryFulfilled;
                dispatch(setUser(data.user));
            },
            invalidatesTags: ['Auth', 'Users']
        }),
        updatePassword: builder.mutation<ProfileMutationResponse, UpdatePasswordRequest>({
            query: (body) => ({
                url: '/profile/password',
                method: 'PUT',
                body
            }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                const { data } = await queryFulfilled;
                dispatch(setUser(data.user));
            },
            invalidatesTags: ['Auth']
        })
    })
});

export const {
    useGetProfileQuery,
    useUpdateProfileMutation,
    useUpdatePasswordMutation
} = profileApi;