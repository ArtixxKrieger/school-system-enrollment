import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mod = require("../artifacts/api-server/dist/app.cjs");
export default mod.default ?? mod;
