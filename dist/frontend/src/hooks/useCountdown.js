"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCountdown = useCountdown;
const react_1 = require("react");
const format_1 = require("../utils/format");
function useCountdown(endsAt, onEnd) {
    const [display, setDisplay] = (0, react_1.useState)(() => (0, format_1.timeLeft)(endsAt ?? null));
    (0, react_1.useEffect)(() => {
        if (!endsAt) {
            setDisplay('');
            return;
        }
        setDisplay((0, format_1.timeLeft)(endsAt));
        const id = setInterval(() => {
            const t = (0, format_1.timeLeft)(endsAt);
            setDisplay(t);
            if (!t && onEnd) {
                clearInterval(id);
                onEnd();
            }
        }, 1000);
        return () => clearInterval(id);
    }, [endsAt]);
    return display;
}
//# sourceMappingURL=useCountdown.js.map