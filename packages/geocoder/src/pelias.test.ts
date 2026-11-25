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

import { PeliasGeocoder } from './pelias';

const peliasUrl = 'http://pelias.test/v1';

const place = {
    id: 'place-id',
    label: 'Place label',
    position: { lng: 1, lat: 2 },
};

const feature = {
    type: 'Feature',
    geometry: {
        type: 'Point',
        coordinates: [place.position.lng, place.position.lat],
    },
    properties: {
        gid: place.id,
        label: place.label,
    },
};

const server = setupServer();

beforeAll(() => {
    server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
    server.resetHandlers();
});

afterAll(() => {
    server.close();
});

// Answers the requests to a path with the features, and returns spies called
// with the search params and the Accept-Language header of each request
const setUpFakeEndpoint = (path: string, features: unknown[]) => {
    const searchParamsSpy =
        vi.fn<(searchParams: Record<string, string>) => void>();
    const languageSpy = vi.fn<(language: string | null) => void>();
    server.use(
        http.get(`${peliasUrl}/${path}`, (info) => {
            const { searchParams } = new URL(info.request.url);
            searchParamsSpy(Object.fromEntries(searchParams));
            languageSpy(info.request.headers.get('Accept-Language'));
            return HttpResponse.json({ type: 'FeatureCollection', features });
        }),
    );
    return { searchParamsSpy, languageSpy };
};

const geocoder = new PeliasGeocoder(peliasUrl);

describe('searchPlaces', () => {
    it('sends the text and the focus', async () => {
        const { searchParamsSpy } = setUpFakeEndpoint('autocomplete', []);
        await geocoder.searchPlaces({
            text: 'text',
            focus: { lng: 3, lat: 4 },
        });
        expect(searchParamsSpy).toHaveBeenCalledWith({
            text: 'text',
            'focus.point.lon': '3',
            'focus.point.lat': '4',
        });
    });

    it('sends only the text without a focus', async () => {
        const { searchParamsSpy } = setUpFakeEndpoint('autocomplete', []);
        await geocoder.searchPlaces({ text: 'text' });
        expect(searchParamsSpy).toHaveBeenCalledWith({
            text: 'text',
        });
    });

    it('returns the features as places', async () => {
        setUpFakeEndpoint('autocomplete', [feature]);
        expect(await geocoder.searchPlaces({ text: 'text' })).toEqual([place]);
    });
});

describe('lookUpPlace', () => {
    it('sends the id', async () => {
        const { searchParamsSpy } = setUpFakeEndpoint('place', []);
        await geocoder.lookUpPlace({ id: place.id });
        expect(searchParamsSpy).toHaveBeenCalledWith({
            ids: place.id,
        });
    });

    it('returns the feature as a place', async () => {
        setUpFakeEndpoint('place', [feature]);
        expect(await geocoder.lookUpPlace({ id: place.id })).toEqual(place);
    });

    it('returns null when no place has the id', async () => {
        setUpFakeEndpoint('place', []);
        expect(await geocoder.lookUpPlace({ id: place.id })).toBe(null);
    });
});

describe('language', () => {
    it('sends the language of a search', async () => {
        const { languageSpy } = setUpFakeEndpoint('autocomplete', []);
        await geocoder.searchPlaces({ text: 'text', language: 'fr-CA' });
        expect(languageSpy).toHaveBeenCalledWith('fr-CA');
    });

    it('sends the language of a lookup', async () => {
        const { languageSpy } = setUpFakeEndpoint('place', []);
        await geocoder.lookUpPlace({ id: place.id, language: 'fr-CA' });
        expect(languageSpy).toHaveBeenCalledWith('fr-CA');
    });
});

describe('onResponse', () => {
    it('receives the answer as it came', async () => {
        setUpFakeEndpoint('autocomplete', [feature]);
        const onResponse = vi.fn();
        await new PeliasGeocoder(peliasUrl, { onResponse }).searchPlaces({
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
            http.get(`${peliasUrl}/autocomplete`, () => {
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

    it('throws an UpstreamError when Pelias is unreachable', async () => {
        server.use(
            http.get(`${peliasUrl}/autocomplete`, () => {
                return HttpResponse.error();
            }),
        );
        await expect(geocoder.searchPlaces({ text: 'text' })).rejects.toThrow(
            new Utils.UpstreamError('Request failed'),
        );
    });

    it('throws an UpstreamError on an unexpected answer', async () => {
        server.use(
            http.get(`${peliasUrl}/autocomplete`, () => {
                return HttpResponse.json({ results: [] });
            }),
        );
        await expect(geocoder.searchPlaces({ text: 'text' })).rejects.toThrow(
            new Utils.UpstreamError('Unexpected answer'),
        );
    });
});
