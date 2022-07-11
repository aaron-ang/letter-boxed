var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React from "react";
import { useRef, useState } from "react";
import LetterSquare from "./driver/LetterSquare";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import LinearProgressWithLabel from "./components/LinearProgressWithLabel";
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
        9: "",
        10: "",
        11: "",
    };
    const [fields, setFields] = useState(defaultFields);
    const [solving, setSolving] = useState(false);
    const [words, setWords] = useState([]);
    const [visualize, setVisualize] = useState(false);
    const [progress, setProgress] = React.useState(0);
    const [isSuccess, setIsSuccess] = React.useState(true);
    const inputRefs = useRef([]);
    const inputProps = {
        inputMode: "text",
        pattern: "[a-zA-Z]+",
        maxLength: 1,
        style: {
            textAlign: "center",
        },
    };
    const sx = { width: "4em" };
    const delay = 5;
    const handleChange = (e) => {
        var _a;
        const value = e.target.value.replace(/[^a-z]/gi, "");
        const name = e.target.name;
        setFields(Object.assign(Object.assign({}, fields), { [name]: value.toUpperCase() }));
        const nextInput = inputRefs.current[parseInt(name) + 1];
        if (nextInput != null && value !== "") {
            (_a = nextInput.querySelector("input")) === null || _a === void 0 ? void 0 : _a.focus();
        }
    };
    const handleBackspace = (e) => {
        var _a;
        const target = e.target;
        if (e.key === "Backspace" && target.value === "") {
            const prevInput = inputRefs.current[parseInt(target.name) - 1];
            (_a = prevInput === null || prevInput === void 0 ? void 0 : prevInput.querySelector("input")) === null || _a === void 0 ? void 0 : _a.focus();
        }
    };
    const resetFields = () => {
        setFields(defaultFields);
        setSolving(false);
        setWords([]);
        setProgress(0);
        setIsSuccess(true);
    };
    const isFilled = (fields) => {
        return !Object.values(fields).includes("");
    };
    const groupLetters = (arr) => {
        const res = [];
        let string = "";
        let i = 0;
        while (i < arr.length) {
            for (let j = 0; j < 3; j++) {
                string += arr[i];
                i++;
            }
            res.push(string);
            string = "";
        }
        return res;
    };
    const showProgress = (progressArr) => __awaiter(this, void 0, void 0, function* () {
        setProgress(0);
        if (progressArr.at(-1)[0] === "fail") {
            setIsSuccess(false);
        }
        else {
            setIsSuccess(true);
        }
        if (visualize) {
            for (const state of progressArr.slice(0, -1)) {
                setWords(state);
                setProgress((prevState) => prevState + (1 / progressArr.length) * 100);
                yield new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        else {
            setWords(progressArr.at(-2));
        }
        setSolving(false);
    });
    const handleClick = () => {
        if (isFilled(fields)) {
            setSolving(true);
            const input = groupLetters(Object.values(fields));
            console.log(`input: ${input}`);
            try {
                const progress = new LetterSquare(input).solve();
                console.log(progress.at(-1));
                showProgress(progress);
            }
            catch (err) {
                console.error(err);
            }
        }
    };
    const handleCBChange = () => {
        setVisualize((prevState) => !prevState);
    };
    return (React.createElement(Box, { sx: {
            height: "100vh",
            backgroundColor: "#fdbcb4",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
        } },
        React.createElement(Stack, { direction: "row", spacing: 2 }, Object.entries(fields)
            .slice(0, 3)
            .map(([key, value], index) => {
            return (React.createElement(TextField, { sx: sx, key: key, inputProps: inputProps, name: key, ref: (el) => (inputRefs.current[index] = el), value: value, onChange: handleChange, onKeyDown: handleBackspace, disabled: solving }));
        })),
        React.createElement(Grid, { container: true, justifyContent: "center", spacing: 30 },
            React.createElement(Grid, { item: true },
                React.createElement(Stack, { direction: "column", spacing: 2 }, Object.entries(fields)
                    .slice(3, 6)
                    .map(([key, value], index) => {
                    return (React.createElement(TextField, { sx: sx, key: key, inputProps: inputProps, name: key, ref: (el) => (inputRefs.current[index + 3] = el), value: value, onChange: handleChange, onKeyDown: handleBackspace, disabled: solving }));
                }))),
            React.createElement(Grid, { item: true },
                React.createElement(Stack, { direction: "column", spacing: 2 }, Object.entries(fields)
                    .slice(6, 9)
                    .map(([key, value], index) => {
                    return (React.createElement(TextField, { sx: sx, key: key, inputProps: inputProps, name: key, ref: (el) => (inputRefs.current[index + 6] = el), value: value, onChange: handleChange, onKeyDown: handleBackspace, disabled: solving }));
                })))),
        React.createElement(Stack, { direction: "row", spacing: 2 }, Object.entries(fields)
            .slice(9)
            .map(([key, value], index) => {
            return (React.createElement(TextField, { sx: sx, key: key, inputProps: inputProps, name: key, ref: (el) => (inputRefs.current[index + 9] = el), value: value, onChange: handleChange, onKeyDown: handleBackspace, disabled: solving }));
        })),
        React.createElement(Stack, { direction: "row", spacing: 2, margin: 2 },
            React.createElement(Button, { color: "error", variant: "contained", onClick: resetFields }, "Reset"),
            React.createElement(LoadingButton, { loading: solving, variant: "contained", onClick: handleClick }, "Solve"),
            React.createElement(FormControlLabel, { control: React.createElement(Checkbox, { checked: visualize, onChange: handleCBChange }), label: "Visualize" })),
        React.createElement(LinearProgressWithLabel, { value: progress }),
        React.createElement(React.Fragment, null, words === null || words === void 0 ? void 0 :
            words.map((word, index) => (React.createElement("p", { key: index }, word))),
            !solving && !isSuccess && (React.createElement("h1", null,
                "No solution found using up to ",
                LetterSquare.MOST_WORDS,
                " words")))));
}
export default App;
