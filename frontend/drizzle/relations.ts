import { relations } from "drizzle-orm/relations";
import { clubs, posts, users, projects, projectCollaborators, clubMembers } from "./schema";

export const postsRelations = relations(posts, ({one}) => ({
	club: one(clubs, {
		fields: [posts.clubId],
		references: [clubs.id]
	}),
}));

export const clubsRelations = relations(clubs, ({many}) => ({
	posts: many(posts),
	clubMembers: many(clubMembers),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	user: one(users, {
		fields: [projects.authorId],
		references: [users.id]
	}),
	projectCollaborators: many(projectCollaborators),
}));

export const usersRelations = relations(users, ({many}) => ({
	projects: many(projects),
	projectCollaborators: many(projectCollaborators),
	clubMembers: many(clubMembers),
}));

export const projectCollaboratorsRelations = relations(projectCollaborators, ({one}) => ({
	user: one(users, {
		fields: [projectCollaborators.userId],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [projectCollaborators.projectId],
		references: [projects.id]
	}),
}));

export const clubMembersRelations = relations(clubMembers, ({one}) => ({
	user: one(users, {
		fields: [clubMembers.userId],
		references: [users.id]
	}),
	club: one(clubs, {
		fields: [clubMembers.clubId],
		references: [clubs.id]
	}),
}));