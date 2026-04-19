import Box from "@mui/material/Box";
import type { SxProps } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import React from "react";

import { wordBackground, wordBorder } from "../../store/colors";
import type { LetterUsage } from "../../store/gameStore";

type TextFieldProps = {
  idx: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  usages: LetterUsage[];
  disabled: boolean;
};

const inputProps = {
  inputMode: "text" as const,
  pattern: "[a-zA-Z]+",
  maxLength: 1,
  style: { textAlign: "center" as const },
  "aria-label": "input",
};

type Anchor = "top" | "right" | "bottom" | "left" | "top-right";
const WORD_ANCHOR: Anchor[] = ["top", "left", "bottom", "right", "top-right"];
const BUBBLE_SIZE = 20;
const BUBBLE_GAP = 2;

function bubbleSx(anchor: Anchor, indexInGroup: number, groupTotal: number): SxProps {
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
      // Fifth word: stack diagonally from top-right corner
      return { top: cornerOff + indexInGroup * step, right: cornerOff };
  }
}

const MyTextField = React.forwardRef<(HTMLDivElement | null)[], TextFieldProps>(
  ({ idx, value, onChange, onKeyDown, usages, disabled }, ref) => {
    const firstWord = usages[0]?.word ?? -1;
    const bg = wordBackground(firstWord);
    const border = wordBorder(firstWord);

    const sx = {
      width: "4em",
      "& .MuiInputBase-root": {
        backgroundColor: bg,
        transition: "background-color 0.25s ease",
      },
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: border,
        borderWidth: border ? 2 : 1,
      },
    };

    // Group usages by word → each word's usages stack along its assigned side
    const byWord = new Map<number, LetterUsage[]>();
    for (const u of usages) {
      const list = byWord.get(u.word) ?? [];
      list.push(u);
      byWord.set(u.word, list);
    }

    return (
      <Box sx={{ position: "relative", zIndex: usages.length > 0 ? 2 : 1 }}>
        <TextField
          sx={sx}
          name={idx}
          ref={(el) => {
            if (ref && "current" in ref && ref.current) {
              ref.current[Number.parseInt(idx, 10)] = el;
            }
          }}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          slotProps={{ htmlInput: inputProps }}
        />
        {[...byWord.entries()].map(([word, group]) => {
          const anchor = WORD_ANCHOR[word % WORD_ANCHOR.length];
          return group.map((u, i) => (
            <Box
              key={`${u.word}-${u.position}`}
              sx={{
                position: "absolute",
                width: BUBBLE_SIZE,
                height: BUBBLE_SIZE,
                borderRadius: "50%",
                backgroundColor: wordBorder(u.word),
                color: "white",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                pointerEvents: "none",
                zIndex: 1,
                ...bubbleSx(anchor, i, group.length),
              }}
            >
              {u.position + 1}
            </Box>
          ));
        })}
      </Box>
    );
  },
);

export default MyTextField;
