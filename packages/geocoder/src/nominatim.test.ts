import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import * as Utils from 'utils';
import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { NominatimGeocoder } from './nominatim';

const nominatimUrl = 'http://nominatim.test';

const position = { lng: 1, lat: 2 };

const createFeature = (properties: Record<string, unknown>) => {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [position.lng, position.lat],
        },
        properties: { display_name: 'Name, City', ...properties },
    };
};

// A feature, and the place it becomes
const feature = createFeature({ osm_type: 'way', osm_id: 3 });
const place = { id: 'W3', label: 'Name, City', position };

const server = setupServer();

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
    server.resetHandlers();
});

afterAll(() => {
    server.close();
});

// Answers the requests to a path with the features, and returns a spy called
// with the search params of each request
const setUpFakeEndpoint = (path: string, features: unknown[]) => {
    const endpointSpy = vi.fn<(searchParams: Record<string, string>) => void>();
    server.use(
        http.get(`${nominatimUrl}/${path}`, (info) => {
            const { searchParams } = new URL(info.request.url);
            endpointSpy(Object.fromEntries(searchParams));
            return HttpResponse.json({ type: 'FeatureCollection', features });
        }),
    );
    return endpointSpy;
};

const geocoder = new NominatimGeocoder(nominatimUrl);

describe('searchPlaces', () => {
    it('sends the text, and a box around the focus', async () => {
        const searchEndpointSpy = setUpFakeEndpoint('search', []);
        const focusBoxHalfSizeDegrees = 1;
        await new NominatimGeocoder(nominatimUrl, {
            focusBoxHalfSizeDegrees,
        }).searchPlaces({ text: 'text', focus: { lng: 1, lat: 10 } });
        expect(searchEndpointSpy).toHaveBeenCalledWith({
            q: 'text',
            format: 'geojson',
            viewbox: '0,9,2,11',
        });
    });

    it('sends only the text without a focus', async () => {
        const searchEndpointSpy = setUpFakeEndpoint('search', []);
        await geocoder.searchPlaces({ text: 'text' });
        expect(searchEndpointSpy).toHaveBeenCalledWith({
            q: 'text',
            format: 'geojson',
        });
    });

    it('cuts the box at the poles and the antimeridian', async () => {
        const searchEndpointSpy = setUpFakeEndpoint('search', []);
        const focusBoxHalfSizeDegrees = 1;
        await new NominatimGeocoder(nominatimUrl, {
            focusBoxHalfSizeDegrees,
        }).searchPlaces({ text: 'text', focus: { lng: 180, lat: -90 } });
        expect(searchEndpointSpy).toHaveBeenCalledWith(
            expect.objectContaining({ viewbox: '179,-90,180,-89' }),
        );
    });

    it('returns the features as places', async () => {
        setUpFakeEndpoint('search', [feature]);
        expect(await geocoder.searchPlaces({ text: 'text' })).toEqual([place]);
    });

    it('prefixes the ids with the OSM type of each place', async () => {
        setUpFakeEndpoint('search', [
            createFeature({ osm_type: 'node', osm_id: 1 }),
            createFeature({ osm_type: 'way', osm_id: 2 }),
            createFeature({ osm_type: 'relation', osm_id: 3 }),
        ]);
        const places = await geocoder.searchPlaces({ text: 'text' });
        expect(places.map((foundPlace) => foundPlace.id)).toEqual([
            'N1',
            'W2',
            'R3',
        ]);
    });

    // Like the postcodes, which can't be looked up
    it('skips the features without a known OSM type and id', async () => {
        setUpFakeEndpoint('search', [
            createFeature({}),
            createFeature({ osm_type: 'other', osm_id: 4 }),
            feature,
        ]);
        expect(await geocoder.searchPlaces({ text: 'text' })).toEqual([place]);
    });
});

describe('lookUpPlace', () => {
    it('sends the id', async () => {
        const lookupEndpointSpy = setUpFakeEndpoint('lookup', []);
        await geocoder.lookUpPlace(place.id);
        expect(lookupEndpointSpy).toHaveBeenCalledWith({
            osm_ids: place.id,
            format: 'geojson',
        });
    });

    it('returns the feature as a place', async () => {
        setUpFakeEndpoint('lookup', [feature]);
        expect(await geocoder.lookUpPlace(place.id)).toEqual(place);
    });

    it('returns null when no place has the id', async () => {
        setUpFakeEndpoint('lookup', []);
        expect(await geocoder.lookUpPlace(place.id)).toBe(null);
    });

    it('returns null without a request when the id is no OSM reference', async () => {
        const lookupEndpointSpy = setUpFakeEndpoint('lookup', []);
        expect(await geocoder.lookUpPlace('W3x')).toBe(null);
        expect(lookupEndpointSpy).not.toHaveBeenCalled();
    });
});

describe('onResponse', () => {
    it('receives the answer as it came', async () => {
        setUpFakeEndpoint('search', [feature]);
        const onResponse = vi.fn();
        await new NominatimGeocoder(nominatimUrl, { onResponse }).searchPlaces({
            text: 'text',
        });
        expect(onResponse).toHaveBeenCalledWith({
            type: 'FeatureCollection',
            features: [feature],
        });
    });
});

describe('errors', () => {
    it('throws an HttpUpstreamError with the HTTP error', async () => {
        server.use(
            http.get(`${nominatimUrl}/search`, () => {
                return new HttpResponse('Bad request', { status: 400 });
            }),
        );
        const search = geocoder.searchPlaces({ text: 'text' });
        await expect(search).rejects.toBeInstanceOf(Utils.HttpUpstreamError);
        await expect(search).rejects.toMatchObject({
            status: 400,
            data: 'Bad request',
        });
    });

    it('throws an UpstreamError when Nominatim is unreachable', async () => {
        server.use(
            http.get(`${nominatimUrl}/search`, () => {
                return HttpResponse.error();
            }),
        );
        await expect(geocoder.searchPlaces({ text: 'text' })).rejects.toThrow(
            new Utils.UpstreamError('Request failed'),
        );
    });

    it('throws an UpstreamError on an unexpected answer', async () => {
        server.use(
            http.get(`${nominatimUrl}/search`, () => {
                return HttpResponse.json({ results: [] });
            }),
        );
        await expect(geocoder.searchPlaces({ text: 'text' })).rejects.toThrow(
            new Utils.UpstreamError('Unexpected answer'),
        );
    });
});
