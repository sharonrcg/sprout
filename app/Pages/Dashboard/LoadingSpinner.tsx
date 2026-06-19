import { Loader2 } from "lucide-react"

export const LoadingSpinner = () => {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '60vh',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <Loader2
        size={64}
        strokeWidth={1.5}
        style={{
          animation: 'spinner-spin 1s linear infinite',
          color: 'var(--sp-muted)',
        }}
      />
      
      <style>{`
        @keyframes spinner-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}