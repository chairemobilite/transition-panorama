import type * as Utils from 'utils';

// A position, optionally linked to a search result
export interface PlaceRef {
    id?: string;
    position: Utils.LngLat;
}
