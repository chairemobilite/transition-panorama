import { Utils } from 'common';
import { z } from 'zod';
import type { Geocoder, Place, PlaceSearch } from './geocoder';

// Photon's answers, with only the fields we use
// https://github.com/komoot/photon#search-and-geocoding-api

export const FeatureSchema = z.object({
    geometry: z.object({
        coordinates: z.tuple([z.number(), z.number()]),
    }),
    properties: z.object({
        // Only the features we use
        osm_type: z.string().optional(),
        osm_id: z.number().optional(),
        name: z.string().optional(),
        housenumber: z.string().optional(),
        street: z.string().optional(),
        city: z.string().optional(),
    }),
});

type Feature = z.infer<typeof FeatureSchema>;

const FeatureCollectionSchema = z.object({
    features: z.array(FeatureSchema),
});

// Photon's reverse returns only the closest place by default, which can be
// another place at the same point, like a shop and the building it's in
const reverseLimit = 10;

const createSearchParams = (search: PlaceSearch) => {
    const { text, focus } = search;
    const params = new URLSearchParams({ q: text });
    if (focus) {
        params.set('lon', String(focus.lng));
        params.set('lat', String(focus.lat));
    }
    return params;
};

const createReverseParams = (position: Utils.LngLat) => {
    return new URLSearchParams({
        lon: String(position.lng),
        lat: String(position.lat),
        limit: String(reverseLimit),
    });
};

// Photon has no label, so it's made like Pelias' "name, address, city"
const createLabel = (properties: Feature['properties']) => {
    const { name, housenumber, street, city } = properties;
    const address = [housenumber, street].filter(Boolean).join(' ');
    return [name, address, city].filter(Boolean).join(', ');
};

// Photon can't look up a place by its OSM type and id, so the id also holds
// the position to find it around, e.g. "W115802108@-73.5674277,45.5004189"
export const createPlaceId = (feature: Feature) => {
    const { geometry, properties } = feature;
    if (properties.osm_type === undefined || properties.osm_id === undefined) {
        return null;
    }
    const [lng, lat] = geometry.coordinates;
    return `${properties.osm_type}${properties.osm_id}@${lng},${lat}`;
};

const placeIdPositionPattern = /@([^,@]+),([^,@]+)$/;

const parsePlaceIdPosition = (id: string): Utils.LngLat | null => {
    const match = placeIdPositionPattern.exec(id);
    if (!match) {
        return null;
    }
    const [, lng, lat] = match;
    const result = Utils.LngLatSchema.safeParse({
        lng: Number(lng),
        lat: Number(lat),
    });
    return result.success ? result.data : null;
};

const createPlace = (feature: Feature): Place | null => {
    const { geometry, properties } = feature;
    const id = createPlaceId(feature);
    if (id === null) {
        return null;
    }
    return {
        id,
        label: createLabel(properties),
        position: {
            lng: geometry.coordinates[0],
            lat: geometry.coordinates[1],
        },
    };
};

export class PhotonGeocoder implements Geocoder {
    constructor(private readonly url: string) {}

    async searchPlaces(search: PlaceSearch): Promise<Place[]> {
        return this.fetchPlaces('api', createSearchParams(search));
    }

    async lookUpPlace(id: string): Promise<Place | null> {
        const position = parsePlaceIdPosition(id);
        if (!position) {
            return null;
        }
        // Finds the place among the places around the position in its id
        const places = await this.fetchPlaces(
            'reverse',
            createReverseParams(position),
        );
        return places.find((place) => place.id === id) ?? null;
    }

    private async fetchPlaces(path: string, params: URLSearchParams) {
        const response = await Utils.fetchUpstream(() =>
            fetch(`${this.url}/${path}?${params.toString()}`),
        );
        if (!response.ok) {
            throw new Utils.HttpUpstreamError({
                status: response.status,
                data: await response.text(),
            });
        }
        const { features } = Utils.parseUpstreamResponse(
            FeatureCollectionSchema,
            await response.json(),
        );
        return (
            features
                .map(createPlace)
                .filter((place) => place !== null)
                // Photon gives results with the same OSM type, OSM id and
                // position. They're physically the same thing, but one would
                // be a bridge and the other a highway, for example. We don't
                // need that distinction. Photon has its own dedupe, but their
                // names often differ slightly, so it doesn't catch them.
                // https://github.com/komoot/photon/blob/master/docs/api-v1.md#dedupe-results
                .filter(
                    (place, index, places) =>
                        places.findIndex((other) => other.id === place.id) ===
                        index,
                )
        );
    }
}
