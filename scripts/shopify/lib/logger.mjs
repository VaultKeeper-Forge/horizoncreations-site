function stamp() {
  return new Date().toISOString();
}

function write(level, message) {
  console.log(`[${stamp()}] [${level}] ${message}`);
}

export const logger = {
  info(message) {
    write("INFO", message);
  },
  warn(message) {
    write("WARN", message);
  },
  error(message) {
    write("ERROR", message);
  },
  step(message) {
    write("STEP", message);
  },
};
