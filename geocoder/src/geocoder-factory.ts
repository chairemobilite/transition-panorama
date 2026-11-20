import type { Geocoder } from './geocoder';
import type { GeocoderProviderName } from './geocoder-provider-names';
import { NominatimGeocoder } from './nominatim';
import { PeliasGeocoder } from './pelias';
import { PhotonGeocoder } from './photon';

const geocoderClasses = {
    nominatim: NominatimGeocoder,
    pelias: PeliasGeocoder,
    photon: PhotonGeocoder,
} satisfies Record<GeocoderProviderName, new (url: string) => Geocoder>;

export const createGeocoder = (
    providerName: GeocoderProviderName,
    url: string,
): Geocoder => {
    const GeocoderClass = geocoderClasses[providerName];
    return new GeocoderClass(url);
};
