import { apiSlice } from '../api/apiSlice';
import type {
    AddMemberRequest,
    CreateGroupRequest,
    GroupResponse,
    GroupsResponse,
    RemoveMemberRequest,
    UpdateGroupRequest
} from './types';

export const groupsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getGroups: builder.query<GroupsResponse, void>({
            query: () => '/groups',
            providesTags: ['Groups']
        }),
        createGroup: builder.mutation<GroupResponse, CreateGroupRequest>({
            query: (body) => ({
                url: '/groups',
                method: 'POST',
                body
            }),
            invalidatesTags: ['Groups', 'Projects', 'Notifications']
        }),
        updateGroup: builder.mutation<GroupResponse, UpdateGroupRequest>({
            query: ({ groupId, data }) => ({
                url: `/groups/${groupId}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: ['Groups', 'Projects']
        }),
        deleteGroup: builder.mutation<{ message: string }, string>({
            query: (groupId) => ({
                url: `/groups/${groupId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Groups', 'Projects', 'Notifications']
        }),
        addMember: builder.mutation<GroupResponse, AddMemberRequest>({
            query: ({ groupId, userId, role }) => ({
                url: `/groups/${groupId}/members`,
                method: 'POST',
                body: {
                    userId,
                    role
                }
            }),
            invalidatesTags: ['Groups', 'Projects', 'Notifications']
        }),
        removeMember: builder.mutation<GroupResponse, RemoveMemberRequest>({
            query: ({ groupId, userId }) => ({
                url: `/groups/${groupId}/members/${userId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Groups', 'Projects', 'Notifications']
        })
    })
});

export const {
    useGetGroupsQuery,
    useCreateGroupMutation,
    useUpdateGroupMutation,
    useDeleteGroupMutation,
    useAddMemberMutation,
    useRemoveMemberMutation
} = groupsApi;