/**
 * InterviewAI — Comprehensive Database Seeder
 * ─────────────────────────────────────────────
 * Creates:
 *   1. A test institution  (Test University — test.edu)
 *   2. Admin user          admin@interviewai.com  / Admin@123
 *   3. Professional user   pro@interviewai.com    / Pro@123
 *   4. Student user        student@test.edu       / Student@123
 *
 * Run:  node seed.js
 */

import bcrypt from "bcryptjs";
import sequelize from "./db/sequelize.js";
import {
  UserSQL,
  InstitutionSQL,
  AdminSQL,
} from "./db/sequelize.js";

const INSTITUTION_NAME = "Test University";
const INSTITUTION_DOMAIN = "test.edu";

const USERS = [
  {
    firstName: "Super",
    lastName: "Admin",
    email: "admin@interviewai.com",
    password: "Admin@123",
    accountType: "admin",
    domain: "Platform Management",
    role: "Administrator",
    experience: "Senior",
    desiredSalary: "N/A",
    interviewProfile: {},
  },
  {
    firstName: "Pro",
    lastName: "User",
    email: "pro@interviewai.com",
    password: "Pro@123",
    accountType: "professional",
    domain: "Software Engineering",
    role: "Backend Developer",
    experience: "Mid",
    desiredSalary: "15 LPA",
    interviewProfile: {
      domain: "Software Engineering",
      role: "Backend Developer",
      experienceLevel: "Mid",
      salaryRange: "15 LPA",
    },
  },
  {
    firstName: "Student",
    lastName: "Tester",
    email: "student@test.edu",
    password: "Student@123",
    accountType: "student",
    enrollmentNumber: "EN2024001",
    domain: "Data Science",
    role: "Data Analyst",
    experience: "Fresher",
    desiredSalary: "6 LPA",
    interviewProfile: {
      domain: "Data Science",
      role: "Data Analyst",
      experienceLevel: "Fresher",
      salaryRange: "6 LPA",
    },
  },
];

const seed = async () => {
  try {
    // Connect and sync schema
    await sequelize.authenticate();
    console.log(" Database connected");
    await sequelize.sync({ alter: true });
    console.log(" Schema synced\n");

    // ── 1. Institution ──────────────────────────────────────────────
    let institution = await InstitutionSQL.findOne({ where: { name: INSTITUTION_NAME } });
    if (institution) {
      console.log(`ℹ  Institution "${INSTITUTION_NAME}" already exists (id=${institution.id})`);
    } else {
      institution = await InstitutionSQL.create({
        name: INSTITUTION_NAME,
        allowedDomains: [INSTITUTION_DOMAIN],
        perStudentPrice: 0,
        studentLimit: 500,
        studentsRegistered: 0,
        approvalStatus: "ACTIVE",
      });
      console.log(` Institution created: ${institution.name}  (domain: ${INSTITUTION_DOMAIN})`);
    }

    // ── 2. Users ────────────────────────────────────────────────────
    for (const u of USERS) {
      const existing = await UserSQL.findOne({ where: { email: u.email } });
      if (existing) {
        console.log(` User "${u.email}" already exists — skipping`);
        continue;
      }

      const hashed = await bcrypt.hash(u.password, 12);
      const institutionId =
        u.accountType === "student" ? institution.id : null;

      const user = await UserSQL.create({
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        password: hashed,
        accountType: u.accountType,
        enrollmentNumber: u.enrollmentNumber || null,
        institutionId,
        institutionEmailVerified: u.accountType === "student",
        domain: u.domain,
        role: u.role,
        experience: u.experience,
        desiredSalary: u.desiredSalary,
        interviewProfile: u.interviewProfile,
      });

      console.log(`User created: ${u.email}  (accountType: ${u.accountType})`);

      // If admin — create Admin record too
      if (u.accountType === "admin") {
        const existingAdmin = await AdminSQL.findOne({ where: { userId: user.id } });
        if (!existingAdmin) {
          await AdminSQL.create({
            userId: user.id,
            roleLevel: "super-admin",
            permissions: ["all"],
          });
          console.log(`   └─ Admin record created for ${u.email}`);
        }
      }

      // Increment institution student count
      if (u.accountType === "student") {
        await institution.increment("studentsRegistered");
      }
    }

    console.log("\n─────────────────────────────────────────────");
    console.log("🎉  Seeding complete!\n");
    console.log("Login credentials:");
    console.log("  👑 Admin      — admin@interviewai.com  / Admin@123");
    console.log("  💼 Pro User   — pro@interviewai.com    / Pro@123");
    console.log("  🎓 Student    — student@test.edu       / Student@123");
    console.log("─────────────────────────────────────────────\n");
  } catch (err) {
    console.error("Seeding failed:", err.message || err);
    console.error(err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

seed();