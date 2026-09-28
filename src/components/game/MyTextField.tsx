import type React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { wordBackground, wordBorder } from "@/store/colors";
import type { LetterUsage } from "@/store/gameStore";

type TextFieldProps = {
  idx: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  usages: LetterUsage[];
  disabled: boolean;
  inputRefs: React.RefObject<Array<HTMLInputElement | null>>;
};

type Anchor = "top" | "right" | "bottom" | "left" | "top-right";
const WORD_ANCHOR: Anchor[] = ["top", "left", "bottom", "right", "top-right"];
// Bubble size and gap are Tailwind spacing tokens, set as CSS vars on the cell wrapper
const STEP = "(var(--bubble) + var(--bubble-gap))";
const EDGE_OFFSET = "calc(var(--bubble) / -2 - var(--bubble-gap))";

function bubbleStyle(
  anchor: Anchor,
  indexInGroup: number,
  groupTotal: number,
): React.CSSProperties {
  const centerOffset = indexInGroup - (groupTotal - 1) / 2;
  const axisAlign = `calc(50% - var(--bubble) / 2 + ${centerOffset} * ${STEP})`;
  switch (anchor) {
    case "top":
      return { top: EDGE_OFFSET, left: axisAlign };
    case "right":
      return { right: EDGE_OFFSET, top: axisAlign };
    case "bottom":
      return { bottom: EDGE_OFFSET, left: axisAlign };
    case "left":
      return { left: EDGE_OFFSET, top: axisAlign };
    case "top-right":
      return { top: `calc(${EDGE_OFFSET} + ${indexInGroup} * ${STEP})`, right: EDGE_OFFSET };
  }
}

export default function MyTextField({
  idx,
  value,
  onChange,
  onKeyDown,
  usages,
  disabled,
  inputRefs,
}: TextFieldProps) {
  const firstWord = usages[0]?.word ?? -1;
  const bg = wordBackground(firstWord);
  const border = wordBorder(firstWord);

  // Group usages by word → each word's usages stack along its assigned side
  const byWord = new Map<number, LetterUsage[]>();
  for (const u of usages) {
    const list = byWord.get(u.word) ?? [];
    list.push(u);
    byWord.set(u.word, list);
  }

  return (
    <div
      className={cn(
        "relative [--bubble-gap:--spacing(0.5)] [--bubble:--spacing(5)]",
        usages.length > 0 ? "z-2" : "z-1",
      )}
    >
      <Input
        name={idx}
        ref={(el) => {
          inputRefs.current[Number.parseInt(idx, 10)] = el;
        }}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        inputMode="text"
        pattern="[a-zA-Z]+"
        maxLength={1}
        aria-label="input"
        className="size-(--cell) rounded-full border-2 border-ink bg-card text-center font-semibold text-ink text-lg transition-colors lg:text-xl duration-300 disabled:bg-card disabled:opacity-100"
        style={bg ? { backgroundColor: bg, borderColor: border } : undefined}
      />
      {[...byWord.entries()].map(([word, group]) => {
        const anchor = WORD_ANCHOR[word % WORD_ANCHOR.length];
        return group.map((u, i) => (
          <div
            key={`${u.word}-${u.position}`}
            className="pointer-events-none absolute z-1 flex size-(--bubble) items-center justify-center rounded-full font-bold text-white text-xs shadow-sm"
            style={{
              backgroundColor: wordBorder(u.word),
              ...bubbleStyle(anchor, i, group.length),
            }}
          >
            {u.position + 1}
          </div>
        ));
      })}
    </div>
  );
}
