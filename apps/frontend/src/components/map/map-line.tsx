import { CaretRightIcon, type Icon } from '@phosphor-icons/react';
import { Layer, Source } from '@vis.gl/react-maplibre';
import type { LineString } from 'geojson';

import { MapIconImage } from '@/components/map/map-icon-image';
import { useLayerHandlers } from '@/hooks/map/use-layer-handlers';
import { useZoomForLength } from '@/hooks/map/use-zoom-for-length';
import { useIsPhone } from '@/hooks/use-is-phone';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useThemeColor } from '@/hooks/use-theme-color';
import { createNestedId } from '@/utils/nested-id';

export interface MapLineStyles {
    /** Dash and gap lengths, in line widths. Solid when omitted. */
    dashArray?: [number, number];
}

export type LineEmphasis = 'default' | 'selected' | 'muted';

export interface MapLineProps {
    id: string;
    geometry: LineString;
    styles: MapLineStyles;
    /** The theme variable of the line's own color. */
    color: `--${string}`;
    /** Shift to the right of the line's direction, in line widths. Negative shifts it left. */
    offset: number;
    /** How much the line stands out from the others. */
    emphasis: LineEmphasis;
    /** Repeated along the line, drawn by the map. */
    icon: Icon;
    onClick?: () => void;
    onPress?: () => void;
}

const lineOpacities: Record<LineEmphasis, number> = {
    default: 0.65,
    selected: 1,
    muted: 0.5,
};

// In pixels, wider on larger screens, where they have more room
const lineWidths = {
    phone: { default: 2.5, selected: 4 },
    larger: { default: 5, selected: 6.5 },
};
// How far the glow of a selected line spreads past it, on each side
const glowSpreadPixels = 4;

const iconSizePixels = 16;
const iconSpacingPixels = 75;
const arrowSizePixels = 12;
const arrowSpacingPixels = 15;

export const MapLine = ({
    id,
    geometry,
    styles,
    color: colorVariable,
    offset,
    emphasis,
    icon,
    onClick,
    onPress,
}: MapLineProps) => {
    const { dashArray } = styles;
    const selected = emphasis === 'selected';
    const color = useThemeColor(
        emphasis === 'muted' ? '--foreground' : colorVariable,
    );
    const widths = useIsPhone() ? lineWidths.phone : lineWidths.larger;
    const width = selected ? widths.selected : widths.default;
    const offsetPixels = offset * width;
    const hitLayerId = createNestedId(id, 'hit');
    useLayerHandlers(hitLayerId, onClick, onPress);
    // A finger needs a wider target than a mouse
    const hitWidth = useMediaQuery('(pointer: coarse)') ? 40 : 16;
    const haloColor = useThemeColor('--background');
    const iconImageId = `${id}-icon-${color}-${haloColor}`;
    const iconRepeatZoom = useZoomForLength(geometry, iconSpacingPixels * 2);
    const arrowImageId = `line-arrow-${color}-${haloColor}`;
    // Default emphasis: in the middle of lines set side by side, so their icons stack into one.
    // Selected or muted: on their own line.
    const symbolOffset: [number, number] =
        emphasis === 'default' ? [0, 0] : [0, offsetPixels];
    const iconLayout = {
        // Hidden rather than removed, so it keeps its place under other layers
        visibility: emphasis === 'muted' ? 'none' : 'visible',
        'icon-image': iconImageId,
        'icon-allow-overlap': true,
        'icon-keep-upright': true,
        'icon-offset': symbolOffset,
    } as const;

    return (
        <>
            <Source id={id} type="geojson" data={geometry}>
                <Layer
                    id={createNestedId(id, 'glow')}
                    type="line"
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                    paint={{
                        'line-color': color,
                        'line-width': width + 2 * glowSpreadPixels,
                        'line-offset': offsetPixels,
                        'line-opacity': selected ? 0.22 : 0,
                    }}
                />
                <Layer
                    id={createNestedId(id, 'line')}
                    type="line"
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                    paint={{
                        'line-color': color,
                        'line-width': width,
                        'line-offset': offsetPixels,
                        'line-opacity': lineOpacities[emphasis],
                        ...(dashArray && { 'line-dasharray': dashArray }),
                    }}
                />
                {/* Wider than the line, so it's easy to click or tap */}
                <Layer
                    id={hitLayerId}
                    type="line"
                    paint={{
                        'line-width': hitWidth,
                        'line-offset': offsetPixels,
                        'line-opacity': 0,
                    }}
                />
                {/* Which way the line goes */}
                <Layer
                    id={createNestedId(id, 'arrows')}
                    type="symbol"
                    layout={{
                        'symbol-placement': 'line',
                        'symbol-spacing': arrowSpacingPixels,
                        'icon-image': arrowImageId,
                        'icon-keep-upright': false,
                        'icon-offset': symbolOffset,
                    }}
                    paint={{ 'icon-opacity': selected ? 1 : 0.5 }}
                />
                {/* Repeated icons start near the line's start, so they'd
                    crowd its start while the line is short on screen */}
                <Layer
                    id={createNestedId(id, 'icon-center')}
                    type="symbol"
                    maxzoom={iconRepeatZoom}
                    layout={{
                        'symbol-placement': 'line-center',
                        ...iconLayout,
                    }}
                />
                <Layer
                    id={createNestedId(id, 'icon')}
                    type="symbol"
                    minzoom={iconRepeatZoom}
                    layout={{
                        'symbol-placement': 'line',
                        'symbol-spacing': iconSpacingPixels,
                        ...iconLayout,
                    }}
                />
            </Source>
            <MapIconImage
                id={iconImageId}
                icon={icon}
                color={color}
                haloColor={haloColor}
                size={iconSizePixels}
            />
            <MapIconImage
                id={arrowImageId}
                icon={CaretRightIcon}
                color={color}
                haloColor={haloColor}
                size={arrowSizePixels}
            />
        </>
    );
};
