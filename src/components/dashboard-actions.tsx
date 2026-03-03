'use client';

import { useState } from 'react';
import { continueCheckoutSession, deleteShipment } from '@/actions/checkout';
import { CreditCard, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DashboardActions({ shipmentId, status }: { shipmentId: string, status: string }) {
    const [isLoadingPay, setIsLoadingPay] = useState(false);
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);

    if (status !== 'quoted') return null;

    const router = useRouter();

    const handlePay = async () => {
        setIsLoadingPay(true);
        try {
            const result = await continueCheckoutSession(shipmentId);
            if (result?.error) {
                alert(result.error);
                console.error(result.error);
            }
        } catch (error) {
            console.error('Error continuing payment:', error);
        } finally {
            setIsLoadingPay(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta cotización?')) return;

        setIsLoadingDelete(true);
        try {
            const result = await deleteShipment(shipmentId);
            if (result?.error) {
                alert(result.error);
                console.error(result.error);
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error('Error deleting shipment:', error);
        } finally {
            setIsLoadingDelete(false);
        }
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handleDelete}
                disabled={isLoadingDelete || isLoadingPay}
                className="p-2 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                title="Eliminar cotización"
            >
                {isLoadingDelete ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
            <button
                onClick={handlePay}
                disabled={isLoadingDelete || isLoadingPay}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors disabled:opacity-50"
            >
                {isLoadingPay ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Pagar
            </button>
        </div>
    );
}
