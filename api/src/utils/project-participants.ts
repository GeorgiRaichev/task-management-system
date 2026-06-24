import { ProjectGroupModel } from '../models/projectGroup.model.js';
import { ProjectModel } from '../models/project.model.js';

export const getProjectParticipantIds = async (projectId: string) => {
    const participantIds = new Set<string>();

    const project = await ProjectModel.findById(projectId).select('createdBy');

    if (project?.createdBy) {
        participantIds.add(project.createdBy.toString());
    }

    const groups = await ProjectGroupModel.find({ project: projectId }).select(
        'createdBy members.user'
    );

    groups.forEach((group) => {
        participantIds.add(group.createdBy.toString());

        group.members.forEach((member) => {
            participantIds.add(member.user.toString());
        });
    });

    return Array.from(participantIds);
};

export const getUserProjectIds = async (userId: string) => {
    const projectIds = new Set<string>();

    const groups = await ProjectGroupModel.find({
        $or: [{ createdBy: userId }, { 'members.user': userId }]
    }).select('project');

    groups.forEach((group) => {
        projectIds.add(group.project.toString());
    });

    return Array.from(projectIds);
};