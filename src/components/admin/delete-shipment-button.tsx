'use client';

import { Trash2 } from "lucide-react";

export function DeleteShipmentButton() {
    return (
        <button
            type="submit"
            title="Eliminar Envío"
            onClick={(e) => {
                if (!window.confirm('¿Seguro que deseas eliminar este envío? Esta acción no se puede deshacer.')) {
                    e.preventDefault();
                }
            }}
            className="p-1.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
