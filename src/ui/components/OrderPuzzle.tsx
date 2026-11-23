import { useMemo, useState } from "react";
import { createSeededRng, hashString } from "../../game/rng";
import { LEARN_UI } from "../../i18n/learning.ptBR";
import { Button } from "./primitives";

const O = LEARN_UI.order;

/** Shuffles indexes with a seed, never returning them already in order. */
export function shuffledOrder(count: number, seed: string): number[] {
  const rng = createSeededRng(hashString(seed));
  const order = Array.from({ length: count }, (_, i) => i);
  for (let tries = 0; tries < 5; tries++) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    if (order.some((v, i) => v !== i)) break;
  }
  return order;
}

/**
 * "Put the lines in order": `items` come in the right order and are shown shuffled; clicking one moves it
 * to the answer, clicking it in the answer sends it back. `check` grades the order.
 */
export function OrderPuzzle({
  items,
  seed,
  prompt,
  check,
  onDone,
  mono = true,
}: {
  items: readonly string[];
  seed: string;
  prompt: string;
  check: (order: number[]) => boolean;
  onDone: (right: boolean) => void;
  mono?: boolean;
}) {
  const shuffled = useMemo(() => shuffledOrder(items.length, seed), [items.length, seed]);
  const [picked, setPicked] = useState<number[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const left = shuffled.filter((i) => !picked.includes(i));

  return (
    <div className="order-puzzle">
      <p className="small">{prompt}</p>
      <ol className={`order-answer ${mono ? "mono" : ""} ${result === null ? "" : result ? "right" : "wrong"}`}>
        {picked.map((i) => (
          <li key={i}>
            <button type="button" disabled={result !== null} onClick={() => setPicked((p) => p.filter((x) => x !== i))}>
              {items[i]}
            </button>
          </li>
        ))}
        {picked.length === 0 && <li className="muted small">{O.empty}</li>}
      </ol>
      <div className={`order-pool ${mono ? "mono" : ""}`}>
        {left.map((i) => (
          <button key={i} type="button" className="order-piece" disabled={result !== null} onClick={() => setPicked((p) => [...p, i])}>
            {items[i]}
          </button>
        ))}
      </div>
      {result === null ? (
        <Button
          variant="gold"
          disabled={left.length > 0}
          onClick={() => {
            const right = check(picked);
            setResult(right);
            onDone(right);
          }}
        >
          {O.check}
        </Button>
      ) : (
        <>
          <p className={result ? "ok-text" : "bad-text"}>{result ? O.right : O.wrong}</p>
          {!result && (
            <ol className={`order-answer right ${mono ? "mono" : ""}`}>
              {items.map((text, i) => (
                <li key={i}>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
