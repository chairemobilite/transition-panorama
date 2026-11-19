export const geocoderProviderNames = ['pelias', 'photon'] as const;

export type GeocoderProviderName = (typeof geocoderProviderNames)[number];
