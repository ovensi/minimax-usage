"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hud_1 = require("./hud");
async function main() {
    const line = await (0, hud_1.getHudLine)();
    if (line) {
        console.log(line);
    }
}
main().catch((error) => {
    console.error("HUD error:", error.message);
    process.exit(1);
});
