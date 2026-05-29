const COLORS = {
  GET:    "\x1b[32m",  // green
  POST:   "\x1b[34m",  // blue
  PUT:    "\x1b[33m",  // yellow
  PATCH:  "\x1b[33m",  // yellow
  DELETE: "\x1b[31m",  // red
  RESET:  "\x1b[0m",
  GRAY:   "\x1b[90m",
  CYAN:   "\x1b[36m",
  RED:    "\x1b[31m",
  GREEN:  "\x1b[32m",
  YELLOW: "\x1b[33m",
};

const statusColor = (code) => {
  if (code >= 500) return COLORS.RED;
  if (code >= 400) return COLORS.YELLOW;
  if (code >= 300) return COLORS.CYAN;
  return COLORS.GREEN;
};

export const logger = (req, res, next) => {
  const start = Date.now();
  const methodColor = COLORS[req.method] || COLORS.RESET;
  const ts = new Date().toISOString().replace("T", " ").slice(0, 23);

  res.on("finish", () => {
    const ms = Date.now() - start;
    const sc = statusColor(res.statusCode);
    const len = res.get("content-length") ? ` ${res.get("content-length")}b` : "";
    console.log(
      `${COLORS.GRAY}[${ts}]${COLORS.RESET} ` +
      `${methodColor}${req.method.padEnd(6)}${COLORS.RESET} ` +
      `${COLORS.CYAN}${req.originalUrl}${COLORS.RESET} ` +
      `${sc}${res.statusCode}${COLORS.RESET}` +
      `${COLORS.GRAY} +${ms}ms${len}${COLORS.RESET}`
    );
  });

  next();
};
