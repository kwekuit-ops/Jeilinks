"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ marginBottom: '10px' }}>Fatal Server Error</h1>
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #f5c6cb',
            maxWidth: '600px',
            wordBreak: 'break-all',
            fontFamily: 'monospace'
          }}>
            {error.message || "A fatal error occurred in the root layout."}
          </div>
          <button 
            onClick={() => reset()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Try Refreshing
          </button>
        </div>
      </body>
    </html>
  );
}
