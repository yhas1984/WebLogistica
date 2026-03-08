import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { purchaseLabel } from "@/actions/purchase-label";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret!);
  } catch (err: any) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Evento crítico: El usuario ha pagado con éxito
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const shipmentId = session.metadata?.shipmentId;

    if (shipmentId) {
      console.log(`🔔 Pago confirmado para el envío: ${shipmentId}`);
      
      const supabase = await createServiceClient();

      // 1. Actualizamos el estado a 'paid' y guardamos el ID de pago de Stripe
      const { error: updateError } = await supabase
        .from("shipments")
        .update({ 
          status: "paid", 
          stripe_payment_id: session.id 
        })
        .eq("id", shipmentId);

      if (updateError) {
        console.error('[Stripe Webhook] DB update error:', updateError);
        return NextResponse.json({ error: 'DB update error' }, { status: 500 });
      }

      // 2. DISPARO AUTOMÁTICO: Generación de etiqueta
      // Esta función llamará a Genei/Shippo/Packlink y cobrará de tu saldo/tarjeta
      try {
        const result = await purchaseLabel(shipmentId);
        if (result.success) {
          console.log(`✅ Etiqueta generada automáticamente para ${shipmentId}`);
        } else {
          console.error(`⚠️ Error en generación automática: ${result.error}`);
          // Aquí el estado quedaría en 'paid' pero sin etiqueta, 
          // lo que permite al admin intervenir manualmente desde el panel.
        }
      } catch (error) {
        console.error("❌ Fallo crítico post-pago:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
