import React from "react";
import { TextField } from "@mui/material";

type TextFieldProps = {
  idx: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  focused: boolean;
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
const sx = { width: "4em" };

const MyTextField = React.forwardRef<(HTMLDivElement | null)[], TextFieldProps>(
  ({ idx, value, onChange, onKeyDown, focused, disabled }, ref) => (
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
      focused={focused}
      disabled={disabled}
      slotProps={{
        htmlInput: inputProps,
      }}
    />
  )
);
export default MyTextField;
