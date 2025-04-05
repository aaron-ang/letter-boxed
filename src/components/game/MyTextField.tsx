import React from "react";
import { TextField } from "@mui/material";

type TextFieldProps = {
  idx: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  sequencePosition: number;
  disabled: boolean;
};

const inputProps = {
  inputMode: "text" as "text",
  pattern: "[a-zA-Z]+",
  maxLength: 1,
  style: {
    textAlign: "center" as "center",
  },
  "aria-label": "input",
};

const getHighlightColor = (position: number) => {
  if (position === -1) return undefined; // Not in sequence

  const startColor = 170;
  const endColor = 240;
  const colorStep = (endColor - startColor) / 12;

  const hue = startColor + position * colorStep;
  const saturation = 90;
  const lightness = 50 + Math.min(30, position * 2.5);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const MyTextField = React.forwardRef<(HTMLDivElement | null)[], TextFieldProps>(
  ({ idx, value, onChange, onKeyDown, sequencePosition, disabled }, ref) => {
    const sx = {
      width: "4em",
      "& .MuiInputBase-root": {
        backgroundColor: getHighlightColor(sequencePosition),
        transition: "background-color 0.3s ease",
      },
    };

    return (
      <TextField
        sx={sx}
        name={idx}
        ref={(el) => {
          if (ref && "current" in ref && ref.current) {
            ref.current[parseInt(idx)] = el;
          }
        }}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        slotProps={{
          htmlInput: inputProps,
        }}
      />
    );
  }
);

export default MyTextField;
