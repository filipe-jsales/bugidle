import { formatReport, simulatePlaythrough } from "../src/game/simulation";

const seeds = process.argv.slice(2).map(Number).filter((n) => Number.isFinite(n));
for (const seed of seeds.length > 0 ? seeds : [1, 2, 3]) {
  const started = Date.now();
  console.log(`--- seed ${seed}`);
  console.log(formatReport(simulatePlaythrough({ seed })));
  console.log(`(simulated in ${((Date.now() - started) / 1000).toFixed(1)} s)`);
}
