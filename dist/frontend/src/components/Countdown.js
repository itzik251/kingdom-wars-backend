"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Countdown;
const useCountdown_1 = require("../hooks/useCountdown");
function Countdown({ endsAt, prefix = '', onEnd }) {
    const display = (0, useCountdown_1.useCountdown)(endsAt, onEnd);
    if (!display)
        return null;
    return <>{prefix}{display}</>;
}
//# sourceMappingURL=Countdown.js.map