export const validateGuestLimit = (user) => {
  if (user.accountType === "guest" && user.interviewCount >= 1) {
    throw new Error("Guest interview limit reached");
  }
};

export const validateStudentEmail = (email) => {
  if (!email.includes("@")) {
    throw new Error("Invalid email format");
  }
};
