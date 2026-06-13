// src/modules/cohort-resources/cohort-resources-service.js
import { ResourceWeek, CohortResource } from "./cohort-resources-model.js";

export const getResources = async (cohortId) => {
  const weeks = await ResourceWeek.findAll({
    where: { cohort_id: cohortId },
    include: [{ model: CohortResource, as: "resources", order: [["order", "ASC"]] }],
    order: [["order", "ASC"]],
  });
  return weeks.map((w) => w.toJSON());
};

export const createWeek = async (cohortId, data) => {
  const count = await ResourceWeek.count({ where: { cohort_id: cohortId } });
  const week = await ResourceWeek.create({ cohort_id: cohortId, title: data.title, order: data.order ?? count });
  return { ...week.toJSON(), resources: [] };
};

export const updateWeek = async (cohortId, weekId, data) => {
  const week = await ResourceWeek.findOne({ where: { id: weekId, cohort_id: cohortId } });
  if (!week) { const e = new Error("Week not found"); e.statusCode = 404; throw e; }
  await week.update({ title: data.title ?? week.title, order: data.order ?? week.order });
  return week.toJSON();
};

export const deleteWeek = async (cohortId, weekId) => {
  const week = await ResourceWeek.findOne({ where: { id: weekId, cohort_id: cohortId } });
  if (!week) { const e = new Error("Week not found"); e.statusCode = 404; throw e; }
  await CohortResource.destroy({ where: { week_id: weekId } });
  await week.destroy();
  return { deleted: true };
};

export const createResource = async (cohortId, weekId, data) => {
  const week = await ResourceWeek.findOne({ where: { id: weekId, cohort_id: cohortId } });
  if (!week) { const e = new Error("Week not found"); e.statusCode = 404; throw e; }
  const count = await CohortResource.count({ where: { week_id: weekId } });
  const resource = await CohortResource.create({
    week_id: weekId, cohort_id: cohortId,
    title: data.title, url: data.url || null,
    type: data.type || "link", description: data.description || null,
    order: data.order ?? count,
  });
  return resource.toJSON();
};

export const updateResource = async (cohortId, resourceId, data) => {
  const resource = await CohortResource.findOne({ where: { id: resourceId, cohort_id: cohortId } });
  if (!resource) { const e = new Error("Resource not found"); e.statusCode = 404; throw e; }
  await resource.update({ title: data.title ?? resource.title, url: data.url ?? resource.url, type: data.type ?? resource.type, description: data.description ?? resource.description });
  return resource.toJSON();
};

export const deleteResource = async (cohortId, resourceId) => {
  const resource = await CohortResource.findOne({ where: { id: resourceId, cohort_id: cohortId } });
  if (!resource) { const e = new Error("Resource not found"); e.statusCode = 404; throw e; }
  await resource.destroy();
  return { deleted: true };
};