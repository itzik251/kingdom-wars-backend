export default function Countdown({ endsAt, prefix, onEnd }: {
    endsAt: string | null | undefined;
    prefix?: string;
    onEnd?: () => void;
}): import("react").JSX.Element;
