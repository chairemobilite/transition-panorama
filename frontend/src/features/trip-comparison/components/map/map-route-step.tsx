import type { LineString } from 'geojson';

import { MapLine, type LineEmphasis } from '@/components/map/map-line';
import type { RouteStepAppearance } from '@/features/trip-comparison/utils/drawn-route';

export interface MapRouteStepProps {
    id: string;
    geometry: LineString;
    appearance: RouteStepAppearance;
    emphasis: LineEmphasis;
    onClick?: () => void;
    onPress?: () => void;
}

export const MapRouteStep = ({
    id,
    geometry,
    appearance,
    emphasis,
    onClick,
    onPress,
}: MapRouteStepProps) => {
    const { icon, color, dashArray } = appearance;
    return (
        <MapLine
            id={id}
            geometry={geometry}
            styles={{ dashArray }}
            color={color}
            emphasis={emphasis}
            icon={icon}
            onClick={onClick}
            onPress={onPress}
        />
    );
};
