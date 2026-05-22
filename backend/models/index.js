// Models index - exports all database models and sequelize instance
export {
  sequelize,
  User,
  Institution,
  InterviewSession,
  Subscription,
  Admin
} from "../db/index.js";

// Default export for backwards compatibility
import * as dbModels from "../db/index.js";
export default dbModels;

