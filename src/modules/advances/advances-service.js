import { Advance } from "./advances-model.js";

export const getAdvances = async (userId) => {
  const advances = await Advance.findAll({
    where: { submitted_by: userId },
    order: [["created_at", "DESC"]],
  });
  return {
    advances: {
      advances: advances.map(a => ({ ...a.toJSON(), date: a.created_at, amount: a.amount_requested })),
      advanceAdmins: [],
    }
  };
};

export const createAdvance = async (userId, userName, data) => {
  const advance = await Advance.create({
    submitted_by: userId, submitted_name: userName,
    title: data.title, category: data.category || null,
    description: data.description || null,
    amount_requested: data.amount_requested || data.amount,
    proof_doc_link: data.proof_doc_link || null,
    proof_doc_file: data.proof_doc_file || null,
    status: data.status || "Pending",
  });
  return advance.toJSON();
};

export const updateAdvance = async (advanceId, userId, data) => {
  const advance = await Advance.findOne({ where: { id: advanceId, submitted_by: userId } });
  if (!advance) { const e = new Error("Advance not found"); e.statusCode = 404; throw e; }
  await advance.update({
    title: data.title ?? advance.title,
    category: data.category ?? advance.category,
    description: data.description ?? advance.description,
    amount_requested: data.amount ?? advance.amount_requested,
    proof_doc_link: data.proof_doc_link ?? advance.proof_doc_link,
    status: data.status ?? advance.status,
  });
  return advance.toJSON();
};

export const deleteAdvance = async (advanceId, userId) => {
  const advance = await Advance.findOne({ where: { id: advanceId, submitted_by: userId } });
  if (!advance) { const e = new Error("Advance not found"); e.statusCode = 404; throw e; }
  await advance.destroy();
  return { deleted: true };
};