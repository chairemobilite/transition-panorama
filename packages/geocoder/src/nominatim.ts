import * as Utils from 'utils';
import { z } from 'zod';

import type { Geocoder, GeocoderOptions, Place, PlaceSearch } from './geocoder';

// Nominatim's answers, with only the fields we use
// https://nominatim.org/release-docs/latest/api/Search/
// https://nominatim.org/release-docs/latest/api/Lookup/
// https://nominatim.org/release-docs/latest/api/Output/

export const FeatureSchema = z.object({
    geometry: z.object({
        coordinates: z.tuple([z.number(), z.number()]),
    }),
    properties: z.object({
        // The results that aren't OSM objects, like postcodes, have no OSM
        // type and id

        osm_type: z.string().optional(),
        osm_id: z.number().optional(),
        display_name: z.string(),
    }),
});

type Feature = z.infer<typeof FeatureSchema>;

const FeatureCollectionSchema = z.object({
    features: z.array(FeatureSchema),
});

// Results give the whole type, like "way", while lookups take its first letter
const osmTypePrefixes: Record<string, string> = {
    node: 'N',
    way: 'W',
    relation: 'R',
};

// The OSM reference that lookups take, e.g. "W115802108"
export const createPlaceId = (feature: Feature) => {
    const { properties } = feature;
    if (properties.osm_type === undefined || properties.osm_id === undefined) {
        return null;
    }
    const osmTypePrefix = osmTypePrefixes[properties.osm_type];
    if (osmTypePrefix === undefined) {
        return null;
    }
    return `${osmTypePrefix}${properties.osm_id}`;
};

const placeIdPattern = /^[NWR]\d+$/;

const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
};

const createFocusBox = (
    focus: Utils.LngLat,
    focusBoxHalfSizeDegrees: number,
) => {
    return [
        clamp(focus.lng - focusBoxHalfSizeDegrees, -180, 180),
        clamp(focus.lat - focusBoxHalfSizeDegrees, -90, 90),
        clamp(focus.lng + focusBoxHalfSizeDegrees, -180, 180),
        clamp(focus.lat + focusBoxHalfSizeDegrees, -90, 90),
    ].join(',');
};

const createSearchParams = (
    search: PlaceSearch,
    focusBoxHalfSizeDegrees: number,
) => {
    const { text, focus } = search;
    const params = new URLSearchParams({ q: text, format: 'geojson' });
    if (focus) {
        params.set('viewbox', createFocusBox(focus, focusBoxHalfSizeDegrees));
    }
    return params;
};

const createPlace = (feature: Feature): Place | null => {
    const { geometry, properties } = feature;
    const id = createPlaceId(feature);
    if (id === null) {
        return null;
    }
    return {
        id,
        label: properties.display_name,
        position: {
            lng: geometry.coordinates[0],
            lat: geometry.coordinates[1],
        },
    };
};

const defaultFocusBoxHalfSizeDegrees = 0.5;

interface NominatimGeocoderOptions {
    onResponse?: GeocoderOptions['onResponse'];
    // Nominatim has no focus point, only a box whose places rank higher: the
    // box reaches this many degrees of longitude and latitude from the focus.
    focusBoxHalfSizeDegrees?: number | undefined;
}

export class NominatimGeocoder implements Geocoder {
    constructor(
        private readonly url: string,
        private readonly options: NominatimGeocoderOptions = {},
    ) {}

    async searchPlaces(search: PlaceSearch): Promise<Place[]> {
        return this.fetchPlaces(
            'search',
            createSearchParams(
                search,
                this.options.focusBoxHalfSizeDegrees ??
                    defaultFocusBoxHalfSizeDegrees,
            ),
        );
    }

    async lookUpPlace(id: string): Promise<Place | null> {
        if (!placeIdPattern.test(id)) {
            return null;
        }
        const [place] = await this.fetchPlaces(
            'lookup',
            new URLSearchParams({ osm_ids: id, format: 'geojson' }),
        );
        return place ?? null;
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
        return features.map(createPlace).filter((place) => place !== null);
    }
}
