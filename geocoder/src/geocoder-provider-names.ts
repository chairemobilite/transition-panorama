export const geocoderProviderNames = ['nominatim', 'pelias', 'photon'] as const;

export type GeocoderProviderName = (typeof geocoderProviderNames)[number];
