import sequelize from "./db/sequelize.js";
import { InstitutionSQL } from "./db/sequelize.js";

const seedInstitution = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const existing = await InstitutionSQL.findOne({ where: { name: "Test University" } });
    if (existing) {
      console.log("Institution already exists.");
      return;
    }

    await InstitutionSQL.create({
      name: "Test University",
      allowedDomains: ["test.edu", "university.com"],
      studentLimit: 1000,
      approvalStatus: "ACTIVE",
    });

    console.log("Institution seeded successfully: Test University (test.edu, university.com)");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await sequelize.close();
  }
};

seedInstitution();
