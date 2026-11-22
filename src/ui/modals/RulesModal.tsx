import { itemsOfCategory, type ItemId } from "../../game/data/items";
import { defaultRules, MAX_RULES, ruleAsCode, type Action, type Condition, type ConditionKind, type Rule } from "../../game/rules";
import type { GameState } from "../../game/state";
import { ITEM_TEXT } from "../../i18n/ptBR";
import { LEARN_UI } from "../../i18n/learning.ptBR";
import { useApp } from "../appContext";
import { Button, Modal, Toggle } from "../components/primitives";
import { store, useGame } from "../store";

const R = LEARN_UI.rules;
const KINDS = Object.keys(R.conditions) as ConditionKind[];
const NEEDS_VALUE: Partial<Record<ConditionKind, number>> = { hpBelow: 40, wildLevelAtLeast: 10 };

function edit(mutate: (rules: Rule[], state: GameState) => void) {
  store.update((s) => mutate(s.rules, s));
}

function ConditionChip({ rule, index, condition }: { rule: Rule; index: number; condition: Condition }) {
  const setCondition = (patch: Partial<Condition>) =>
    edit((rules) => {
      const target = rules.find((r) => r.id === rule.id)!.when[index]!;
      Object.assign(target, patch);
      if (patch.kind) {
        const value = NEEDS_VALUE[patch.kind];
        if (value === undefined) delete target.value;
        else target.value = target.value ?? value;
      }
    });
  return (
    <span className="rule-chip">
      {index > 0 && <strong className="rule-and">{R.and}</strong>}
      <button type="button" className={`rule-not ${condition.not ? "on" : ""}`} onClick={() => setCondition({ not: !condition.not })}>
        {R.not}
      </button>
      <select className="input" value={condition.kind} onChange={(e) => setCondition({ kind: e.target.value as ConditionKind })}>
        {KINDS.map((k) => (
          <option key={k} value={k}>
            {R.conditions[k]}
          </option>
        ))}
      </select>
      {NEEDS_VALUE[condition.kind] !== undefined && (
        <input
          className="input narrow"
          type="number"
          min={1}
          max={100}
          value={condition.value ?? 0}
          onChange={(e) => setCondition({ value: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })}
        />
      )}
      <button type="button" className="rule-x" aria-label={R.remove} onClick={() => edit((rules) => void rules.find((r) => r.id === rule.id)!.when.splice(index, 1))}>
        x
      </button>
    </span>
  );
}

function ActionPicker({ rule }: { rule: Rule }) {
  const traps = itemsOfCategory("trap");
  const setAction = (action: Action) => edit((rules) => void (rules.find((r) => r.id === rule.id)!.then = action));
  return (
    <span className="rule-chip">
      <select
        className="input"
        value={rule.then.kind}
        onChange={(e) => {
          const kind = e.target.value as Action["kind"];
          setAction(kind === "throw" ? { kind, trap: "breakpoint" } : { kind });
        }}
      >
        {(Object.keys(R.actions) as Action["kind"][]).map((k) => (
          <option key={k} value={k}>
            {R.actions[k]}
          </option>
        ))}
      </select>
      {rule.then.kind === "throw" && (
        <select className="input" value={rule.then.trap} onChange={(e) => setAction({ kind: "throw", trap: e.target.value as ItemId })}>
          {traps.map((t) => (
            <option key={t.id} value={t.id}>
              {ITEM_TEXT[t.id].name}
            </option>
          ))}
        </select>
      )}
    </span>
  );
}

export function RulesModal() {
  const state = useGame();
  const { close } = useApp();
  const rules = state.rules;
  const move = (index: number, delta: number) =>
    edit((list) => {
      const [rule] = list.splice(index, 1);
      list.splice(index + delta, 0, rule!);
    });

  return (
    <Modal title={R.title} onClose={close} wide>
      <Toggle checked={state.settings.useRules} onChange={(v) => store.update((s) => void (s.settings.useRules = v))} label={R.useRules} hint={R.useRulesHint} />
      <p className="muted small">{R.intro}</p>
      <div className="rule-list">
        {rules.map((rule, index) => (
          <div key={rule.id} className={`rule-card ${rule.enabled ? "" : "disabled"}`}>
            <div className="rule-head">
              <span className="rule-num">{index + 1}</span>
              <Toggle checked={rule.enabled} onChange={(v) => edit((list) => void (list.find((r) => r.id === rule.id)!.enabled = v))} label="" />
              <div className="rule-tools">
                <Button small variant="dark" disabled={index === 0} onClick={() => move(index, -1)} aria-label={R.up}>
                  ^
                </Button>
                <Button small variant="dark" disabled={index === rules.length - 1} onClick={() => move(index, 1)} aria-label={R.down}>
                  v
                </Button>
                <Button small variant="danger" onClick={() => edit((list) => void list.splice(index, 1))}>
                  {R.remove}
                </Button>
              </div>
            </div>
            <div className="rule-body">
              <strong className="rule-keyword">{R.when}</strong>
              {rule.when.length === 0 && <span className="muted small">{R.empty}</span>}
              {rule.when.map((c, i) => (
                <ConditionChip key={i} rule={rule} index={i} condition={c} />
              ))}
              <Button small variant="dark" onClick={() => edit((list) => void list.find((r) => r.id === rule.id)!.when.push({ kind: "wildNew" }))}>
                {R.addCondition}
              </Button>
            </div>
            <div className="rule-body">
              <strong className="rule-keyword">{R.then}</strong>
              <ActionPicker rule={rule} />
            </div>
            <code className="rule-code" title={R.asCode}>
              {ruleAsCode(rule)}
            </code>
          </div>
        ))}
      </div>
      <div className="button-row wrap">
        <Button
          variant="gold"
          disabled={rules.length >= MAX_RULES}
          onClick={() => edit((list) => void list.push({ id: Math.max(0, ...list.map((r) => r.id)) + 1, enabled: true, when: [{ kind: "wildNew" }], then: { kind: "throw", trap: "breakpoint" } }))}
        >
          {R.addRule}
        </Button>
        <Button variant="dark" onClick={() => store.update((s) => void (s.rules = defaultRules()))}>
          {R.reset}
        </Button>
      </div>
    </Modal>
  );
}
