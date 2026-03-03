'use client';

import { useState, useTransition } from 'react';
import { CreditCard, Trash2, Loader2, X, AlertTriangle } from 'lucide-react';
import { continueCheckoutSession, deleteShipment } from '@/actions/checkout';

interface DashboardActionsProps {
    shipmentId: string;
    status: string;
}

export function DashboardActions({ shipmentId, status }: DashboardActionsProps) {
    const [isPaying, startPayTransition] = useTransition();
    const [isDeleting, startDeleteTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [deleted, setDeleted] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    if (deleted) {
        return (
            <div className="text-sm text-white/40 italic">Envío eliminado.</div>
        );
    }

    const handlePay = () => {
        setError(null);
        startPayTransition(async () => {
            const result = await continueCheckoutSession(shipmentId);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    const handleDelete = () => {
        setError(null);
        setShowConfirm(false);
        startDeleteTransition(async () => {
            const result = await deleteShipment(shipmentId);
            if (result?.error) {
                setError(result.error);
            } else if (result?.success) {
                setDeleted(true);
            }
        });
    };

    return (
        <>
            {/* Pay Button */}
            <button
                onClick={handlePay}
                disabled={isPaying || isDeleting}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white h-10 px-5 gap-2 shadow-lg shadow-amber-500/20"
            >
                {isPaying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <CreditCard className="h-4 w-4" />
                )}
                {isPaying ? 'Redirigiendo...' : 'Completar Pago'}
            </button>

            {/* Delete / Confirm */}
            {showConfirm ? (
                <div className="inline-flex items-center gap-2">
                    <span className="text-xs text-red-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        ¿Seguro?
                    </span>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white h-8 px-3 gap-1.5"
                    >
                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                    <button
                        onClick={() => setShowConfirm(false)}
                        className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:bg-white/10 text-white/50 h-8 px-2"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={isPaying || isDeleting}
                    className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed h-10 px-4 gap-2"
                >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                </button>
            )}

            {/* Error display */}
            {error && (
                <p className="w-full text-xs text-red-400 mt-1">{error}</p>
            )}
        </>
    );
}
