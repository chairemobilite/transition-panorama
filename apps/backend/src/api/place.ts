import { Api } from 'contract';
import express from 'express';
import type { Geocoder } from 'geocoder';

import { ApiError, parseRequest } from '../utils/http';

export const createPlaceRouter = (geocoder: Geocoder) => {
    const handlePlaceSearch = async (
        req: express.Request,
        res: express.Response,
    ) => {
        const body = parseRequest(Api.placeSearchEndpoint.body, req.body);
        res.json(
            Api.placeSearchEndpoint.response.parse(
                await geocoder.searchPlaces(body),
            ),
        );
    };

    const handlePlaceLookup = async (
        req: express.Request,
        res: express.Response,
    ) => {
        const { id } = parseRequest(Api.placeLookupEndpoint.params, req.params);
        const { language } = parseRequest(
            Api.placeLookupEndpoint.query,
            req.query,
        );
        const place = await geocoder.lookUpPlace({ id, language });
        if (!place) {
            throw new ApiError(404, { error: `Place not found: ${id}` });
        }
        res.json(Api.placeLookupEndpoint.response.parse(place));
    };

    const placeRouter = express.Router();
    placeRouter[Api.placeSearchEndpoint.method](
        Api.placeSearchEndpoint.path,
        handlePlaceSearch,
    );
    placeRouter[Api.placeLookupEndpoint.method](
        Api.placeLookupEndpoint.path,
        handlePlaceLookup,
    );
    return placeRouter;
};
