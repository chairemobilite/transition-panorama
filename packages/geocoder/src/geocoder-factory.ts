import type { Geocoder, GeocoderOptions } from './geocoder';
import type { GeocoderProviderName } from './geocoder-provider-names';
import { NominatimGeocoder } from './nominatim';
import { PeliasGeocoder } from './pelias';
import { PhotonGeocoder } from './photon';

const geocoderClasses = {
    nominatim: NominatimGeocoder,
    pelias: PeliasGeocoder,
    photon: PhotonGeocoder,
} satisfies Record<
    GeocoderProviderName,
    new (url: string, options?: GeocoderOptions) => Geocoder
>;

export const createGeocoder = (
    providerName: GeocoderProviderName,
    url: string,
    options: GeocoderOptions = {},
): Geocoder => {
    const GeocoderClass = geocoderClasses[providerName];
    return new GeocoderClass(url, options);
};
