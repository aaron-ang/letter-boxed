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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
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
const FormControlLabel_1 = __importDefault(require("@mui/material/FormControlLabel"));
const Checkbox_1 = __importDefault(require("@mui/material/Checkbox"));
const LinearProgressWithLabel_1 = __importDefault(require("./components/LinearProgressWithLabel"));
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
    const [fields, setFields] = (0, react_1.useState)(defaultFields);
    const [solving, setSolving] = (0, react_1.useState)(false);
    const [words, setWords] = (0, react_1.useState)([]);
    const [visualize, setVisualize] = (0, react_1.useState)(false);
    const [progress, setProgress] = react_1.default.useState(0);
    const inputRefs = (0, react_1.useRef)([]);
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
        if (visualize) {
            for (const state of progressArr) {
                setWords(state);
                setProgress((prevState) => prevState + (1 / progressArr.length) * 100);
                yield new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        else {
            setWords(progressArr.at(-1));
        }
        setProgress(100);
        setSolving(false);
    });
    const handleClick = () => {
        if (isFilled(fields)) {
            setSolving(true);
            const input = groupLetters(Object.values(fields));
            try {
                const progress = new LetterSquare_1.default(input).solve();
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
    const isSuccess = (words) => {
        // if array is filled, all words must be full words
        if (words.length >= LetterSquare_1.default.MOST_WORDS) {
            return words.every((word) => LetterSquare_1.default.dictionary.hasFullWord(word));
        }
        return true;
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(Stack_1.default, { direction: "row", spacing: 2 }, Object.entries(fields).map(([key, value], index) => {
            return (react_1.default.createElement(TextField_1.default, { sx: { width: "5em" }, key: key, inputProps: {
                    inputMode: "text",
                    pattern: "[a-zA-Z]+",
                    maxLength: 1,
                }, name: key, ref: (el) => (inputRefs.current[index] = el), value: value, onChange: handleChange, onKeyDown: handleBackspace, disabled: solving }));
        })),
        react_1.default.createElement(LoadingButton_1.default, { loading: solving, variant: "outlined", onClick: handleClick }, "Solve"),
        react_1.default.createElement(Button_1.default, { color: "error", variant: "outlined", onClick: resetFields }, "Reset"),
        react_1.default.createElement(FormControlLabel_1.default, { control: react_1.default.createElement(Checkbox_1.default, { checked: visualize, onChange: handleCBChange }), label: "Visualize" }),
        react_1.default.createElement(LinearProgressWithLabel_1.default, { value: progress }),
        words.map((word, index) => (react_1.default.createElement("p", { key: index }, word))),
        !solving && words.length > 0 && !isSuccess(words) && (react_1.default.createElement("h1", null,
            "No solution found using up to ",
            LetterSquare_1.default.MOST_WORDS,
            " words"))));
}
exports.default = App;
