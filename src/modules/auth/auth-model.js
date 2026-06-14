import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import bcrypt from "bcryptjs";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "professor", "student", "staff"),
      defaultValue: "student",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // ─── Professor / Staff profile fields ────────────────────────────────────
    dateOfBirth:      { type: DataTypes.DATEONLY, allowNull: true },
    gender:           { type: DataTypes.STRING, allowNull: true },
    employeeId:       { type: DataTypes.STRING, allowNull: true },
    department:       { type: DataTypes.STRING, allowNull: true },
    designation:      { type: DataTypes.STRING, allowNull: true },
    officeLocation:   { type: DataTypes.STRING, allowNull: true },
    permanentAddress: { type: DataTypes.TEXT, allowNull: true },
    currentAddress:   { type: DataTypes.TEXT, allowNull: true },
    city:             { type: DataTypes.STRING, allowNull: true },
    state:            { type: DataTypes.STRING, allowNull: true },
    pinCode:          { type: DataTypes.STRING, allowNull: true },
    country:          { type: DataTypes.STRING, allowNull: true },
    mobileNumber:     { type: DataTypes.STRING, allowNull: true },
    alternateNumber:  { type: DataTypes.STRING, allowNull: true },
    personalEmail:    { type: DataTypes.STRING, allowNull: true },
    linkedinProfile:  { type: DataTypes.STRING, allowNull: true },
    panNumber:        { type: DataTypes.STRING, allowNull: true },
    aadhaarNumber:    { type: DataTypes.STRING, allowNull: true },
    profile_pic:      { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

// Hash password before saving
User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

User.beforeUpdate(async (user) => {
  if (user.changed("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Instance method to compare passwords
User.prototype.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default User;
