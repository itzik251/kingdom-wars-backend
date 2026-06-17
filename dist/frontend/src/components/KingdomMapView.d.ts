interface Props {
    buildings: {
        type: string;
        level: number;
    }[];
    name: string;
    onClose: () => void;
}
export default function KingdomMapView({ buildings, name, onClose }: Props): import("react").JSX.Element;
export {};
