"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          color: "#f5f5f5",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            textAlign: "center",
            border: "1px solid rgba(212, 175, 55, 0.15)",
            borderRadius: "16px",
            padding: "40px 28px",
            background:
              "linear-gradient(145deg, rgba(22,22,22,0.92) 0%, rgba(14,14,14,0.96) 100%)",
          }}
        >
          <div
            style={{
              margin: "0 auto 20px",
              width: "360px",
              maxWidth: "88%",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/aljamali-qr-logo.png"
              alt="Al Jamali QR"
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#d4af37",
            }}
          >
            Al Jamali QR
          </p>
          <h1
            style={{
              margin: "12px 0 0",
              fontSize: "24px",
              fontWeight: 700,
              color: "#f5f5f5",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: "14px",
              lineHeight: 1.6,
              color: "rgba(245,245,245,0.55)",
            }}
          >
            A critical error occurred. Please try again — if the problem
            continues, contact support.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "24px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              borderRadius: "12px",
              border: "none",
              background:
                "linear-gradient(135deg, #e8c547 0%, #d4af37 50%, #b8942e 100%)",
              padding: "12px 28px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#050505",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
