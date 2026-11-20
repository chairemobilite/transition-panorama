import type { GeocoderProviderName } from '../../../src';

export interface GeocoderConfig {
    name: string;
    providerName: GeocoderProviderName;
    url: string;
    throttleMs: number;
}

declare const __GEOCODER_CONFIGS__: GeocoderConfig[];

export const geocoderConfigs = __GEOCODER_CONFIGS__;
