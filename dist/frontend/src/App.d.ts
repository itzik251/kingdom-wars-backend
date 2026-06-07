declare global {
    interface Window {
        Telegram?: any;
    }
}
export default function App(): import("react").JSX.Element;
