import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const alt = 'WebLogistica - Envíos Inteligentes al Mejor Precio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
            >
                {/* Background grid */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Logo */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        marginBottom: 40,
                    }}
                >
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span style={{ fontSize: 36, fontWeight: 700, color: 'white' }}>
                        Web<span style={{ color: '#a78bfa' }}>Logistica</span>
                    </span>
                </div>

                {/* Main heading */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                    }}
                >
                    <span
                        style={{
                            fontSize: 56,
                            fontWeight: 800,
                            color: 'white',
                            lineHeight: 1.1,
                            marginBottom: 16,
                        }}
                    >
                        Envíos al{' '}
                        <span
                            style={{
                                background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #818cf8)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            mejor precio
                        </span>
                    </span>
                    <span
                        style={{
                            fontSize: 56,
                            fontWeight: 800,
                            color: 'white',
                            lineHeight: 1.1,
                            marginBottom: 24,
                        }}
                    >
                        en segundos
                    </span>
                    <span
                        style={{
                            fontSize: 22,
                            color: 'rgba(255,255,255,0.5)',
                            maxWidth: 700,
                            textAlign: 'center',
                        }}
                    >
                        Compara tarifas de +50 transportistas en tiempo real
                    </span>
                </div>

                {/* Stats bar */}
                <div
                    style={{
                        display: 'flex',
                        gap: 48,
                        marginTop: 48,
                        padding: '16px 32px',
                        borderRadius: 16,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    {[
                        { value: '50+', label: 'Transportistas' },
                        { value: '200+', label: 'Países' },
                        { value: '40%', label: 'Ahorro' },
                    ].map((stat) => (
                        <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: 28, fontWeight: 700, color: '#a78bfa' }}>{stat.value}</span>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        ),
        { ...size }
    );
}
