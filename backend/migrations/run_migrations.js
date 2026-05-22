import sequelize from "../db/sequelize.js";

const run = async () => {
  try {
    console.log("Running migrations (sequelize.sync({ alter: true }))...");
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("Migrations applied (sync alter completed).");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

run();
