import type React from "react";

import { Input } from "@/components/ui/input";
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
const BUBBLE_SIZE = 20;
const BUBBLE_GAP = 2;

function bubbleStyle(
  anchor: Anchor,
  indexInGroup: number,
  groupTotal: number,
): React.CSSProperties {
  const step = BUBBLE_SIZE + BUBBLE_GAP;
  const centerOffset = (indexInGroup - (groupTotal - 1) / 2) * step;
  const axisAlign = `calc(50% - ${BUBBLE_SIZE / 2}px + ${centerOffset}px)`;
  const perpOff = -BUBBLE_SIZE / 2 - 2;
  const cornerOff = -BUBBLE_SIZE / 2 - 2;
  switch (anchor) {
    case "top":
      return { top: perpOff, left: axisAlign };
    case "right":
      return { right: perpOff, top: axisAlign };
    case "bottom":
      return { bottom: perpOff, left: axisAlign };
    case "left":
      return { left: perpOff, top: axisAlign };
    case "top-right":
      return { top: cornerOff + indexInGroup * step, right: cornerOff };
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
    <div className="relative" style={{ zIndex: usages.length > 0 ? 2 : 1 }}>
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
        className="h-14 w-16 text-center font-semibold text-base"
        style={{
          backgroundColor: bg,
          borderColor: border,
          borderWidth: border ? 2 : 1,
          transition: "background-color 0.25s ease",
        }}
      />
      {[...byWord.entries()].map(([word, group]) => {
        const anchor = WORD_ANCHOR[word % WORD_ANCHOR.length];
        return group.map((u, i) => (
          <div
            key={`${u.word}-${u.position}`}
            className="pointer-events-none absolute flex items-center justify-center rounded-full font-bold text-white"
            style={{
              width: BUBBLE_SIZE,
              height: BUBBLE_SIZE,
              backgroundColor: wordBorder(u.word),
              fontSize: 11,
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              zIndex: 1,
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
