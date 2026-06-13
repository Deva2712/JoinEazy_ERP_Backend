import { Expense } from "./expenses-model.js";

export const getExpenses = async (userId) => {
  const expenses = await Expense.findAll({
    where: { submitted_by: userId },
    order: [["created_at", "DESC"]],
  });
  return {
    expenses: {
      expenses: expenses.map(e => ({ ...e.toJSON(), date: e.created_at, amount: e.amount_spent })),
      financeAdmins: [],
    }
  };
};

export const createExpense = async (userId, userName, data) => {
  const expense = await Expense.create({
    submitted_by: userId, submitted_name: userName,
    title: data.title, category: data.category || null,
    description: data.description || null,
    amount_spent: data.amount_spent || data.amount,
    receipt_link: data.receipt_link || null,
    proof_doc_link: data.proof_doc_link || null,
    proof_doc_file: data.proof_doc_file || null,
    status: data.status || "Pending",
  });
  return expense.toJSON();
};

export const updateExpense = async (expenseId, userId, data) => {
  const expense = await Expense.findOne({ where: { id: expenseId, submitted_by: userId } });
  if (!expense) { const e = new Error("Expense not found"); e.statusCode = 404; throw e; }
  await expense.update({
    title: data.title ?? expense.title,
    category: data.category ?? expense.category,
    description: data.description ?? expense.description,
    amount_spent: data.amount ?? expense.amount_spent,
    proof_doc_link: data.proof_doc_link ?? expense.proof_doc_link,
    status: data.status ?? expense.status,
  });
  return expense.toJSON();
};

export const deleteExpense = async (expenseId, userId) => {
  const expense = await Expense.findOne({ where: { id: expenseId, submitted_by: userId } });
  if (!expense) { const e = new Error("Expense not found"); e.statusCode = 404; throw e; }
  await expense.destroy();
  return { deleted: true };
};