import { StudentAttendance, StudentTask } from "./attendance-model.js";
import { Op } from "sequelize";

export const getStudentAttendance = async (studentId) => {
  const attendance = await StudentAttendance.findAll({ where: { student_id: studentId } });
  return { attendance };
};
export const getQR = async (studentId) => {
  return { qr: `QR-${studentId}-${Date.now()}` };
};
export const getTimetable = async (studentId) => {
  return { timetable: [] };
};
export const getTasks = async (studentId, date) => {
  const where = { student_id: studentId };
  if (date) where.due_date = date;
  const tasks = await StudentTask.findAll({ where });
  return { tasks };
};
export const createTask = async (studentId, data) => {
  const task = await StudentTask.create({ student_id: studentId, ...data });
  return { task };
};
export const toggleTask = async (taskId, studentId) => {
  const task = await StudentTask.findOne({ where: { id: taskId, student_id: studentId } });
  if (!task) { const err = new Error("Task not found"); err.statusCode = 404; throw err; }
  await task.update({ is_completed: !task.is_completed });
  return { task };
};
export const deleteTask = async (taskId, studentId) => {
  const task = await StudentTask.findOne({ where: { id: taskId, student_id: studentId } });
  if (!task) { const err = new Error("Task not found"); err.statusCode = 404; throw err; }
  await task.destroy();
  return { message: "Task deleted" };
};
export const getSessions = async (studentId) => {
  return { sessions: [] };
};