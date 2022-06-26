"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const LetterSquare_1 = __importDefault(require("./driver/LetterSquare"));
const Stack_1 = __importDefault(require("@mui/material/Stack"));
const TextField_1 = __importDefault(require("@mui/material/TextField"));
const LoadingButton_1 = __importDefault(require("@mui/lab/LoadingButton"));
const Button_1 = __importDefault(require("@mui/material/Button"));
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
    let game;
    const [fields, setFields] = (0, react_1.useState)(defaultFields);
    const [solving, setSolving] = (0, react_1.useState)(false);
    const [words, setWords] = (0, react_1.useState)([]);
    const inputRefs = (0, react_1.useRef)([]);
    const handleChange = (e) => {
        var _a;
        const value = e.target.value;
        const name = e.target.name;
        setFields(Object.assign(Object.assign({}, fields), { [name]: value.toUpperCase() }));
        const nextInput = inputRefs.current[parseInt(name) + 1];
        // console.log(nextInput)
        if (nextInput != null && isValid(value) && value !== "") {
            (_a = nextInput.querySelector("input")) === null || _a === void 0 ? void 0 : _a.focus();
        }
    };
    const handleBackspace = (e) => {
        var _a;
        const name = e.target.name;
        if (e.key === "Backspace") {
            const prevInput = inputRefs.current[parseInt(name) - 1];
            (_a = prevInput === null || prevInput === void 0 ? void 0 : prevInput.querySelector("input")) === null || _a === void 0 ? void 0 : _a.focus();
        }
    };
    const resetFields = () => {
        setFields(defaultFields);
    };
    const isValid = (c) => {
        return !c || c.toLowerCase() !== c.toUpperCase();
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
    const handleClick = () => {
        if (isFilled(fields)) {
            setSolving(true);
            const input = groupLetters(Object.values(fields));
            game = new LetterSquare_1.default(input);
            // console.log(LetterSquare.dictionary.contents)
            setWords(game.words);
            try {
                game.solve();
            }
            catch (err) {
                console.error(err);
            }
            finally {
                setSolving(false);
            }
        }
    };
    const isMaxReached = (words) => {
        const allFullWords = words.every((word) => LetterSquare_1.default.dictionary.hasFullWord(word));
        return words.length === LetterSquare_1.default.MOST_WORDS && !allFullWords;
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(Stack_1.default, { direction: "row", spacing: 2 }, Object.entries(fields).map(([key, value], index) => {
            return (react_1.default.createElement(TextField_1.default, { sx: { width: "5em" }, key: key, inputProps: {
                    inputMode: "text",
                    pattern: "[a-zA-Z]+",
                    maxLength: 1,
                }, name: key, ref: (el) => (inputRefs.current[index] = el), value: value, onChange: handleChange, onKeyDown: handleBackspace, disabled: solving, error: !isValid(value), helperText: !isValid(value) ? "Only alphabets allowed." : "" }));
        })),
        react_1.default.createElement(LoadingButton_1.default, { loading: solving, variant: "outlined", onClick: handleClick }, "Solve"),
        react_1.default.createElement(Button_1.default, { color: "error", variant: "outlined", onClick: resetFields }, "Reset"),
        words.map((word, index) => (react_1.default.createElement("p", { key: index }, word))),
        isMaxReached(words) && (react_1.default.createElement("h1", null,
            "No solution found using up to ",
            LetterSquare_1.default.MOST_WORDS,
            " words"))));
}
exports.default = App;
