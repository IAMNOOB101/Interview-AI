import asyncHandler from "express-async-handler";

export const requireAccountType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user || !allowedTypes.includes(req.user.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Access denied for this account type"
      });
    }
    next();
  };
};

// Permit access for specified account types (accountType values)
export const permit = (...allowed) => {
  return (req, res, next) => {
    const accountType = req.user?.accountType || req.user?.role;
    if (!accountType) return res.status(401).json({ message: "Unauthorized" });

    if (allowed.includes(accountType)) return next();

    return res.status(403).json({ message: "Forbidden: insufficient privileges" });
  };
};

// Ensure student users are tied to an institution (basic check until Institution model is added)
export const requireInstitution = (req, res, next) => {
  const accountType = req.user?.accountType || req.user?.role;
  if (accountType !== "student") return next();

  if (!req.user?.institutionID) {
    return res.status(403).json({ message: "Student account not associated with an approved institution" });
  }

  return next();
};

// Quick admin check
export const isAdmin = (req) => {
  const accountType = req.user?.accountType || req.user?.role;
  return accountType === "admin";
};

export default { permit, requireInstitution, isAdmin };
export const allowRoles = (...allowedAccountTypes) => {
  return (req, res, next) => {
    if (!req.user || !req.user.accountType) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!allowedAccountTypes.includes(req.user.accountType)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};
