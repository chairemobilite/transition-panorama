import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';

import { createGeocoder, type PlaceSearch } from '../../../../../src';
import type { GeocoderConfig } from '../../../config/geocoder-configs';
import {
    matchPlaces,
    rawGroupFinders,
    type SearchResults,
} from '../utils/raw-results';

const fetchPlaceSearch = async (
    geocoderConfig: GeocoderConfig,
    search: PlaceSearch,
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
    const places = await geocoder.searchPlaces(search);
    const rawGroups = rawGroupFinders[geocoderConfig.providerName](response);
    return matchPlaces(rawGroups, places);
};

export const createPlaceSearchQueryOptions = (
    geocoderConfig: GeocoderConfig,
    text: string,
    language: string,
) => {
    const trimmedText = text.trim();
    const trimmedLanguage = language.trim() || undefined;
    return queryOptions({
        queryKey: [
            'placeSearch',
            geocoderConfig.url,
            trimmedText,
            trimmedLanguage,
        ],
        queryFn: trimmedText
            ? () =>
                  fetchPlaceSearch(geocoderConfig, {
                      text: trimmedText,
                      language: trimmedLanguage,
                  })
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
    language: string,
) => {
    return useQuery(
        createPlaceSearchQueryOptions(geocoderConfig, text, language),
    );
};
