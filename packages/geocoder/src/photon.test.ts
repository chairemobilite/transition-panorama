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

import { PhotonGeocoder } from './photon';

const photonUrl = 'http://photon.test';

const position = { lng: 1, lat: 2 };

const createNodeFeature = (properties: Record<string, unknown>) => {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [position.lng, position.lat],
        },
        properties: {
            osm_type: 'N',
            osm_key: 'key',
            osm_value: 'value',
            ...properties,
        },
    };
};

// A feature, and the place it becomes
const feature = createNodeFeature({ osm_id: 3, name: 'Name' });
const place = { id: 'key=value/N3@1,2', label: 'Name', position };

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
        http.get(`${photonUrl}/${path}`, (info) => {
            const { searchParams } = new URL(info.request.url);
            searchParamsSpy(Object.fromEntries(searchParams));
            languageSpy(info.request.headers.get('Accept-Language'));
            return HttpResponse.json({ type: 'FeatureCollection', features });
        }),
    );
    return { searchParamsSpy, languageSpy };
};

const geocoder = new PhotonGeocoder(photonUrl);

describe('searchPlaces', () => {
    it('sends the text and the focus', async () => {
        const { searchParamsSpy } = setUpFakeEndpoint('api', []);
        await geocoder.searchPlaces({
            text: 'text',
            focus: { lng: 3, lat: 4 },
        });
        expect(searchParamsSpy).toHaveBeenCalledWith({
            q: 'text',
            lon: '3',
            lat: '4',
        });
    });

    it('sends only the text without a focus', async () => {
        const { searchParamsSpy } = setUpFakeEndpoint('api', []);
        await geocoder.searchPlaces({ text: 'text' });
        expect(searchParamsSpy).toHaveBeenCalledWith({
            q: 'text',
        });
    });

    it('returns the features as places', async () => {
        setUpFakeEndpoint('api', [feature]);
        expect(await geocoder.searchPlaces({ text: 'text' })).toEqual([place]);
    });

    it('labels the name, the address, the city, the state and the country', async () => {
        setUpFakeEndpoint('api', [
            createNodeFeature({
                osm_id: 3,
                name: 'Name',
                housenumber: '10',
                street: 'Street',
                city: 'City',
                state: 'State',
                country: 'Country',
            }),
        ]);
        const [foundPlace] = await geocoder.searchPlaces({ text: 'text' });
        expect(foundPlace?.label).toBe('Name, 10 Street, City, State, Country');
    });

    it('leaves out the parts that repeat the name', async () => {
        setUpFakeEndpoint('api', [
            createNodeFeature({
                osm_id: 3,
                name: 'State',
                state: 'State',
                country: 'Country',
            }),
        ]);
        const [foundPlace] = await geocoder.searchPlaces({ text: 'text' });
        expect(foundPlace?.label).toBe('State, Country');
    });

    it('labels an address without a name', async () => {
        setUpFakeEndpoint('api', [
            createNodeFeature({
                osm_id: 3,
                housenumber: '10',
                street: 'Street',
                city: 'City',
            }),
        ]);
        const [foundPlace] = await geocoder.searchPlaces({ text: 'text' });
        expect(foundPlace?.label).toBe('10 Street, City');
    });

    // Like the postcodes, which Photon makes up
    it('identifies a feature without an OSM reference by its name', async () => {
        setUpFakeEndpoint('api', [
            createNodeFeature({ osm_type: undefined, name: 'Name' }),
        ]);
        const [foundPlace] = await geocoder.searchPlaces({ text: 'text' });
        expect(foundPlace?.id).toBe('key=value/Name@1,2');
    });

    it('skips the features without an OSM reference or a name', async () => {
        setUpFakeEndpoint('api', [
            createNodeFeature({ osm_type: undefined }),
            feature,
        ]);
        expect(await geocoder.searchPlaces({ text: 'text' })).toEqual([place]);
    });

    it('keeps apart the features without an OSM reference', async () => {
        setUpFakeEndpoint('api', [
            createNodeFeature({ osm_type: undefined, name: 'Name' }),
            createNodeFeature({ osm_type: undefined, name: 'Other name' }),
        ]);
        expect(await geocoder.searchPlaces({ text: 'text' })).toHaveLength(2);
    });

    it('skips the features without a tag', async () => {
        setUpFakeEndpoint('api', [
            createNodeFeature({ osm_id: 4, osm_key: undefined }),
            feature,
        ]);
        expect(await geocoder.searchPlaces({ text: 'text' })).toEqual([place]);
    });

    it('keeps only the first tag of an OSM object', async () => {
        const featureWithOtherTag = createNodeFeature({
            osm_id: 3,
            osm_value: 'other value',
            name: 'Other name',
        });
        setUpFakeEndpoint('api', [feature, featureWithOtherTag]);
        expect(await geocoder.searchPlaces({ text: 'text' })).toEqual([place]);
    });
});

