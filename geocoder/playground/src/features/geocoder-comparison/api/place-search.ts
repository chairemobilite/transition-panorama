import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';
import { createGeocoder } from '../../../../../src';
import type { GeocoderConfig } from '../../../config/geocoder-configs';
import {
    matchPlaces,
    rawGroupFinders,
    type SearchResults,
} from '../utils/raw-results';

const fetchPlaceSearch = async (
    geocoderConfig: GeocoderConfig,
    text: string,
): Promise<SearchResults> => {
    let response: unknown;
    const geocoder = createGeocoder(
        geocoderConfig.providerName,
        geocoderConfig.url,
        {
            onResponse: (data) => {
                response = data;
            },
        },
    );
    const places = await geocoder.searchPlaces({ text });
    const rawGroups = rawGroupFinders[geocoderConfig.providerName](response);
    return matchPlaces(rawGroups, places);
};

export const createPlaceSearchQueryOptions = (
    geocoderConfig: GeocoderConfig,
    text: string,
) => {
    const trimmedText = text.trim();
    return queryOptions({
        queryKey: ['placeSearch', geocoderConfig.url, trimmedText],
        queryFn: trimmedText
            ? () => fetchPlaceSearch(geocoderConfig, trimmedText)
            : skipToken,
        // The previous results stay while typing, but not once the text is
        // erased
        placeholderData: (previousResults) => {
            return trimmedText ? previousResults : undefined;
        },
        staleTime: Infinity,
    });
};

export const usePlaceSearchQuery = (
    geocoderConfig: GeocoderConfig,
    text: string,
) => {
    return useQuery(createPlaceSearchQueryOptions(geocoderConfig, text));
};
