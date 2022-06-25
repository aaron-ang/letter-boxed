import React, { useState } from "react";
import "./App.css";
import LetterSquare from "./driver/LetterSquare";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import LoadingButton from "@mui/lab/LoadingButton";
function App() {
    const defaultFields = {
        0: "",
        1: "",
        2: "",
        3: "",
        4: "",
        5: "",
        6: "",
        7: "",
        8: "",
    };
    const [fields, setFields] = useState(defaultFields);
    const [solving, setSolving] = useState(false);
    const handleChange = (e) => {
        setFields({ ...fields, [e.target.name]: e.target.value.toUpperCase() });
    };
    const isValid = (c) => {
        return !c || c.toLowerCase() !== c.toUpperCase();
    };
    const isFilled = (fields) => {
        return !Object.values(fields).includes("");
    };
    const handleClick = () => {
        isFilled(fields) && setSolving(true);
    };
    return (React.createElement(React.Fragment, null,
        React.createElement(Stack, { direction: "row", spacing: 2 }, Object.entries(fields).map(([key, value]) => {
            return (React.createElement(TextField, { sx: { width: "5em" }, key: key, inputProps: {
                    inputMode: "text",
                    pattern: "[a-zA-Z]+",
                    maxLength: 1,
                }, name: key, value: value, onChange: handleChange, disabled: solving, error: !isValid(value), helperText: !isValid(value) ? "Only alphabets allowed." : "" }));
        })),
        React.createElement(LoadingButton, { loading: solving, variant: "outlined", onClick: handleClick }, "Solve"),
        React.createElement("h1", null,
            "No solution found using up to ",
            LetterSquare.MOST_WORDS,
            " words")));
}
export default App;
