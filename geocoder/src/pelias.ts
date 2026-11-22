import { Utils } from 'common';
import { z } from 'zod';
import type { Geocoder, Place, PlaceSearch } from './geocoder';

// Pelias' answers, with only the fields we use
// https://github.com/pelias/documentation/blob/master/autocomplete.md
// https://github.com/pelias/documentation/blob/master/place.md

export const FeatureSchema = z.object({
    geometry: z.object({
        coordinates: z.tuple([z.number(), z.number()]),
    }),
    properties: z.object({
        gid: z.string(),
        label: z.string(),
    }),
});

type Feature = z.infer<typeof FeatureSchema>;

const FeatureCollectionSchema = z.object({
    features: z.array(FeatureSchema),
});

const createAutocompleteParams = (search: PlaceSearch) => {
    const { text, focus } = search;
    const params = new URLSearchParams({ text });
    if (focus) {
        params.set('focus.point.lon', String(focus.lng));
        params.set('focus.point.lat', String(focus.lat));
    }
    return params;
};

export const createPlaceId = (feature: Feature) => {
    return feature.properties.gid;
};

const createPlace = (feature: Feature): Place => {
    const { geometry, properties } = feature;
    return {
        id: createPlaceId(feature),
        label: properties.label,
        position: {
            lng: geometry.coordinates[0],
            lat: geometry.coordinates[1],
        },
    };
};

export class PeliasGeocoder implements Geocoder {
    constructor(private readonly url: string) {}

    async searchPlaces(search: PlaceSearch): Promise<Place[]> {
        const features = await this.fetchFeatures(
            'autocomplete',
            createAutocompleteParams(search),
        );
        return features.map(createPlace);
    }

    async lookUpPlace(id: string): Promise<Place | null> {
        const [feature] = await this.fetchFeatures(
            'place',
            new URLSearchParams({ ids: id }),
        );
        if (!feature) {
            return null;
        }
        return createPlace(feature);
    }

    private async fetchFeatures(path: string, params: URLSearchParams) {
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
        return features;
    }
}
