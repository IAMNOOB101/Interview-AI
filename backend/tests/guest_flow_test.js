import sequelize, { UserSQL } from "../db/sequelize.js";
import { startInterview, submitAnswer } from "../controllers/session.controller.js";

async function run() {
  try {
    console.log("Connecting to DB...");
    await sequelize.authenticate();
    await sequelize.sync();

    // Create a guest user
    const email = `guest_test_${Date.now()}@example.com`;
    console.log("Creating guest user:", email);
    const guest = await UserSQL.create({ email, accountType: "guest", role: "guest", interviewCount: 0 });

    // Mock req/res for startInterview
    const startReq = { user: { id: String(guest.id) } };
    const startRes = createMockRes();

    console.log("Starting interview for guest...");
    await startInterview(startReq, startRes);

    const startPayload = startRes.payload;
    if (!startPayload || !startPayload.sessionId) {
      console.error("Failed to start session", startPayload);
      process.exit(2);
    }

    const sessionId = startPayload.sessionId;
    console.log("Session created:", sessionId);

    // Submit answers until completion
    let completed = false;
    let attempts = 0;

    while (!completed && attempts < 30) {
      attempts += 1;
      const submitReq = {
        user: { id: String(guest.id) },
        body: { sessionId, answerText: `Test answer ${attempts}`, confidence: { voice: 5, facial: 5 } },
      };
      const submitRes = createMockRes();
      await submitAnswer(submitReq, submitRes);
      const payload = submitRes.payload;
      if (!payload) {
        console.error("Submit answer failed, no payload", submitRes);
        break;
      }

      completed = !!payload.completed;
      console.log(`Attempt ${attempts} -> completed: ${completed}`);
      if (completed) {
        console.log("Final report:", payload.finalReport);
        break;
      }
    }

    // Reload user and check interviewCount
    const reloaded = await UserSQL.findByPk(guest.id);
    console.log("Guest interviewCount:", reloaded.get ? reloaded.get({ plain: true }).interviewCount : reloaded.interviewCount);

    const finalCount = reloaded.get ? reloaded.get({ plain: true }).interviewCount : reloaded.interviewCount;
    if (finalCount >= 1) {
      console.log("Guest flow test passed — interviewCount incremented.");
      process.exit(0);
    } else {
      console.error("Guest flow test failed — interviewCount not incremented.");
      process.exit(3);
    }
  } catch (err) {
    console.error("Error during guest flow test:", err);
    process.exit(4);
  } finally {
    try {
      await sequelize.close();
    } catch (e) {}
  }
}

function createMockRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return payload;
    },
  };
}

run();
