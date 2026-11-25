import {
    keepPreviousData,
    queryOptions,
    skipToken,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { Api } from 'contract';
import { useTranslation } from 'react-i18next';
import type * as Utils from 'utils';

const fetchPlaceSearch = async (
    body: Api.PlaceSearchBody,
    signal: AbortSignal,
): Promise<Api.PlaceSearchResponse> => {
    const { method, path, response } = Api.placeSearchEndpoint;
    const res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    });
    if (!res.ok) {
        throw new Error(
            `Place search request failed: ${res.status} ${await res.text()}`,
        );
    }
    return response.parse(await res.json());
};

export const createPlaceSearchQueryOptions = (
    text: string,
    language: string,
    focus?: Utils.LngLat,
) => {
    const trimmedText = text.trim();
    return queryOptions({
        queryKey: ['placeSearch', trimmedText, language, focus],
        queryFn: trimmedText
            ? ({ signal }) =>
                  fetchPlaceSearch(
                      { text: trimmedText, focus, language },
                      signal,
                  )
            : skipToken,
        // Keep the previous suggestions while typing, instead of flickering,
        // but not once the text is erased
        placeholderData: trimmedText ? keepPreviousData : undefined,
        staleTime: Infinity, // Search results are never updated on the backend
    });
};

export const usePlaceSearchQuery = (text: string, focus?: Utils.LngLat) => {
    const { i18n } = useTranslation();
    return useQuery(createPlaceSearchQueryOptions(text, i18n.language, focus));
};

const fetchPlaceLookup = async (
    params: Api.PlaceLookupParams,
    query: Api.PlaceLookupQuery,
    signal: AbortSignal,
): Promise<Api.Place> => {
    const { method, path, response } = Api.placeLookupEndpoint;
    const url = `${path.replace(':id', encodeURIComponent(params.id))}?${new URLSearchParams(query).toString()}`;
    const res = await fetch(url, { method, signal });
    if (!res.ok) {
        throw new Error(
            `Place lookup request failed: ${res.status} ${await res.text()}`,
        );
    }
    return response.parse(await res.json());
};

export const createPlaceLookupQueryOptions = (
    id: string | undefined,
    language: string,
) => {
    return queryOptions({
        queryKey: ['placeLookup', id, language],
        queryFn: id
            ? ({ signal }) => fetchPlaceLookup({ id }, { language }, signal)
            : skipToken,
        // The label in the previous language stays until the new one comes,
        // but not another place's
        placeholderData: (previousPlace) => {
            return previousPlace?.id === id ? previousPlace : undefined;
        },
        staleTime: Infinity, // Places are never updated on the backend
    });
};

export const usePlaceLookupQuery = (id: string | undefined) => {
    const { i18n } = useTranslation();
    return useQuery(createPlaceLookupQueryOptions(id, i18n.language));
};

// Saves a place already known, e.g. from the search, so it needs no lookup
export const useSetPlaceLookupQueryData = () => {
    const queryClient = useQueryClient();
    const { i18n } = useTranslation();
    return (place: Api.Place) => {
        queryClient.setQueryData(
            createPlaceLookupQueryOptions(place.id, i18n.language).queryKey,
            place,
        );
    };
};
