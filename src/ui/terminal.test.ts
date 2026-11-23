import { registerCaught } from "../game/bugdex";
import { stateWith } from "../game/testUtils";
import { complete, promptPath, runCommand } from "./terminal";

const ctx = { history: ["ls", "status"], now: new Date("2026-11-22T12:00:00Z") };
const run = (state: ReturnType<typeof stateWith>, line: string) => runCommand(state, line, ctx).lines;

describe("terminal", () => {
  it("lists commands and explains one", () => {
    const state = stateWith(["leaklet", 5]);
    expect(run(state, "help").length).toBeGreaterThan(15);
    expect(run(state, "help cd")[0]).toContain("cd <rota>");
    expect(run(state, "xyz")[0]).toContain("comando não encontrado");
  });

  it("shows where you are, who you are and the status", () => {
    const state = stateWith(["leaklet", 5]);
    expect(promptPath(state)).toBe("/localhost/port-3000");
    expect(run(state, "pwd")).toEqual(["/localhost/port-3000"]);
    expect(run(state, "whoami")[0]).toContain("Hunter");
    expect(run(state, "status").join("\n")).toContain("procurando bugs");
  });

  it("lists the team, items, routes and stones", () => {
    const state = stateWith(["leaklet", 5], ["nullit", 7]);
    expect(run(state, "ls")).toHaveLength(2);
    expect(run(state, "ls items").join("\n")).toContain("breakpoint");
    expect(run(state, "ls routes").find((l) => l.includes("node-modules"))?.startsWith("#")).toBe(true);
    expect(run(state, "ls stones")).toHaveLength(8);
    expect(run(state, "ls nope")[0]).toContain("uso:");
  });

  it("moves between unlocked routes with cd", () => {
    const state = stateWith(["leaklet", 5]);
    expect(run(state, "cd node-modules")[0]).toContain("bloqueada");
    state.unlockedRoutes.push("node-modules");
    expect(run(state, "cd /localhost/node-modules")[0]).toContain("/localhost/node-modules");
    expect(state.activity).toEqual({ kind: "route", routeId: "node-modules" });
    expect(run(state, "cd mars")[0]).toContain("não encontrado");
  });

  it("changes capture settings, buys and uses items", () => {
    const state = stateWith(["leaklet", 5]);
    run(state, "catch all");
    expect(state.settings.captureMode).toBe("all");
    run(state, "trap watchpoint");
    expect(state.settings.preferredTrap).toBe("watchpoint");
    state.coins = 100;
    expect(run(state, "buy coffee 2")[0]).toContain("2x");
    expect(state.inventory.coffee).toBe(7);
    state.bugs[state.team[0]!]!.currentHp = 1;
    expect(run(state, "use coffee 1")[0]).toContain("Café");
    expect(run(state, "buy coffee 999")[0]).toBe("Moedas insuficientes.");
  });

  it("man shows the code and the fix only after the capture", () => {
    const state = stateWith(["leaklet", 5]);
    expect(run(state, "man nullit")[0]).toContain("capture");
    registerCaught(state, "nullit", false);
    const out = run(state, "man Nullit");
    expect(out.some((l) => l.startsWith("-") && l.includes("user.name"))).toBe(true);
    expect(out.some((l) => l.startsWith("+") && l.includes("user?.name"))).toBe(true);
  });

  it("shows rules as code and toggles them", () => {
    const state = stateWith(["leaklet", 5]);
    expect(run(state, "rules").some((l) => l.startsWith("if ("))).toBe(true);
    run(state, "rules on");
    expect(state.settings.useRules).toBe(true);
  });

  it("starts guild raids and refuses bad ones", () => {
    const state = stateWith(["leaklet", 5]);
    expect(run(state, "raid sortGrades bubbleSort")[0]).toContain("Bubble Sort");
    expect(state.guild.raid?.raidId).toBe("sortGrades");
    expect(run(state, "raid sortGrades bubbleSort")[0]).toBe("Já há uma missão em andamento.");
  });

  it("clears, echoes, keeps history and has a sense of humor", () => {
    const state = stateWith(["leaklet", 5]);
    expect(runCommand(state, "clear", ctx).clear).toBe(true);
    expect(run(state, "echo ola mundo")).toEqual(["ola mundo"]);
    expect(run(state, "history")).toHaveLength(2);
    expect(run(state, "sudo rm -rf /")[0]).toContain("permissão negada");
  });

  it("completes commands and arguments with Tab", () => {
    const state = stateWith(["leaklet", 5]);
    expect(complete(state, "sta")).toBe("status ");
    expect(complete(state, "cd port")).toBe("cd port-3000 ");
    expect(complete(state, "c")).toBe("c");
  });
});

describe("terminal levels: pipes, text tools and scripts", () => {
  /** A box with two memory bugs (one shiny) and a logic bug. */
  function boxState(badges: number) {
    const state = stateWith(["typobit", 5], ["leaklet", 6], ["leaklet", 7], ["nullit", 8]);
    state.team = [state.team[0]!];
    const leaklets = Object.values(state.bugs).filter((b) => b.speciesId === "leaklet");
    leaklets[0]!.shiny = true;
    state.badges = ["badge-localhost", "badge-staging", "badge-production"].slice(0, badges);
    return state;
  }

  it("pipes and grep are locked until the first badge", () => {
    expect(run(boxState(0), "ls box | grep shiny")[0]).toContain("bloqueado");
    expect(run(boxState(1), "ls box | grep shiny")).toHaveLength(1);
    expect(run(boxState(1), "grep shiny")[0]).toContain("ls box | grep");
  });

  it("grep matches, ignores case with -i and inverts with -v", () => {
    const state = boxState(1);
    expect(run(state, "ls box | grep memory")).toHaveLength(2);
    expect(run(state, "ls box | grep -i LEAKLET")).toHaveLength(2);
    expect(run(state, "ls box | grep -v memory")).toHaveLength(1);
  });

  it("text tools need two badges and chain after grep", () => {
    expect(run(boxState(1), "ls box | wc -l")[0]).toContain("bloqueado");
    const state = boxState(2);
    expect(run(state, "ls box | grep memory | wc -l")).toEqual(["2"]);
    expect(run(state, "ls box | head 1")).toHaveLength(1);
    expect(run(state, "ls box | sort")[0]).toContain("Leaklet");
  });

  it("scripts with ; and && need three badges", () => {
    expect(run(boxState(2), "pwd; whoami")[0]).toContain("bloqueado");
    expect(run(boxState(3), "pwd; whoami")).toEqual(["/localhost/port-3000", "Hunter (caçador nível 1)"]);
    expect(run(boxState(3), "levels").join(" ")).toContain("[x] scripts");
  });
});

