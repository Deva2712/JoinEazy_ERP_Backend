import Department from "./department-model.js";

export const getDepartments = async () => {
  const departments = await Department.findAll();
  return { departments };
};

export const getDepartment = async (id) => {
  const department = await Department.findByPk(id);
  if (!department) { const err = new Error("Department not found"); err.statusCode = 404; throw err; }
  return { department };
};

export const createDepartment = async (data) => {
  const department = await Department.create(data);
  return { department };
};

export const updateDepartment = async (id, data) => {
  const department = await Department.findByPk(id);
  if (!department) { const err = new Error("Department not found"); err.statusCode = 404; throw err; }
  await department.update(data);
  return { department };
};

export const deleteDepartment = async (id) => {
  const department = await Department.findByPk(id);
  if (!department) { const err = new Error("Department not found"); err.statusCode = 404; throw err; }
  await department.destroy();
  return { message: "Department deleted" };
};