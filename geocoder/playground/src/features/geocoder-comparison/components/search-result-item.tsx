import { useState } from 'react';
import type { SearchResult } from '../utils/raw-results';

interface SearchResultItemProps {
    result: SearchResult;
}

const SearchResultItem = (props: SearchResultItemProps) => {
    const { result } = props;
    const [isRawShown, setIsRawShown] = useState(false);

    return (
        <li>
            <button
                type="button"
                aria-expanded={isRawShown}
                aria-label="Raw results"
                onClick={() => {
                    setIsRawShown(!isRawShown);
                }}
                className="mr-1 inline-flex size-6 cursor-pointer items-center justify-center rounded text-lg text-gray-500 select-none hover:bg-gray-100 hover:text-gray-800"
            >
                {isRawShown ? '▾' : '▸'}
            </button>
            <span className={result.place ? '' : 'text-gray-400'}>
                {result.place?.label ?? 'Skipped'}
            </span>
            {result.raws.length > 1 ? (
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                    {result.raws.length} raw results
                </span>
            ) : null}
            {isRawShown ? (
                <div className="flex flex-col gap-1">
                    {result.raws.map((raw, rawIndex) => (
                        <pre
                            key={rawIndex}
                            className="overflow-x-auto rounded bg-gray-100 p-2 text-xs"
                        >
                            {JSON.stringify(raw, null, 2)}
                        </pre>
                    ))}
                </div>
            ) : null}
        </li>
    );
};

export default SearchResultItem;
