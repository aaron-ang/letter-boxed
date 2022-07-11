import React from "react";
import { TextField } from "@mui/material";
const MyTextField = ({ sx, key, name, ref, value, onChange, onKeyDown, disabled, }) => (React.createElement(TextField, { sx: sx, key: key, inputProps: {
        inputMode: "text",
        pattern: "[a-zA-Z]+",
        maxLength: 1,
    }, name: name, ref: ref, value: value, onChange: onChange, onKeyDown: onKeyDown, disabled: disabled }));
export default MyTextField;
