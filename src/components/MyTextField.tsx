import React from "react";
import { TextField } from "@mui/material";

type TextFieldProps = {
  sx: any;
  key: string;
  name: string;
  ref: (el: HTMLDivElement | null) => HTMLDivElement | null;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
};

const MyTextField: React.FC<TextFieldProps> = ({
  sx,
  key,
  name,
  ref,
  value,
  onChange,
  onKeyDown,
  disabled,
}) => (
  <TextField
    sx={sx}
    key={key}
    inputProps={{
      inputMode: "text",
      pattern: "[a-zA-Z]+",
      maxLength: 1,
    }}
    name={name}
    ref={ref}
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
    disabled={disabled}
  />
);
export default MyTextField;
