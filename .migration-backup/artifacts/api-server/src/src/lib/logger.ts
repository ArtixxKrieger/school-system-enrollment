const isProduction = process.env.NODE_ENV === "production";

export const logger = {
  info: (obj: unknown, msg?: string) => {
    const message = msg ?? (typeof obj === "string" ? obj : JSON.stringify(obj));
    console.log(`[INFO] ${message}`);
  },
  error: (obj: unknown, msg?: string) => {
    const message = msg ?? (typeof obj === "string" ? obj : JSON.stringify(obj));
    console.error(`[ERROR] ${message}`, typeof obj === "object" ? obj : "");
  },
  warn: (obj: unknown, msg?: string) => {
    const message = msg ?? (typeof obj === "string" ? obj : JSON.stringify(obj));
    console.warn(`[WARN] ${message}`);
  },
  debug: (obj: unknown, msg?: string) => {
    if (!isProduction) {
      const message = msg ?? (typeof obj === "string" ? obj : JSON.stringify(obj));
      console.debug(`[DEBUG] ${message}`);
    }
  },
};
