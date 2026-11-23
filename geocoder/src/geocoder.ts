import type * as Utils from 'utils';

export interface PlaceSearch {
    text: string;
    // Places closer to it come first
    focus?: Utils.LngLat | undefined;
}

export interface Place {
    id: string;
    label: string;
    position: Utils.LngLat;
}

export interface GeocoderOptions {
    // Receives each answer of the service as it came
    onResponse?: ((response: unknown) => void) | undefined;
}

export interface Geocoder {
    searchPlaces: (search: PlaceSearch) => Promise<Place[]>;
    lookUpPlace: (id: string) => Promise<Place | null>;
}
