import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

let transport: pino.TransportSingleOptions | undefined;

if (!isProduction) {
  transport = {
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "HH:MM:ss",
    },
    target: "pino-pretty",
  };
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  name: "verso",
  transport,
});
