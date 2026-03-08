export default function PrintWatermark({ config, clinic }) {
  if (!config?.enabled) return null;

  const logoUrl = clinic?.logo_url;
  const opacity = config.opacity || 0.05;

  return (
    <div
      className="print-watermark"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {config.use_logo && logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          style={{ width: '300px', maxHeight: '300px', objectFit: 'contain' }}
        />
      ) : (
        <div style={{
          fontSize: '72px',
          fontWeight: 'bold',
          color: '#000',
          textAlign: 'center',
          transform: 'rotate(-30deg)',
          whiteSpace: 'nowrap',
        }}>
          {clinic?.name || ''}
        </div>
      )}
    </div>
  );
}
