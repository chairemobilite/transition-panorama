import { z } from 'zod';

import type { GeocoderProviderName, Place } from '../../../../../src';
import * as Nominatim from '../../../../../src/nominatim';
import * as Pelias from '../../../../../src/pelias';
import * as Photon from '../../../../../src/photon';

// The raw results the geocoder makes one place of
export interface RawGroup {
    // As the service gave them, the place being made of the first
    raws: unknown[];
    // The id of the place the geocoder makes of them, or null when it makes
    // none
    placeId: string | null;
}

// Pelias, Photon and Nominatim all answer in GeoJSON
const FeatureCollectionSchema = z.object({ features: z.array(z.unknown()) });

const createRawGroupFinder = <Feature>(
    featureSchema: z.ZodType<Feature>,
    createPlaceId: (feature: Feature) => string | null,
    // Geocoders that merge no raw results put each one in its own group
    groupFeatures: (features: Feature[]) => [Feature, ...Feature[]][] = (
        features,
    ) => {
        return features.map((feature) => [feature]);
    },
) => {
    return (response: unknown): RawGroup[] => {
        const raws =
            FeatureCollectionSchema.safeParse(response).data?.features ?? [];
        // Each group keeps the index of its first raw result in the answer,
        // to be in the service's order
        const groups: { rawIndex: number; group: RawGroup }[] = [];
        const rawIndexes = new Map<Feature, number>();
        raws.forEach((raw, index) => {
            const result = featureSchema.safeParse(raw);
            if (result.success) {
                rawIndexes.set(result.data, index);
            } else {
                groups.push({
                    rawIndex: index,
                    group: { raws: [raw], placeId: null },
                });
            }
        });
        // Never -1, only for the types
        const findRawIndex = (feature: Feature) =>
            rawIndexes.get(feature) ?? -1;
        for (const featureGroup of groupFeatures([...rawIndexes.keys()])) {
            const [firstFeature] = featureGroup;
            groups.push({
                rawIndex: findRawIndex(firstFeature),
                group: {
                    raws: featureGroup.map((feature) =>
                        raws.at(findRawIndex(feature)),
                    ),
                    placeId: createPlaceId(firstFeature),
                },
            });
        }
        return groups
            .toSorted((a, b) => a.rawIndex - b.rawIndex)
            .map(({ group }) => group);
    };
};

// Each geocoder's answer split in the groups of raw results it makes places of
export const rawGroupFinders = {
    nominatim: createRawGroupFinder(
        Nominatim.FeatureSchema,
        Nominatim.createPlaceId,
    ),
    pelias: createRawGroupFinder(Pelias.FeatureSchema, Pelias.createPlaceId),
    photon: createRawGroupFinder(
        Photon.FeatureSchema,
        Photon.createPlaceId,
        Photon.groupFeatures,
    ),
} satisfies Record<GeocoderProviderName, (response: unknown) => RawGroup[]>;

export interface SearchResult {
    // Null for raw results of which the geocoder returned no place, like a
    // postcode
    place: Place | null;
    // As the service gave them: the raw results merged into the place, to be
    // compared with the one the place was made of
    raws: unknown[];
}

export interface SearchResults {
    // In the order of the service's answer
    results: SearchResult[];
    // Returned without a raw result of the same id, which is a bug
    placesWithoutRaw: Place[];
}

export const matchPlaces = (
    rawGroups: RawGroup[],
    places: Place[],
): SearchResults => {
    return {
        results: rawGroups.map((rawGroup) => {
            return {
                place:
                    places.find((place) => place.id === rawGroup.placeId) ??
                    null,
                raws: rawGroup.raws,
            };
        }),
        placesWithoutRaw: places.filter(
            (place) =>
                !rawGroups.some((rawGroup) => rawGroup.placeId === place.id),
        ),
    };
};
