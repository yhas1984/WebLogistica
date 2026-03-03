import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Button,
} from "@react-email/components";
import * as React from "react";

interface LabelEmailProps {
    customerName: string;
    originCity: string;
    destCity: string;
    trackingNumber: string;
    labelUrl: string;
    carrierName: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://weblogistica.com";

export const LabelEmail = ({
    customerName = "Cliente",
    originCity = "Madrid",
    destCity = "Barcelona",
    trackingNumber = "TRK123456789",
    labelUrl = "https://example.com/label.pdf",
    carrierName = "Transportista",
}: LabelEmailProps) => {
    const trackingLink = `${baseUrl}/tracking/${trackingNumber}`;

    return (
        <Html>
            <Head />
            <Preview>Tu etiqueta de envío está lista para imprimir 📦</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={logoText}>WebLogística</Text>
                    </Section>

                    <Section style={content}>
                        <Heading style={heading}>¡Tu etiqueta está lista!</Heading>
                        <Text style={paragraph}>Hola {customerName},</Text>
                        <Text style={paragraph}>
                            El pago de tu envío desde <strong>{originCity}</strong> hasta <strong>{destCity}</strong> ha sido confirmado correctamente.
                        </Text>

                        <Section style={trackingBox}>
                            <Text style={trackingText}>Transportista: <strong>{carrierName}</strong></Text>
                            <Text style={trackingText}>Nº de Seguimiento: <strong>{trackingNumber}</strong></Text>
                        </Section>

                        <Section style={btnContainer}>
                            <Button style={button} href={labelUrl}>
                                Descargar Etiqueta (PDF)
                            </Button>
                        </Section>

                        <Text style={paragraph}>
                            <strong>Instrucciones importantes:</strong>
                        </Text>
                        <ul style={list}>
                            <li>Imprime la etiqueta en una hoja A4.</li>
                            <li>Pégala con cinta adhesiva transparente en la parte superior de la caja, asegurándote de no cubrir los códigos de barras.</li>
                            <li>El mensajero pasará a recoger el paquete o deberás llevarlo al punto de recogida según el servicio contratado.</li>
                        </ul>

                        <Text style={paragraph}>
                            Puedes hacer seguimiento de tu paquete en cualquier momento haciendo clic en el siguiente enlace:
                        </Text>
                        <Link style={anchor} href={trackingLink}>
                            Rastrear mi paquete
                        </Link>

                        <Hr style={hr} />
                        <Text style={footer}>
                            Si tienes alguna duda, responde a este correo o contacta con soporte.
                            <br />
                            © 2026 WebLogística. Todos los derechos reservados.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default LabelEmail;

// Estilos en línea para compatibilidad con gestores de correo
const main = {
    backgroundColor: "#f6f9fc",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "40px auto",
    padding: "0",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    maxWidth: "600px",
    overflow: "hidden",
};

const header = {
    backgroundColor: "#1d4ed8", // Un azul bonito (Tailwind blue-700)
    padding: "24px",
    textAlign: "center" as const,
};

const logoText = {
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0",
    letterSpacing: "1px",
};

const content = {
    padding: "32px",
};

const heading = {
    fontSize: "24px",
    letterSpacing: "-0.5px",
    lineHeight: "1.3",
    fontWeight: "400",
    color: "#1f2937",
    padding: "0",
    margin: "0 0 20px",
};

const paragraph = {
    margin: "0 0 16px",
    fontSize: "16px",
    lineHeight: "24px",
    color: "#4b5563",
};

const trackingBox = {
    background: "#f1f5f9",
    borderRadius: "6px",
    padding: "16px",
    margin: "24px 0",
};

const trackingText = {
    margin: "4px 0",
    fontSize: "15px",
    color: "#334155",
};

const btnContainer = {
    textAlign: "center" as const,
    margin: "32px 0",
};

const button = {
    backgroundColor: "#22c55e", // Verde (Tailwind green-500)
    borderRadius: "6px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "14px 28px",
};

const list = {
    color: "#4b5563",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 24px",
    paddingLeft: "24px",
};

const anchor = {
    color: "#2563eb",
    textDecoration: "underline",
};

const hr = {
    borderColor: "#e5e7eb",
    margin: "32px 0",
};

const footer = {
    color: "#9ca3af",
    fontSize: "13px",
    lineHeight: "20px",
    textAlign: "center" as const,
};
