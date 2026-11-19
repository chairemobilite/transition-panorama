import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';
import { createGeocoder } from '../../../../../src';
import type { GeocoderConfig } from '../../../config/geocoder-configs';

const fetchPlaceSearch = async (
    geocoderConfig: GeocoderConfig,
    text: string,
) => {
    const geocoder = createGeocoder(
        geocoderConfig.providerName,
        geocoderConfig.url,
    );
    return geocoder.searchPlaces({ text });
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
        placeholderData: (previousPlaces) => {
            return trimmedText ? previousPlaces : undefined;
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
