import { pgTable, serial, text, jsonb, timestamp, foreignKey, integer, unique, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const clubs = pgTable("clubs", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	logoUrl: text("logo_url"),
	primaryColor: text("primary_color").default('#121212'),
	accentColor: text("accent_color").default('#FF0000'),
	tags: jsonb().default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const posts = pgTable("posts", {
	id: serial().primaryKey().notNull(),
	clubId: integer("club_id"),
	content: text().notNull(),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubs.id],
			name: "posts_club_id_clubs_id_fk"
		}).onDelete("cascade"),
]);

export const projects = pgTable("projects", {
	id: serial().primaryKey().notNull(),
	authorId: text("author_id"),
	title: text().notNull(),
	description: text().notNull(),
	requirements: jsonb().default([]),
	status: text().default('open'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "projects_author_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	image: text(),
	preferences: jsonb().default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	password: text(),
	adminOfClubId: integer("admin_of_club_id"),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const projectCollaborators = pgTable("project_collaborators", {
	userId: text("user_id").notNull(),
	projectId: integer("project_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "project_collaborators_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_collaborators_project_id_projects_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.projectId], name: "project_collaborators_user_id_project_id_pk"}),
]);

export const clubFollowers = pgTable("club_followers", {
	userId: text("user_id").notNull(),
	clubId: integer("club_id").notNull(),
}, (table) => [
	primaryKey({ columns: [table.userId, table.clubId], name: "club_followers_user_id_club_id_pk"}),
]);

export const clubMembers = pgTable("club_members", {
	userId: text("user_id").notNull(),
	clubId: integer("club_id").notNull(),
	role: text().default('student'),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "club_members_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubs.id],
			name: "club_members_club_id_clubs_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.clubId], name: "club_members_user_id_club_id_pk"}),
]);
