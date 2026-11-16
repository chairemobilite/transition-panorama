import { useMapSnapshot } from '@/hooks/map/use-map-snapshot';

interface MapSize {
    width: number;
    height: number;
}

/** The map's size on screen, in pixels. Updated as the map is resized. */
export const useMapSize = (): MapSize => {
    const size = useMapSnapshot('resize', (map) => {
        const container = map.getContainer();
        return `${String(container.clientWidth)} ${String(container.clientHeight)}`;
    });
    const [width = 0, height = 0] = size.split(' ').map(Number);
    return { width, height };
};
