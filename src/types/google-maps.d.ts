import * as React from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'gmpx-api-loader': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { key?: string, 'solution-channel'?: string }, HTMLElement>;
            'gmpx-place-picker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { placeholder?: string, class?: string }, HTMLElement>;
            'gmp-map': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { center?: string, zoom?: string | number, 'map-id'?: string }, HTMLElement>;
            'gmp-advanced-marker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}
