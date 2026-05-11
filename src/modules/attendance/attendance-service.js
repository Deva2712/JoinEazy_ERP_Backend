import { Attendance, ProfessorLog } from "./attendance-model.js";

// Fetches all attendance records for a cohort, sorted by date.
export const getCohortAttendance = async (cohortId) => {
	return await Attendance.findAll({
		where: { cohortId },
		order: [["date", "DESC"]],
	});
};

// Handles creation or update of attendance records.
export const saveAttendance = async (cohortId, facultyId, data) => {
	const { date, studentIds, status, section } = data;
	const isFinal = status === "final";

	const [record, created] = await Attendance.findOrCreate({
		where: {
			cohortId,
			date,
			section: section || "All",
		},
		defaults: {
			recordedBy: facultyId,
			presentStudentIds: studentIds,
			isFinal,
		},
	});

	if (!created) {
		// Prevent updates to records already marked as final
		if (record.isFinal) {
			const err = new Error(
				"This attendance session has been finalized and cannot be edited.",
			);
			err.statusCode = 403;
			throw err;
		}

		record.presentStudentIds = studentIds;
		record.isFinal = isFinal;
		record.lastUpdated = new Date();
		await record.save();
	}

	return record;
};

// Reverts a finalized record to a draft state.
export const reopenSession = async (cohortId, { date, section }) => {
	const record = await Attendance.findOne({
		where: {
			cohortId,
			date,
			section: section || "All",
		},
	});

	if (!record) {
		const err = new Error(
			"Attendance record not found for the specified date.",
		);
		err.statusCode = 404;
		throw err;
	}

	record.isFinal = false;
	return await record.save();
};

// Retrieves clock-in/out and activity history for the professor.
export const getProfessorHistory = async (userId) => {
	return await ProfessorLog.findAll({
		where: { userId, type: "WorkLog" },
		order: [["date", "DESC"]],
	});
};

// Records academic events (conferences/seminars) as a specific log type.
export const recordExperience = async (userId, experienceData) => {
	return await ProfessorLog.create({
		userId,
		date: new Date().toISOString().split("T")[0],
		type: "Experience",
		details: experienceData,
	});
};
