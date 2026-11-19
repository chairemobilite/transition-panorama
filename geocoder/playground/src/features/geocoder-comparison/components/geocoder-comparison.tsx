import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { geocoderConfigs } from '../../../config/geocoder-configs';
import GeocoderColumn from './geocoder-column';

const GeocoderComparison = () => {
    const [text, setText] = useState('');
    const [throttledText] = useDebounce(text, 300, {
        leading: true,
        maxWait: 300,
    });

    return (
        <main className="flex flex-col gap-4 p-4">
            <input
                type="search"
                aria-label="Place to search"
                placeholder="Place to search"
                value={text}
                onChange={(event) => {
                    setText(event.target.value);
                }}
                className="rounded border border-gray-300 px-3 py-2"
            />
            <div className="flex gap-4 overflow-x-auto">
                {geocoderConfigs.map((geocoderConfig) => (
                    <GeocoderColumn
                        key={geocoderConfig.url}
                        geocoderConfig={geocoderConfig}
                        text={throttledText}
                    />
                ))}
            </div>
        </main>
    );
};

export default GeocoderComparison;
