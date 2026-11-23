import { distance } from '@turf/turf';
import type * as Utils from 'utils';

export const createPointFeature = ({ lng, lat }: Utils.LngLat) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [lng, lat] },
});

export const calculateDistanceMeters = (a: Utils.LngLat, b: Utils.LngLat) =>
    distance([a.lng, a.lat], [b.lng, b.lat], { units: 'meters' });
