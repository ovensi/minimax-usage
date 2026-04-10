import { getHudLine } from "./hud";

async function main() {
  const line = await getHudLine();
  if (line) {
    console.log(line);
  }
}

main().catch((error) => {
  console.error("HUD error:", error.message);
  process.exit(1);
});
