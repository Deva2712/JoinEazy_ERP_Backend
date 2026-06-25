import { ResourceWeek, CohortResource } from "./cohort-resources-model.js";
import { Op } from "sequelize";

// ─── Helper: format week with frontend expected fields 
const fmtWeek = (w, index) => {
  const json = w.toJSON ? w.toJSON() : w;
  const resources = json.resources || [];
  return {
    ...json,
    weekNumber:     index + 1,
    totalResources: resources.length,
    resources:      resources.map(fmtResource),
     startDate:      json.start_date || null,   
    endDate:        json.end_date   || null,
  };
};

const fmtResource = (r) => {
  const json = r.toJSON ? r.toJSON() : r;
  return {
    ...json,
    fileUrl: json.url,
  };
};

// ─── GET all resources — returns { weeks, stats } 
export const getResources = async (cohortId) => {
  const weeks = await ResourceWeek.findAll({
    where: { cohort_id: cohortId },
    include: [{ model: CohortResource, as: "resources", order: [["order", "ASC"]] }],
    order: [["order", "ASC"]],
  });

  const formatted = weeks.map((w, i) => fmtWeek(w, i));
  const totalResources = formatted.reduce((sum, w) => sum + w.totalResources, 0);

  return {
    weeks: formatted,
    stats: {
      totalWeeks:     formatted.length,
      totalResources,
    },
  };
};

// ─── CREATE week 
export const createWeek = async (cohortId, data) => {
  const count = await ResourceWeek.count({ where: { cohort_id: cohortId } });
  const week = await ResourceWeek.create({
    cohort_id: cohortId,
    title:     data.title,
    dateRange: data.dateRange || null,
     start_date: data.startDate || null,
    end_date:   data.endDate   || null,
    order:     data.order ?? count,
  });
  return fmtWeek(week, count);
};

// ─── UPDATE week ──────────────────────────────────────────────────────────────
export const updateWeek = async (cohortId, weekId, data) => {
  const week = await ResourceWeek.findOne({ where: { id: weekId, cohort_id: cohortId } });
  if (!week) { const e = new Error("Week not found"); e.statusCode = 404; throw e; }

   const newOrder = data.order !== undefined && data.order !== null
    ? parseInt(data.order)
    : (data.weekNumber !== undefined ? parseInt(data.weekNumber) - 1 : week.order);
 
  await week.update({
    title:     data.title     ?? week.title,
    dateRange: data.dateRange ?? week.dateRange,
     start_date: data.startDate ?? week.start_date ?? null,
    end_date:   data.endDate   ?? week.end_date   ?? null,
    order:     data.order     ?? week.order,
  });
  const index = await ResourceWeek.count({ where: { cohort_id: cohortId, order: { [Op.lt]: week.order } } });
  return fmtWeek(week, index);
};

// ─── DELETE week ──────────────────────────────────────────────────────────────
export const deleteWeek = async (cohortId, weekId) => {
  const week = await ResourceWeek.findOne({ where: { id: weekId, cohort_id: cohortId } });
  if (!week) { const e = new Error("Week not found"); e.statusCode = 404; throw e; }
  await CohortResource.destroy({ where: { week_id: weekId } });
  await week.destroy();
  return { deleted: true };
};

// ─── CREATE resource inside a week ────────────────────────────────────────────
export const createResource = async (cohortId, weekId, data) => {
  const week = await ResourceWeek.findOne({ where: { id: weekId, cohort_id: cohortId } });
  if (!week) { const e = new Error("Week not found"); e.statusCode = 404; throw e; }
  const count = await CohortResource.count({ where: { week_id: weekId } });
  const resource = await CohortResource.create({
    week_id:     weekId,
    cohort_id:   cohortId,
    title:       data.title,
    url:         data.url       || data.fileUrl || null,
    type:        data.type      || "link",
    description: data.description || null,
    order:       data.order     ?? count,
  });
  return fmtResource(resource);
};

// ─── UPDATE resource ──────────────────────────────────────────────────────────
export const updateResource = async (cohortId, resourceId, data) => {
  const resource = await CohortResource.findOne({ where: { id: resourceId, cohort_id: cohortId } });
  if (!resource) { const e = new Error("Resource not found"); e.statusCode = 404; throw e; }
  await resource.update({
    title:       data.title       ?? resource.title,
    url:         data.url         ?? data.fileUrl ?? resource.url,
    type:        data.type        ?? resource.type,
    description: data.description ?? resource.description,
  });
  return fmtResource(resource);
};

// ─── DELETE resource ──────────────────────────────────────────────────────────
export const deleteResource = async (cohortId, resourceId) => {
  const resource = await CohortResource.findOne({ where: { id: resourceId, cohort_id: cohortId } });
  if (!resource) { const e = new Error("Resource not found"); e.statusCode = 404; throw e; }
  await resource.destroy();
  return { deleted: true };
};