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

// ¡CRÍTICO EN VERCEL! Evitar que la conexión con el bot webhook (ej n8n) muera por timeout
export const maxDuration = 60;

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

        // 2. System Prompt (Ajustado para respuestas de WhatsApp)
        const systemPrompt = `
      Eres el asistente virtual de LogiVelo, una empresa de envíos y logística internacional.
      Tu tono debe ser profesional, amable y directo. Usa emojis ocasionalmente (📦, ✈️, 🚚).

      CONTEXTO DEL USUARIO ACTUAL: ${userContext}

      Reglas:
      1. Si te piden tarifas, pide SIEMPRE: origen, destino, peso (kg) y medidas de la caja (largo x ancho x alto).
      2. No inventes precios ni fechas falsas. Si no tienes los datos, dile al usuario que puede cotizar exactamente en nuestra web: https://web-logistica-one.vercel.app/
      3. Si el usuario pregunta por su paquete y está en el CONTEXTO, indícale el tracking y estado exacto.
      4. Si el paquete está 'pending_payment' y pagó por Bizum, dile que estamos verificando el dinero (máx 2h).
      5. Fórmula Peso Volumétrico: (Largo x Ancho x Alto) / 5000. Se cobra el mayor entre real y volumétrico.
      6. Si preguntan por aduanas a Venezuela: Los envíos marítimos suelen ser puerta a puerta e incluyen gestión aduanal (RIF y factura).
      7. Si preguntan cómo pagar: Aceptamos Bizum, Transferencia y Tarjeta vía Stripe en nuestra web.
    `;

        // 3. Llamar a la IA
        const reply = await callGemini(message, systemPrompt);

        return NextResponse.json({ reply });

    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json(
            { reply: "Lo siento, mi sistema está en mantenimiento. 🛠️ Por favor, entra en nuestra web para gestionar tu envío: https://web-logistica-one.vercel.app/" },
            { status: 200 } // Devolvemos 200 para que n8n no falle por error y reciba el fallback
        );
    }
}