describe('lookUpPlace', () => {
    it('sends the tag and the position from the id', async () => {
        const { searchParamsSpy } = setUpFakeEndpoint('reverse', []);
        await geocoder.lookUpPlace({ id: place.id });
        expect(searchParamsSpy).toHaveBeenCalledWith({
            lon: '1',
            lat: '2',
            osm_tag: 'key:value',
            limit: '10',
        });
    });

    it('finds the place with the id among the places around', async () => {
        setUpFakeEndpoint('reverse', [
            createNodeFeature({ osm_id: 4 }),
            feature,
        ]);
        expect(await geocoder.lookUpPlace({ id: place.id })).toEqual(place);
    });

    it('returns null when no place around has the id', async () => {
        setUpFakeEndpoint('reverse', [createNodeFeature({ osm_id: 4 })]);
        expect(await geocoder.lookUpPlace({ id: place.id })).toBe(null);
    });

    it.each([
        ['tag', 'N3@1,2'],
        ['position', 'key=value/N3'],
    ])(
        'returns null without searching when the id has no %s',
        async (_missing, id) => {
            const { searchParamsSpy } = setUpFakeEndpoint('reverse', []);
            expect(await geocoder.lookUpPlace({ id })).toBe(null);
            expect(searchParamsSpy).not.toHaveBeenCalled();
        },
    );
});

describe('language', () => {
    it('sends the language of a search', async () => {
        const { languageSpy } = setUpFakeEndpoint('api', []);
        await geocoder.searchPlaces({ text: 'text', language: 'fr-CA' });
        expect(languageSpy).toHaveBeenCalledWith('fr-CA');
    });

    it('sends the language of a lookup', async () => {
        const { languageSpy } = setUpFakeEndpoint('reverse', []);
        await geocoder.lookUpPlace({ id: place.id, language: 'fr-CA' });
        expect(languageSpy).toHaveBeenCalledWith('fr-CA');
    });
});

describe('onResponse', () => {
    it('receives the answer as it came', async () => {
        setUpFakeEndpoint('api', [feature]);
        const onResponse = vi.fn();
        await new PhotonGeocoder(photonUrl, { onResponse }).searchPlaces({
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
            http.get(`${photonUrl}/api`, () => {
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

    it('throws an UpstreamError when Photon is unreachable', async () => {
        server.use(
            http.get(`${photonUrl}/api`, () => {
                return HttpResponse.error();
            }),
        );
        await expect(geocoder.searchPlaces({ text: 'text' })).rejects.toThrow(
            new Utils.UpstreamError('Request failed'),
        );
    });

    it('throws an UpstreamError on an unexpected answer', async () => {
        server.use(
            http.get(`${photonUrl}/api`, () => {
                return HttpResponse.json({ results: [] });
            }),
        );
        await expect(geocoder.searchPlaces({ text: 'text' })).rejects.toThrow(
            new Utils.UpstreamError('Unexpected answer'),
        );
    });
});
