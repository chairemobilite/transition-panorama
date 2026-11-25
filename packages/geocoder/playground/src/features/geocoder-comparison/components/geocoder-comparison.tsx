import { useState } from 'react';
import * as Utils from 'utils';

import { geocoderConfigs } from '../../../config/geocoder-configs';

import GeocoderColumn from './geocoder-column';

const GeocoderComparison = () => {
    const [text, setText] = useState('');
    const [languageText, setLanguageText] = useState('');
    const [lastValidLanguage, setLastValidLanguage] = useState('');
    const isLanguageValid = languageText.trim() === lastValidLanguage;

    return (
        <main className="flex flex-col gap-4 p-4">
            <div className="flex gap-2">
                <input
                    type="search"
                    aria-label="Place to search"
                    placeholder="Place to search"
                    value={text}
                    onChange={(event) => {
                        setText(event.target.value);
                    }}
                    className="flex-1 rounded border border-gray-300 px-3 py-2"
                />
                <input
                    type="text"
                    aria-label="Language"
                    aria-invalid={!isLanguageValid}
                    placeholder="Language, like fr-CA (the browser's when empty)"
                    value={languageText}
                    onChange={(event) => {
                        const { value } = event.target;
                        setLanguageText(value);
                        const trimmedValue = value.trim();
                        if (
                            trimmedValue === '' ||
                            Utils.isLanguageTag(trimmedValue)
                        ) {
                            setLastValidLanguage(trimmedValue);
                        }
                    }}
                    className="w-96 rounded border border-gray-300 px-3 py-2 aria-invalid:border-red-500"
                />
            </div>
            <div className="flex gap-4">
                {geocoderConfigs.map((geocoderConfig) => (
                    <GeocoderColumn
                        key={geocoderConfig.url}
                        geocoderConfig={geocoderConfig}
                        text={text}
                        language={lastValidLanguage}
                    />
                ))}
            </div>
        </main>
    );
};

export default GeocoderComparison;
