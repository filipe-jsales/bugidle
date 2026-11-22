import { tick } from "./engine";
import { bestOwned, bestPossibleMs, CHAMPIONS, evaluate, getRaid, isRaidUnlocked, RAIDS, raidProgress, raidReward, recruit, startRaid, tickGuild } from "./guild";
import { createSeededRng } from "./rng";
import { exportSave, importSave } from "./save";
import { stateWith } from "./testUtils";

const ms = (championId: string, raidId: string) => {
  const fit = evaluate(championId, raidId);
  if (!fit.ok) throw new Error(`${championId} cannot run ${raidId}`);
  return fit.ms;
};

describe("Big-O lessons in the raids", () => {
  it("O(n log n) beats O(n²) on big inputs", () => {
    expect(ms("mergeSort", "leaderboard")).toBeLessThan(ms("bubbleSort", "leaderboard") / 100);
  });

  it("insertion sort is linear on nearly sorted data", () => {
    const ops = (id: string) => {
      const fit = evaluate(id, "almostSorted");
      return fit.ok ? fit.ops : Infinity;
    };
    expect(ops("insertionSort")).toBeLessThan(ops("mergeSort"));
    expect(ops("insertionSort")).toBeLessThan(ops("bubbleSort") / 100);
  });

  it("quicksort hits its worst case on sorted data", () => {
    expect(ms("quickSort", "leaderboard")).toBeLessThan(ms("heapSort", "leaderboard"));
    expect(ms("quickSort", "alreadySorted")).toBeGreaterThan(ms("heapSort", "alreadySorted") * 100);
  });

  it("merge sort does not fit in tight memory; heap sort does", () => {
    expect(evaluate("mergeSort", "tinyMemory")).toEqual({ ok: false, reason: "memory" });
    expect(evaluate("heapSort", "tinyMemory").ok).toBe(true);
  });

  it("counting sort needs a small range, and then it is linear", () => {
    expect(evaluate("countingSort", "leaderboard")).toEqual({ ok: false, reason: "cannot" });
    expect(ms("countingSort", "censusAges")).toBeLessThan(ms("heapSort", "censusAges"));
  });

  it("binary search needs sorted data; hash tables win on many lookups", () => {
    expect(evaluate("binarySearch", "manyLookups")).toEqual({ ok: false, reason: "cannot" });
    expect(ms("binarySearch", "phoneBook")).toBeLessThan(ms("linearSearch", "phoneBook"));
    expect(ms("hashTable", "manyLookups")).toBeLessThan(ms("linearSearch", "manyLookups") / 1000);
  });

  it("sort champions cannot run search raids", () => {
    expect(evaluate("mergeSort", "findName")).toEqual({ ok: false, reason: "wrongKind" });
  });

  it("every raid can be done in under 2 hours by the right champion", () => {
    for (const raid of RAIDS) expect(bestPossibleMs(raid.id), raid.id).toBeLessThan(2 * 60 * 60_000);
    expect(CHAMPIONS.length).toBeGreaterThan(5);
  });

  it("pays more per minute for later raids, and the best pick pays the most per minute", () => {
    const perMinute = RAIDS.map((r) => raidReward(r.id) / (bestPossibleMs(r.id) / 60_000));
    for (let i = 1; i < perMinute.length; i++) expect(perMinute[i]!).toBeGreaterThan(perMinute[i - 1]! * 0.9);
    expect(raidReward("leaderboard") / (ms("mergeSort", "leaderboard") / 60_000)).toBeGreaterThan(raidReward("leaderboard") / (ms("bubbleSort", "leaderboard") / 60_000));
  });
});

describe("guild flow", () => {
  it("starts with the two simple champions and recruits more with coins", () => {
    const state = stateWith(["leaklet", 5]);
    expect(state.guild.owned).toEqual(["bubbleSort", "linearSearch"]);
    state.coins = 3000;
    expect(recruit(state, "mergeSort").ok).toBe(true);
    expect(state.coins).toBe(0);
    expect(recruit(state, "mergeSort")).toEqual({ ok: false, reason: "alreadyOwned" });
    expect(recruit(state, "heapSort")).toEqual({ ok: false, reason: "notEnoughCoins" });
  });

  it("unlocks raids in order and pays triple on the first clear", () => {
    const state = stateWith(["leaklet", 5]);
    expect(isRaidUnlocked(state.guild, "findName")).toBe(false);
    expect(startRaid(state, "findName", "linearSearch")).toEqual({ ok: false, reason: "raidLocked" });
    expect(startRaid(state, "sortGrades", "bubbleSort").ok).toBe(true);
    expect(startRaid(state, "sortGrades", "bubbleSort")).toEqual({ ok: false, reason: "raidRunning" });
    state.totals.playTimeMs += 60_000;
    expect(raidProgress(state)).toBe(1);
    const coins = state.coins;
    expect(tickGuild(state)).toMatchObject({ raidId: "sortGrades", coins: raidReward("sortGrades") * 3, firstClear: true });
    expect(state.coins).toBe(coins + raidReward("sortGrades") * 3);
    expect(getRaid("sortGrades").ratePerMin).toBeGreaterThan(0);
    expect(isRaidUnlocked(state.guild, "findName")).toBe(true);
  });

  it("repeats automatically and runs inside the game loop", () => {
    const state = stateWith(["leaklet", 5]);
    startRaid(state, "sortGrades", "bubbleSort");
    const events = tick(state, 130_000, createSeededRng(1));
    expect(events.filter((e) => e.type === "raidDone").length).toBeGreaterThanOrEqual(2);
    expect(state.guild.raid).not.toBeNull();
  });

  it("refuses champions that cannot do the job and suggests the best one owned", () => {
    const state = stateWith(["leaklet", 5]);
    state.guild.clears = Object.fromEntries(RAIDS.map((r) => [r.id, 1]));
    state.guild.owned.push("mergeSort");
    expect(startRaid(state, "tinyMemory", "mergeSort")).toEqual({ ok: false, reason: "cannotRun" });
    expect(bestOwned(state.guild, "leaderboard")).toBe("mergeSort");
  });

  it("is saved", () => {
    const state = stateWith(["leaklet", 5]);
    startRaid(state, "sortGrades", "bubbleSort");
    state.guild.clears.sortGrades = 2;
    expect(importSave(exportSave(state)).guild).toEqual(state.guild);
  });
});
