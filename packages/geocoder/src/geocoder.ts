import type * as Utils from 'utils';

// Like "fr-CA"
export type LanguageTag = string;

export interface PlaceSearch {
    text: string;
    // Places closer to it come first
    focus?: Utils.LngLat | undefined;
    // Of the labels
    language?: LanguageTag | undefined;
}

export interface PlaceLookup {
    id: string;
    // Of the label
    language?: LanguageTag | undefined;
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
    lookUpPlace: (lookup: PlaceLookup) => Promise<Place | null>;
}
