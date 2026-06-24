import { apiSlice } from '../api/apiSlice';
import type {
    CreateProjectRequest,
    ProjectMutationResponse,
    ProjectResponse,
    ProjectsResponse,
    UpdateProjectRequest
} from './types';

export const projectsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getProjects: builder.query<ProjectsResponse, void>({
            query: () => '/projects',
            providesTags: ['Projects']
        }),
        getProject: builder.query<ProjectResponse, string>({
            query: (projectId) => `/projects/${projectId}`,
            providesTags: ['Projects']
        }),
        createProject: builder.mutation<ProjectMutationResponse, CreateProjectRequest>({
            query: (body) => ({
                url: '/projects',
                method: 'POST',
                body
            }),
            invalidatesTags: ['Projects']
        }),
        updateProject: builder.mutation<ProjectMutationResponse, UpdateProjectRequest>({
            query: ({ projectId, data }) => ({
                url: `/projects/${projectId}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: ['Projects']
        }),
        deleteProject: builder.mutation<{ message: string }, string>({
            query: (projectId) => ({
                url: `/projects/${projectId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Projects']
        })
    })
});

export const {
    useGetProjectsQuery,
    useGetProjectQuery,
    useCreateProjectMutation,
    useUpdateProjectMutation,
    useDeleteProjectMutation
} = projectsApi;