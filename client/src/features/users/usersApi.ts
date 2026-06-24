import { apiSlice } from '../api/apiSlice';
import type {
    CreateUserRequest,
    UpdateUserRequest,
    UserMutationResponse,
    UserResponse,
    UsersResponse
} from './types';

export const usersApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query<UsersResponse, void>({
            query: () => '/users',
            providesTags: ['Users']
        }),
        getUserOptions: builder.query<UsersResponse, void>({
            query: () => '/users/select-options',
            providesTags: ['Users']
        }),
        getUser: builder.query<UserResponse, string>({
            query: (userId) => `/users/${userId}`,
            providesTags: ['Users']
        }),
        createUser: builder.mutation<UserMutationResponse, CreateUserRequest>({
            query: (body) => ({
                url: '/users',
                method: 'POST',
                body
            }),
            invalidatesTags: ['Users']
        }),
        updateUser: builder.mutation<UserMutationResponse, UpdateUserRequest>({
            query: ({ userId, data }) => ({
                url: `/users/${userId}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: ['Users']
        }),
        deleteUser: builder.mutation<{ message: string }, string>({
            query: (userId) => ({
                url: `/users/${userId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Users']
        })
    })
});

export const {
    useGetUsersQuery,
    useGetUserOptionsQuery,
    useGetUserQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation
} = usersApi;