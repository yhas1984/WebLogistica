import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// ¡CRÍTICO EN VERCEL! Evitar que la conexión con el bot webhook (ej n8n) muera por timeout
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing from environment variables.");
            throw new Error("API Key missing");
        }

        const { message, sessionId, source = 'web' } = await req.json();

        if (!message || !sessionId) {
            return NextResponse.json({ error: "Faltan datos (message o sessionId)" }, { status: 400 });
        }

        const supabase = await createClient();
        const supabaseAdmin = await createServiceClient();

        // 1. Obtener contexto del usuario y sus últimos envíos
        const { data: { user } } = await supabase.auth.getUser();
        let userContext = "Usuario no identificado (visitante).";
        let senderId = sessionId;
        let senderName = "Visitante Web";

        if (user) {
            senderId = user.id;
            senderName = user.email || "Usuario Web";
            const { data: shipments } = await supabaseAdmin
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

        // 2. OBTENER HISTORIAL DE SUPABASE (Sincronización de Memoria)
        const { data: history } = await supabaseAdmin
            .from("chat_history")
            .select("role, content")
            .eq("session_id", senderId)
            .order("created_at", { ascending: false })
            .limit(10);

        const formattedHistory = history?.reverse().map(h =>
            `${h.role === 'user' ? 'Usuario' : 'LogiBot'}: ${h.content}`
        ).join("\n") || "";

        // 3. CONFIGURAR IA CON EL PROMPT MAESTRO Y MEMORIA
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const systemPrompt = `
      Eres LogiBot, asistente virtual de LogiVelo (WebLogistica.com), una empresa de envíos y logística internacional.
      Tu tono debe ser profesional, amable y directo. Usa emojis ocasionalmente (📦, ✈️, 🚚).

      CONTEXTO DEL USUARIO ACTUAL: ${userContext}
      
      HISTORIAL RECIENTE DE CONVERSACIÓN:
      ${formattedHistory}

      Reglas:
      1. Sé breve, usa emojis, no inventes trackings.
      2. Si te piden tarifas, pide SIEMPRE: origen, destino, peso (kg) y medidas de la caja (largo x ancho x alto).
      3. No inventes precios ni fechas falsas. Si no tienes los datos, dile al usuario que puede cotizar exactamente en nuestra web: https://web-logistica-one.vercel.app/
      4. Si el usuario pregunta por su paquete y está en el CONTEXTO, indícale el tracking y estado exacto.
      5. Si el paquete está 'pending_payment' y pagó por Bizum, dile que estamos verificando el dinero (máx 2h).
      6. Fórmula Peso Volumétrico: (Largo x Ancho x Alto) / 5000. Se cobra el mayor entre real y volumétrico.
      7. Si preguntan por aduanas a Venezuela: Los envíos marítimos suelen ser puerta a puerta e incluyen gestión aduanal (RIF y factura).
      8. Si preguntan cómo pagar: Aceptamos Bizum, Transferencia y Tarjeta vía Stripe en nuestra web.
    `;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        });
        const reply = result.response.text();

        // 4. GUARDAR EN EL HISTORIAL (Para memoria futura)
        try {
            await supabaseAdmin.from("chat_history").insert([
                { session_id: senderId, role: 'user', content: message, source },
                { session_id: senderId, role: 'assistant', content: reply, source }
            ]);
        } catch (historyError) {
            console.error("Error saving chat history:", historyError);
        }

        // 5. GUARDAR EN EL LOG DE SOPORTE (Para el Panel Admin)
        try {
            await supabaseAdmin.from("support_logs").insert({
                channel: source,
                sender_id: senderId,
                sender_name: senderName,
                message: message,
                ai_response: reply,
                resolved: false
            });
        } catch (logError) {
            console.error("Error saving support log:", logError);
        }

        return NextResponse.json({ reply });

    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json(
            { reply: "Lo siento, mi sistema está en mantenimiento. 🛠️ Por favor, entra en nuestra web para gestionar tu envío: https://web-logistica-one.vercel.app/" },
            { status: 200 }
        );
    }
}
