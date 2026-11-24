import * as Utils from 'utils';
import { z } from 'zod';

import type { Geocoder, GeocoderOptions, Place, PlaceSearch } from './geocoder';

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
        osm_key: z.string().optional(),
        osm_value: z.string().optional(),
        name: z.string().optional(),
        housenumber: z.string().optional(),
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
    }),
});

type Feature = z.infer<typeof FeatureSchema>;

const FeatureCollectionSchema = z.object({
    features: z.array(FeatureSchema),
});

// Photon's reverse returns only the closest place by default. A few more, in
// case another place with the same tag is at the same point
const reverseLimit = 10;

interface OsmTag {
    key: string;
    value: string;
}

// What a place id tells to find the place again
interface ParsedPlaceId {
    tag: OsmTag;
    position: Utils.LngLat;
}

const createSearchParams = (search: PlaceSearch) => {
    const { text, focus } = search;
    const params = new URLSearchParams({ q: text });
    if (focus) {
        params.set('lon', String(focus.lng));
        params.set('lat', String(focus.lat));
    }
    return params;
};

const createReverseParams = (parsedPlaceId: ParsedPlaceId) => {
    const { tag, position } = parsedPlaceId;
    return new URLSearchParams({
        lon: String(position.lng),
        lat: String(position.lat),
        osm_tag: `${tag.key}:${tag.value}`,
        limit: String(reverseLimit),
    });
};

const createLabel = (properties: Feature['properties']) => {
    const { name, housenumber, street, city, state, country } = properties;
    const address = [housenumber, street].filter(Boolean).join(' ');
    const parts = [name, address, city, state, country].filter(Boolean);
    return [...new Set(parts)].join(', ');
};

// e.g. "W115802108"
const createOsmRef = (feature: Feature) => {
    const { osm_type, osm_id } = feature.properties;
    if (osm_type === undefined || osm_id === undefined) {
        return null;
    }
    return `${osm_type}${osm_id}`;
};

// Photon can't look up a place by its OSM reference, so the id also holds the
// tag and the position to find it with, e.g.
// "amenity=cafe/N4349778993@-73.5707818,45.5092771"
export const createPlaceId = (feature: Feature) => {
    const { geometry, properties } = feature;
    const { osm_key, osm_value } = properties;
    // The postcodes Photon makes up have no OSM reference, but their name is
    // their code, e.g. "place=postcode/H2X 1Y4@-73.5694385,45.5093547"
    const ref = createOsmRef(feature) ?? properties.name;
    if (osm_key === undefined || osm_value === undefined || ref === undefined) {
        return null;
    }
    const [lng, lat] = geometry.coordinates;
    return `${osm_key}=${osm_value}/${ref}@${lng},${lat}`;
};

const tagPattern = /(?<key>[^=/]+)=(?<value>[^/]+)/;
const positionPattern = /(?<lng>[^,@]+),(?<lat>[^,@]+)/;
const placeIdPattern = new RegExp(
    `^${tagPattern.source}/.*@${positionPattern.source}$`,
);

const parsePlaceId = (id: string): ParsedPlaceId | null => {
    const groups = placeIdPattern.exec(id)?.groups;
    if (!groups) {
        return null;
    }
    const { key, value, lng, lat } = groups;
    // Never, only for the types
    if (key === undefined || value === undefined) {
        return null;
    }
    const result = Utils.LngLatSchema.safeParse({
        lng: Number(lng),
        lat: Number(lat),
    });
    return result.success
        ? { tag: { key, value }, position: result.data }
        : null;
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

// The features that are the same place, which becomes one place made of the
// first of them
type FeatureGroup = [Feature, ...Feature[]];

// Photon gives an OSM object once for each of its tags, like a way that is
// both a bridge and a highway. We don't need that distinction. Photon has its
// own dedupe, but their names often differ slightly, so it doesn't catch them.
// https://github.com/komoot/photon/blob/master/docs/api-v1.md#dedupe-results
export const groupFeatures = (features: Feature[]) => {
    const groups = new Map<string | Feature, FeatureGroup>();
    for (const feature of features) {
        // A feature without an OSM reference is alone in its group
        const key = createOsmRef(feature) ?? feature;
        const group = groups.get(key);
        groups.set(key, group ? [...group, feature] : [feature]);
    }
    return [...groups.values()];
};

export class PhotonGeocoder implements Geocoder {
    constructor(
        private readonly url: string,
        private readonly options: GeocoderOptions = {},
    ) {}

    async searchPlaces(search: PlaceSearch): Promise<Place[]> {
        return this.fetchPlaces('api', createSearchParams(search));
    }

    async lookUpPlace(id: string): Promise<Place | null> {
        const parsedId = parsePlaceId(id);
        if (!parsedId) {
            return null;
        }
        // Finds the place among the places with its tag around its position
        const places = await this.fetchPlaces(
            'reverse',
            createReverseParams(parsedId),
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
        const data: unknown = await response.json();
        this.options.onResponse?.(data);
        const { features } = Utils.parseUpstreamResponse(
            FeatureCollectionSchema,
            data,
        );
        return groupFeatures(features)
            .map((group) => {
                const [firstFeature] = group;
                return createPlace(firstFeature);
            })
            .filter((place) => place !== null);
    }
}
