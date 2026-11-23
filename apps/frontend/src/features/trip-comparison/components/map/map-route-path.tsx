import type { LineEmphasis } from '@/components/map/map-line';
import { MapRouteStep } from '@/features/trip-comparison/components/map/map-route-step';
import type { DrawnRouteStep } from '@/features/trip-comparison/utils/drawn-route';
import { createNestedId } from '@/utils/nested-id';

export interface MapRoutePathProps {
    id: string;
    // Drawn in order, e.g. a single one for a path with one mode
    steps: DrawnRouteStep[];
    emphasis: LineEmphasis;
    onClick?: () => void;
    onPress?: () => void;
}

export const MapRoutePath = ({
    id: pathId,
    steps,
    emphasis,
    onClick,
    onPress,
}: MapRoutePathProps) => {
    return steps.map((drawnStep, index) => (
        <MapRouteStep
            key={index}
            id={createNestedId(pathId, index)}
            geometry={drawnStep.geometry}
            appearance={drawnStep.appearance}
            emphasis={emphasis}
            onClick={onClick}
            onPress={onPress}
        />
    ));
};
