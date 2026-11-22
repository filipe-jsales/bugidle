import { createBattle } from "./battle";
import { boxBugs, filterBugs, moveToBox, moveToTeam, releaseBug, setLead, swapWithBox } from "./collection";
import { MAX_TEAM_SIZE } from "./state";
import { stateWith } from "./testUtils";

const seven = () =>
  stateWith(["typobit", 5], ["nullit", 8], ["leaklet", 12], ["pixelmite", 3], ["racemite", 20], ["corsbee", 15], ["zeroday", 70]);

describe("team and box (RF06)", () => {
  it("fills the team up to 6 and sends the rest to the box", () => {
    const state = seven();
    expect(state.team).toHaveLength(MAX_TEAM_SIZE);
    expect(boxBugs(state).map((b) => b.speciesId)).toEqual(["zeroday"]);
  });

  it("moves bugs between team and box", () => {
    const state = seven();
    const boxed = boxBugs(state)[0]!.uid;
    expect(moveToTeam(state, boxed)).toEqual({ ok: false, reason: "teamFull" });
    const leaving = state.team[5]!;
    expect(moveToBox(state, leaving).ok).toBe(true);
    expect(moveToTeam(state, boxed).ok).toBe(true);
    expect(state.team).toContain(boxed);
    expect(moveToTeam(state, boxed)).toEqual({ ok: false, reason: "alreadyInTeam" });
  });

  it("never empties the team", () => {
    const state = stateWith(["typobit", 5]);
    expect(moveToBox(state, state.team[0]!)).toEqual({ ok: false, reason: "lastTeamMember" });
    expect(releaseBug(state, state.team[0]!)).toEqual({ ok: false, reason: "lastTeamMember" });
  });

  it("swaps a team slot with a boxed bug", () => {
    const state = seven();
    const boxed = boxBugs(state)[0]!.uid;
    const slot = state.team[2]!;
    expect(swapWithBox(state, slot, boxed).ok).toBe(true);
    expect(state.team[2]).toBe(boxed);
    expect(boxBugs(state).map((b) => b.uid)).toContain(slot);
  });

  it("sets the lead", () => {
    const state = seven();
    const third = state.team[2]!;
    setLead(state, third);
    expect(state.team[0]).toBe(third);
  });

  it("blocks team edits during a boss fight", () => {
    const state = seven();
    state.runtime.battle = createBattle("boss", [state.bugs[state.team[0]!]!]);
    expect(setLead(state, state.team[1]!)).toEqual({ ok: false, reason: "busy" });
  });

  it("releases bugs for coins", () => {
    const state = seven();
    const boxed = boxBugs(state)[0]!;
    const coins = state.coins;
    expect(releaseBug(state, boxed.uid).ok).toBe(true);
    expect(state.bugs[boxed.uid]).toBeUndefined();
    expect(state.coins).toBe(coins + boxed.level * 2);
  });
});

describe("box search and filters", () => {
  const bugs = () => Object.values(seven().bugs);

  it("searches by name", () => {
    expect(filterBugs(bugs(), { text: "NULL" }).map((b) => b.speciesId)).toEqual(["nullit"]);
  });

  it("filters by type, rarity, level and shiny", () => {
    expect(filterBugs(bugs(), { type: "security" }).map((b) => b.speciesId).sort()).toEqual(["corsbee", "zeroday"]);
    expect(filterBugs(bugs(), { rarity: "legendary" }).map((b) => b.speciesId)).toEqual(["zeroday"]);
    expect(filterBugs(bugs(), { minLevel: 10, maxLevel: 20 })).toHaveLength(3);
    expect(filterBugs(bugs(), { shinyOnly: true })).toHaveLength(0);
  });

  it("sorts by level and dex number", () => {
    expect(filterBugs(bugs(), { sort: "level" })[0]!.speciesId).toBe("zeroday");
    expect(filterBugs(bugs(), { sort: "dex" })[0]!.speciesId).toBe("typobit");
  });
});
