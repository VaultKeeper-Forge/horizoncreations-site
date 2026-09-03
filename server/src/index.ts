import { buildApp } from "./http/app.js";
import { readConfig } from "./config/config.js";

const config = readConfig();
const app = await buildApp({ config });
await app.listen({ host: config.HOST, port: config.PORT });
