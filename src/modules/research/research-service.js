import {
	ResearchWork,
	ResearchApplication,
	GrantRequest,
} from "./research-model.js";
import { User } from "../auth/user-model.js";
import sequelize from "../../database/connection.js";

/**
 * Aggregates consolidated dashboard data..
 * * @param {string} userId - ID of the current user to filter projects and grants.
 * @returns {Object} Returns categorized research works (projects/publications),
 * grant requests, and a list of researchers.
 */
export const getDashboardData = async (userId) => {
	const allWorks = await ResearchWork.findAll({
		include: [
			{ model: User, as: "owner", attributes: ["id", "name", "avatar"] },
		],
		order: [["createdAt", "DESC"]],
	});

	const researchers = await User.findAll({
		attributes: [
			"id",
			"name",
			"email",
			"avatar",
			"department",
			"specialization",
		],
		limit: 15,
	});

	const grants = await GrantRequest.findAll({
		where: { userId },
		include: [{ model: ResearchWork, attributes: ["title"] }],
	});

	return {
		availableProjects: allWorks.filter(
			(w) => w.type === "Project" && w.ownerId !== userId,
		),
		myProjects: allWorks.filter(
			(w) => w.type === "Project" && w.ownerId === userId,
		),
		availablePublications: allWorks.filter(
			(w) => w.type === "Publication" && w.ownerId !== userId,
		),
		myPublications: allWorks.filter(
			(w) => w.type === "Publication" && w.ownerId === userId,
		),
		grantRequests: grants,
		researchers: researchers,
	};
};

export const createEntry = async (data) => await ResearchWork.create(data);

export const updateEntry = async (id, body) => {
	const work = await ResearchWork.findByPk(id);
	if (!work) throw new Error("Research work not found");
	return await work.update(body);
};

export const toggleStarStatus = async (id) => {
	const work = await ResearchWork.findByPk(id);
	const newStatus = !work.isStarred;
	const newCount = newStatus
		? work.starsCount + 1
		: Math.max(0, work.starsCount - 1);
	return await work.update({ isStarred: newStatus, starsCount: newCount });
};

/**
 * Logic for managing open research roles within the JSONB array.
 * * @param {string} id - Research work ID.
 * @param {string} action - The operation to perform: 'create', 'update', or 'delete'.
 * @param {string} roleId - The specific ID of the role within the array.
 * @param {Object} body - New role data for creation or updates.
 */
export const processRoleChange = async (id, action, roleId, body) => {
	const work = await ResearchWork.findByPk(id);
	let roles = [...(work.openRoles || [])];

	if (action === "create") {
		roles.push({ id: `role-${Date.now()}`, ...body });
	} else if (action === "update") {
		roles = roles.map((r) => (r.id === roleId ? { ...r, ...body } : r));
	} else if (action === "delete") {
		roles = roles.filter((r) => r.id !== roleId);
	}

	return await work.update({ openRoles: roles });
};

/**
 * Logic for timeline events management.
 * * @param {string} id - Research work ID.
 * @param {string} eventId - Unique identifier for the timeline event.
 * @param {string} method - HTTP-style method to determine action (POST, PUT, DELETE).
 * @param {Object} body - Event details (title, date, etc.).
 */
export const processTimelineChange = async (id, eventId, method, body) => {
	const work = await ResearchWork.findByPk(id);
	let timeline = [...(work.timeline || [])];

	if (method === "POST") {
		timeline.push({ id: `time-${Date.now()}`, ...body });
	} else if (method === "PUT") {
		timeline = timeline.map((e) =>
			e.id === eventId ? { ...e, ...body } : e,
		);
	} else if (method === "DELETE") {
		timeline = timeline.filter((e) => e.id !== eventId);
	}

	return await work.update({ timeline });
};

export const applyToResearch = async (researchId, userId, body) => {
	return await ResearchApplication.create({ ...body, researchId, userId });
};

/**
 * Process application status with transactional safety.
 * Handles the logic of adding to members and auto-rejecting others.
 * * @param {string} appId - ID of the research application.
 * @param {string} action - 'accept', 'meeting', or 'reject'.
 * @returns {Promise<Object>} Updated application instance.
 */
export const handleApplicationAction = async (appId, action) => {
	return await sequelize.transaction(async (t) => {
		const app = await ResearchApplication.findByPk(appId, {
			transaction: t,
		});
		if (!app) throw new Error("Application not found");

		const statusMap = {
			accept: "Accepted",
			meeting: "Meeting",
			reject: "Rejected",
		};
		const newStatus = statusMap[action];

		if (newStatus === "Accepted") {
			const work = await ResearchWork.findByPk(app.researchId, {
				transaction: t,
			});
			const user = await User.findByPk(app.userId, { transaction: t });

			const members = [...(work.members || [])];
			if (!members.includes(user.name)) {
				members.push(user.name);
			}

			const openRoles = (work.openRoles || []).filter(
				(r) => r.id !== app.roleId,
			);
			await work.update({ members, openRoles }, { transaction: t });

			await ResearchApplication.update(
				{ status: "Rejected", professorNotes: "Position filled." },
				{
					where: {
						researchId: app.researchId,
						roleId: app.roleId,
						status: "Pending",
					},
					transaction: t,
				},
			);
		}

		return await app.update({ status: newStatus }, { transaction: t });
	});
};

/**
 * Submits a new grant request with a generated ID.
 * * @param {Object} data - Grant details.
 * @returns {Promise<Object>} The created grant request.
 */
export const submitGrant = async (data) => {
	const count = await GrantRequest.count();
	const requestId = `REQ-${new Date().getFullYear()}-${100 + count}`;
	return await GrantRequest.create({ ...data, requestId });
};

/**
 * Updates a grant and archives the previous version for history.
 */
export const updateGrant = async (id, body) => {
	const grant = await GrantRequest.findByPk(id);
	const previousVersion = {
		title: grant.title,
		amount: grant.amount,
		reason: grant.reason,
		supportingDocs: grant.supportingDocs,
		adminComments: grant.adminComments,
	};
	return await grant.update({
		...body,
		status: "Resubmitted",
		previousVersion,
	});
};

export const fetchProfile = async (userId) => {
	return await User.findByPk(userId, {
		include: [{ model: ResearchWork }],
	});
};

export const modifyProfile = async (userId, body) => {
	const user = await User.findByPk(userId);
	return await user.update(body);
};
