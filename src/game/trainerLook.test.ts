import { BOSSES } from "./data/world";
import { exportSave, importSave } from "./save";
import { stateWith } from "./testUtils";
import { defaultLook, favoriteBug, isLookOptionOpen, sanitizeLook, setFavorite, setLook } from "./trainerLook";

describe("trainer look", () => {
  it("starts with the classic look and changes any free option", () => {
    const state = stateWith(["typobit", 5]);
    expect(state.trainer.look).toEqual(defaultLook());
    expect(setLook(state, "jacket", "green").ok).toBe(true);
    expect(setLook(state, "headwear", "beanie").ok).toBe(true);
    expect(state.trainer.look.jacket).toBe("green");
    expect(setLook(state, "jacket", "rainbow")).toEqual({ ok: false, reason: "invalidQuantity" });
  });

  it("special options are earned: a shiny, the first boss, all bosses", () => {
    const state = stateWith(["typobit", 5]);
    expect(setLook(state, "headColor", "shiny")).toEqual({ ok: false, reason: "lookLocked" });
    state.totals.shinies = 1;
    expect(setLook(state, "headColor", "shiny").ok).toBe(true);
    expect(isLookOptionOpen(state, "backpack", "legend")).toBe(false);
    state.badges.push(BOSSES[0]!.badgeId);
    expect(isLookOptionOpen(state, "backpack", "legend")).toBe(true);
    expect(isLookOptionOpen(state, "jacket", "gold")).toBe(false);
    state.badges = BOSSES.map((b) => b.badgeId);
    expect(isLookOptionOpen(state, "jacket", "gold")).toBe(true);
  });

  it("is saved, and a broken look falls back to the default per part", () => {
    const state = stateWith(["typobit", 5]);
    setLook(state, "hair", "blond");
    expect(importSave(exportSave(state)).trainer.look.hair).toBe("blond");
    expect(sanitizeLook({ hair: "pink", jacket: "teal", skin: 3 })).toEqual({ ...defaultLook(), jacket: "teal" });
    expect(sanitizeLook(null)).toEqual(defaultLook());
  });
});

describe("favorite bug", () => {
  it("is the highest level bug until the player picks one", () => {
    const state = stateWith(["typobit", 5], ["nullit", 12]);
    const [low, high] = state.team as [string, string];
    expect(favoriteBug(state)).toBe(high);
    expect(setFavorite(state, low).ok).toBe(true);
    expect(favoriteBug(state)).toBe(low);
    expect(importSave(exportSave(state)).trainer.favoriteUid).toBe(low);
    expect(setFavorite(state, "nope").ok).toBe(false);
    delete state.bugs[low];
    expect(favoriteBug(state)).toBe(high);
  });
});
