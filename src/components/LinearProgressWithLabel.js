"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const LinearProgress_1 = __importDefault(require("@mui/material/LinearProgress"));
const Typography_1 = __importDefault(require("@mui/material/Typography"));
const Box_1 = __importDefault(require("@mui/material/Box"));
function LinearProgressWithLabel(props) {
    return (react_1.default.createElement(Box_1.default, { sx: { display: "flex", alignItems: "center" } },
        react_1.default.createElement(Box_1.default, { sx: { width: "100%", mr: 1 } },
            react_1.default.createElement(LinearProgress_1.default, Object.assign({ variant: "determinate" }, props))),
        react_1.default.createElement(Box_1.default, { sx: { minWidth: 35 } },
            react_1.default.createElement(Typography_1.default, { variant: "body2", color: "text.secondary" }, `${Math.round(props.value)}%`))));
}
exports.default = LinearProgressWithLabel;
