import { useMap } from '@vis.gl/react-maplibre';
import type { Map as MaplibreMap, MapEventType } from 'maplibre-gl';
import { useCallback, useSyncExternalStore } from 'react';

/**
 * Reads a value from the map, and reads it again on each `event`.
 *
 * @param read - Gives text or `undefined`, so an unchanged value is equal and doesn't redraw.
 */
export const useMapSnapshot = <T extends string | undefined>(
    event: keyof MapEventType,
    read: (map: MaplibreMap) => T,
): T => {
    const { current: mapRef } = useMap();
    if (!mapRef) {
        throw new Error('useMapSnapshot must be used within a Map');
    }
    const map = mapRef.getMap();
    const subscribe = useCallback(
        (onChange: () => void) => {
            map.on(event, onChange);
            return () => {
                map.off(event, onChange);
            };
        },
        [map, event],
    );
    return useSyncExternalStore(subscribe, () => read(map));
};
