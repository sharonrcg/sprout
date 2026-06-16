const BookSkeleton = () => (
  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
    <div
      style={{
        width: 52,
        height: 78,
        borderRadius: 5,
        flexShrink: 0,
        background: 'var(--sp-line)',
        animation: 'sp-pulse 1.6s ease-in-out infinite',
      }}
    />
    <div style={{ paddingTop: 4, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          height: 15,
          width: '60%',
          borderRadius: 6,
          background: 'var(--sp-line)',
          animation: 'sp-pulse 1.6s ease-in-out infinite',
        }}
      />
      <div
        style={{
          height: 13,
          width: '38%',
          borderRadius: 6,
          background: 'var(--sp-line)',
          animation: 'sp-pulse 1.6s ease-in-out 0.2s infinite',
        }}
      />
    </div>
  </div>
)

export const ShelfSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    {[0, 1, 2].map(i => <BookSkeleton key={i} />)}
  </div>
)
