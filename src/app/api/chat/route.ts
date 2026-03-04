import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const apiKey = process.env.GEMINI_API_KEY || "";

async function callGemini(prompt: string, systemInstruction: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    // Implementación con reintentos y exponencial backoff
    let delay = 1000;
    for (let i = 0; i < 5; i++) {
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text;
            }
        } catch (e) {
            // Error de red o similar
            console.error("Gemini attempt failed", e);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
    }
    throw new Error("Gemini API falló tras 5 reintentos");
}

export async function POST(req: Request) {
    try {
        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing from environment variables.");
            throw new Error("API Key missing");
        }

        const { message } = await req.json();
        const supabase = await createClient();

        // 1. Obtener contexto del usuario y sus últimos envíos
        const { data: { user } } = await supabase.auth.getUser();
        let userContext = "Usuario no identificado (visitante).";

        if (user) {
            const { data: shipments } = await supabase
                .from("shipments")
                .select("status, tracking_number, origin_data, destination_data, final_price")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(3);

            if (shipments && shipments.length > 0) {
                userContext = `El usuario es ${user.email}. Sus envíos recientes son: ${shipments.map(s => {
                    const originCity = typeof s.origin_data === 'object' && s.origin_data ? (s.origin_data as any).city : "desconocido";
                    const destCity = typeof s.destination_data === 'object' && s.destination_data ? (s.destination_data as any).city : "desconocido";
                    return `Tracking ${s.tracking_number} (Estado: ${s.status}, de ${originCity} a ${destCity})`;
                }).join(", ")}`;
            }
        }

        // 2. System Prompt (Basado en soporte_prompt_maestro.md)
        const systemPrompt = `
      Eres LogiBot, el asistente experto de LogiVelo. 
      CONTEXTO ACTUAL: ${userContext}
      
      REGLAS DE ORO:
      - Si el usuario pregunta por su paquete y está en el CONTEXTO, dale el tracking y estado exacto.
      - Si el paquete está 'pending_payment' y pagó por Bizum, dile que estamos verificando el dinero (máx 2h).
      - Fórmula Peso Volumétrico: (Largo x Ancho x Alto) / 5000. Explica que se cobra el mayor entre real y volumétrico.
      - Para Venezuela: Gestionamos RIF y factura comercial. Envíos tardan 7-12 días.
      - Sé amable, ejecutivo y usa un español profesional de España. No uses emojis excesivos.
    `;

        // 3. Llamar a la IA
        const reply = await callGemini(message, systemPrompt);

        return NextResponse.json({ reply });

    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json(
            { reply: "Lo siento, tengo problemas de conexión con mis servidores o falta configurar mi clave API. ¿Puedes repetirlo más tarde?" },
            { status: 500 }
        );
    }
}
