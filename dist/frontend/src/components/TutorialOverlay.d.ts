export declare function useTutorial(): {
    show: boolean;
    done: () => void;
};
export default function TutorialOverlay({ onDone }: {
    onDone: () => void;
}): import("react").JSX.Element;
