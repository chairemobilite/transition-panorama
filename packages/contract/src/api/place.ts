import * as Utils from 'utils';
import { z } from 'zod';

export const PlaceSearchBodySchema = z.object({
    text: z.string().trim().min(1).max(200),
    focus: Utils.LngLatSchema.optional(),
    // Of the labels
    language: Utils.LanguageTagSchema,
});

export type PlaceSearchBody = z.infer<typeof PlaceSearchBodySchema>;

export const PlaceSchema = z.object({
    id: z.string(),
    label: z.string(),
    position: Utils.LngLatSchema,
});

export type Place = z.infer<typeof PlaceSchema>;

export const PlaceSearchResponseSchema = z.array(PlaceSchema);
export type PlaceSearchResponse = z.infer<typeof PlaceSearchResponseSchema>;

export const placeSearchEndpoint = {
    method: 'post',
    path: '/api/places/search',
    body: PlaceSearchBodySchema,
    response: PlaceSearchResponseSchema,
} as const;

export const PlaceLookupParamsSchema = z.object({
    id: z.string().min(1),
});

export type PlaceLookupParams = z.infer<typeof PlaceLookupParamsSchema>;

export const PlaceLookupQuerySchema = z.object({
    // Of the label
    language: Utils.LanguageTagSchema,
});

export type PlaceLookupQuery = z.infer<typeof PlaceLookupQuerySchema>;

export const placeLookupEndpoint = {
    method: 'get',
    // The id must be URL-encoded, as it contains slashes
    path: '/api/places/:id',
    params: PlaceLookupParamsSchema,
    query: PlaceLookupQuerySchema,
    response: PlaceSchema,
} as const;
