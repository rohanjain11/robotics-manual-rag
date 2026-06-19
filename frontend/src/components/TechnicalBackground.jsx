import WireframeField from './WireframeField';

/**
 * Visible technical background: animated wireframe field + light vignette for readability.
 */
export default function TechnicalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <WireframeField />

      {/* Soft center glow — industrial blue atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(91,127,166,0.07) 0%, transparent 65%)',
        }}
      />

      {/* Edge vignette — lighter than before so wireframe stays visible */}
      <div className="absolute inset-0 depth-vignette-light" />
    </div>
  );
}
