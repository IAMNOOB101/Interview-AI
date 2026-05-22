import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME || "interviewai",
  process.env.DB_USER || "postgres",
  process.env.DB_PASS || "iamuser",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: false,
    pool: { max: 20, min: 2, acquire: 30000, idle: 10000 },
  }
);

export const User = sequelize.define("User", {
  id:                        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firstName:                 { type: DataTypes.STRING, allowNull: false },
  lastName:                  { type: DataTypes.STRING },
  email:                     { type: DataTypes.STRING, unique: true, allowNull: false },
  password:                  { type: DataTypes.STRING },
  accountType:               { type: DataTypes.STRING, defaultValue: "professional" },
  enrollmentNumber:          { type: DataTypes.STRING },
  institutionEmailVerified:  { type: DataTypes.BOOLEAN, defaultValue: false },
  institutionId:             {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "institutions",
      key: "id"
    },
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
  },
  interviewProfile:          { type: DataTypes.JSONB, defaultValue: {} },
  resumeURL:                 { type: DataTypes.STRING },
  resumeData:                { type: DataTypes.JSONB, defaultValue: {} },
  usedGuestInterview:        { type: DataTypes.BOOLEAN, defaultValue: false },
  totpSecret:                { type: DataTypes.STRING },
  totpEnabled:               { type: DataTypes.BOOLEAN, defaultValue: false },
  // convenience fields stored at top-level AND inside interviewProfile
  domain:                    { type: DataTypes.STRING },
  role:                      { type: DataTypes.STRING },
  experience:                { type: DataTypes.STRING },
  desiredSalary:             { type: DataTypes.STRING },
}, { tableName: "users", timestamps: true });

export const Institution = sequelize.define("Institution", {
  id:                  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:                { type: DataTypes.STRING, allowNull: false, unique: true },
  allowedDomains:      { type: DataTypes.JSONB, defaultValue: [] },
  perStudentPrice:     { type: DataTypes.FLOAT, defaultValue: 0 },
  studentLimit:        { type: DataTypes.INTEGER, defaultValue: 0 },
  studentsRegistered:  { type: DataTypes.INTEGER, defaultValue: 0 },
  approvalStatus:      { type: DataTypes.STRING, defaultValue: "PENDING" },
  subscriptionValidTill: { type: DataTypes.DATE, allowNull: true },
}, { tableName: "institutions", timestamps: true });

export const InterviewSession = sequelize.define("InterviewSession", {
  id:                   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId:               {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "users",
      key: "id"
    },
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
  },
  domain:               { type: DataTypes.STRING },
  language:             { type: DataTypes.STRING, defaultValue: "en" },
  salaryRange:          { type: DataTypes.JSONB, defaultValue: {} },
  questions:            { type: DataTypes.JSONB, defaultValue: [] },
  currentQuestionIndex: { type: DataTypes.INTEGER, defaultValue: 0 },
  completed:            { type: DataTypes.BOOLEAN, defaultValue: false },
  transcriptLocked:     { type: DataTypes.BOOLEAN, defaultValue: false },
  finalReport:          { type: DataTypes.JSONB, defaultValue: {} },
  expiresAt:            { type: DataTypes.DATE, allowNull: true },
  mediaURLs:            { type: DataTypes.JSONB, defaultValue: {} },
}, { tableName: "interview_sessions", timestamps: true });

export const Subscription = sequelize.define("Subscription", {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId:        {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "users",
      key: "id"
    },
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
  },
  institutionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "institutions",
      key: "id"
    },
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
  },
  plan:          { type: DataTypes.STRING },
  providerId:    { type: DataTypes.STRING },
  status:        { type: DataTypes.STRING, defaultValue: "ACTIVE" },
  validTill:     { type: DataTypes.DATE, allowNull: true },
}, { tableName: "subscriptions", timestamps: true });

export const Admin = sequelize.define("Admin", {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId:     {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: "users",
      key: "id"
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  },
  roleLevel:  { type: DataTypes.STRING, defaultValue: "support-admin" },
  permissions:{ type: DataTypes.JSONB, defaultValue: [] },
  createdBy:  {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "admins",
      key: "id"
    },
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
  },
}, { tableName: "admins", timestamps: true });

// Associations
Institution.hasMany(User, { foreignKey: "institutionId" });
User.belongsTo(Institution, { foreignKey: "institutionId" });
User.hasMany(InterviewSession, { foreignKey: "userId" });
InterviewSession.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Subscription, { foreignKey: "userId" });
Subscription.belongsTo(User, { foreignKey: "userId" });
Institution.hasMany(Subscription, { foreignKey: "institutionId" });
Subscription.belongsTo(Institution, { foreignKey: "institutionId" });
User.hasMany(Admin, { foreignKey: "userId" });
Admin.belongsTo(User, { foreignKey: "userId" });
Admin.belongsTo(Admin, { foreignKey: "createdBy", as: "creator" });

export default sequelize;
