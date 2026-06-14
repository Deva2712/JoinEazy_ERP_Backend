import { StudentProfile, ProfileDocument } from "./student-profile-model.js";
import User from "../auth/auth-model.js";

const camelizeAddress = (addr) => addr || { line1: "", line2: "", city: "", state: "", pin: "", country: "India" };

const toFrontendShape = (profile, user) => {
  const p = profile?.toJSON ? profile.toJSON() : (profile || {});
  return {
    studentData: {
      fullName:        p.full_name || user?.name || "",
      dob:             p.dob || "",
      gender:          p.gender || "",
      aadhaarNumber:   p.aadhaar_number || "",
      nationality:     p.nationality || "Indian",
      religion:        p.religion || "",
      casteCategory:   p.caste_category || "",
      motherTongue:    p.mother_tongue || "",
      physicallyHandicapped: p.physically_handicapped || "No",
      mobileNumber:    p.mobile_number || "",
      alternateMobile: p.alternate_mobile || "",
      officialEmail:   p.official_email || user?.email || "",
      personalEmail:   p.personal_email || "",
      permanentAddress: camelizeAddress(p.permanent_address),
      currentAddress:   camelizeAddress(p.current_address),
      sameAddress:     p.same_address || false,
      father:   p.father   || { name: "", occupation: "", income: "", mobile: "", email: "" },
      mother:   p.mother   || { name: "", occupation: "", income: "", mobile: "", email: "" },
      guardian: p.guardian || { name: "", relation: "", occupation: "", income: "", mobile: "", email: "" },
      tenth:   p.tenth   || { school: "", board: "", year: "", percentage: "", subjects: "" },
      twelfth: p.twelfth || { school: "", board: "", year: "", percentage: "", stream: "" },
      diploma: p.diploma || { college: "", board: "", year: "", percentage: "", branch: "" },
      ug:      p.ug      || { college: "", university: "", year: "", cgpa: "", branch: "" },
      pg:      p.pg      || { college: "", university: "", year: "", cgpa: "", branch: "" },
      careerObjective: p.career_objective || "",
      hasGap: p.has_gap || "No", gapYear: p.gap_year || "", gapReason: p.gap_reason || "",
      bloodGroup: p.blood_group || "", medicalConditions: p.medical_conditions || "",
      emergencyContact: p.emergency_contact || "", emergencyName: p.emergency_name || "",
      emergencyRelation: p.emergency_relation || "",
      accountNumber: p.account_number || "", ifscCode: p.ifsc_code || "",
      bankName: p.bank_name || "", branchName: p.branch_name || "",
      scholarshipLinked: p.scholarship_linked || "No",
      passportNumber: p.passport_number || "", passportExpiry: p.passport_expiry || "",
      visaType: p.visa_type || "", visaExpiry: p.visa_expiry || "", nationality2: p.nationality2 || "",
    },
    portfolioData: p.portfolio || {
      entranceExams: [], documents: [], portfolioLinks: [], skills: [], certifications: [], achievements: [],
    },
    profileImageUrl: p.profile_pic_url || null,
  };
};

export const getProfile = async (userId) => {
  const profile = await StudentProfile.findOne({ where: { user_id: userId } });
  const user = await User.findByPk(userId, { attributes: ["name", "email"] });
  return toFrontendShape(profile, user);
};

const toSnakeAddress = (a) => a ? {
  line1: a.line1 || "", line2: a.line2 || "", city: a.city || "",
  state: a.state || "", pin: a.pin || "", country: a.country || "India",
} : null;

export const updateProfile = async (userId, data) => {
  const updates = {
    full_name: data.fullName, dob: data.dob || null, gender: data.gender,
    aadhaar_number: data.aadhaarNumber, nationality: data.nationality,
    religion: data.religion, caste_category: data.casteCategory,
    mother_tongue: data.motherTongue, physically_handicapped: data.physicallyHandicapped,
    mobile_number: data.mobileNumber, alternate_mobile: data.alternateMobile,
    official_email: data.officialEmail, personal_email: data.personalEmail,
    permanent_address: toSnakeAddress(data.permanentAddress),
    current_address: toSnakeAddress(data.currentAddress),
    same_address: data.sameAddress,
    father: data.father, mother: data.mother, guardian: data.guardian,
    tenth: data.tenth, twelfth: data.twelfth, diploma: data.diploma, ug: data.ug, pg: data.pg,
    career_objective: data.careerObjective,
    has_gap: data.hasGap, gap_year: data.gapYear, gap_reason: data.gapReason,
    blood_group: data.bloodGroup, medical_conditions: data.medicalConditions,
    emergency_contact: data.emergencyContact, emergency_name: data.emergencyName,
    emergency_relation: data.emergencyRelation,
    account_number: data.accountNumber, ifsc_code: data.ifscCode,
    bank_name: data.bankName, branch_name: data.branchName,
    scholarship_linked: data.scholarshipLinked,
    passport_number: data.passportNumber, passport_expiry: data.passportExpiry || null,
    visa_type: data.visaType, visa_expiry: data.visaExpiry || null, nationality2: data.nationality2,
  };

  // Remove undefined keys
  Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

  const [profile] = await StudentProfile.findOrCreate({
    where: { user_id: userId },
    defaults: { user_id: userId, ...updates },
  });
  await profile.update(updates);

  const user = await User.findByPk(userId, { attributes: ["name", "email"] });
  return toFrontendShape(profile, user);
};

export const updatePortfolio = async (userId, portfolioData) => {
  const [profile] = await StudentProfile.findOrCreate({
    where: { user_id: userId },
    defaults: { user_id: userId, portfolio: portfolioData },
  });
  await profile.update({ portfolio: portfolioData });
  const user = await User.findByPk(userId, { attributes: ["name", "email"] });
  return toFrontendShape(profile, user);
};

export const addDocument = async (userId, docType, file) => {
  const doc = await ProfileDocument.create({
    user_id: userId,
    doc_type: docType,
    file_name: file.originalname || file.filename || "document",
    file_url: file.location || file.path || null,
  });
  return doc.toJSON();
};

export const getDocuments = async (userId) => {
  const docs = await ProfileDocument.findAll({ where: { user_id: userId }, order: [["uploaded_at", "DESC"]] });
  return docs.map(d => d.toJSON());
};
