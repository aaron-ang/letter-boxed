import React, { MutableRefObject } from "react";
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
      inputProps={inputProps}
      name={idx}
      ref={(el) =>
        ((ref as MutableRefObject<(HTMLDivElement | null)[]>).current[
          parseInt(idx)
        ] = el)
      }
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      focused={focused}
      disabled={disabled}
    />
  )
);
export default MyTextField;
