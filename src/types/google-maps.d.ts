import * as React from 'react';

export interface GmpxPlacePickerValue {
    formattedAddress?: string;
    displayName?: string;
    addressComponents?: Array<{
        longText: string;
        shortText: string;
        types: string[];
    }>;
}

export interface GmpxPlacePickerElement extends HTMLElement {
    value?: GmpxPlacePickerValue;
    addEventListener(type: 'gmpx-placechange', listener: () => void): void;
    removeEventListener(type: 'gmpx-placechange', listener: () => void): void;
}

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'gmpx-api-loader': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { key?: string; 'solution-channel'?: string }, HTMLElement>;
            'gmpx-place-picker': React.DetailedHTMLProps<React.HTMLAttributes<GmpxPlacePickerElement> & { placeholder?: string; class?: string }, GmpxPlacePickerElement>;
            'gmp-map': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { center?: string; zoom?: string | number; 'map-id'?: string }, HTMLElement>;
            'gmp-advanced-marker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}
