import React from 'react';

/**
 * FullPageDualPrintWrapper
 *
 * Renders a print form on two separate full pages:
 * - Page 1: "ORIGINAL COPY" (full A4 page)
 * - Page 2: "PHOTOCOPY" (full A4 page)
 *
 * Use this when the form has too much content (e.g. many medicines)
 * to fit in the half-page dual-copy layout.
 */
export default function FullPageDualPrintWrapper({ children }) {
  return (
    <div className="full-page-dual-wrapper">
      {/* Page 1 - Original Copy */}
      <div className="full-page-section">
        <div className="full-page-label" style={{
          textAlign: 'center',
          fontSize: '8pt',
          fontWeight: 'bold',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#374151',
          fontFamily: 'Arial, sans-serif',
          paddingBottom: '4px',
        }}>
          Original Copy
        </div>
        {children}
      </div>

      {/* Page 2 - Photocopy */}
      <div className="full-page-section">
        <div className="full-page-label" style={{
          textAlign: 'center',
          fontSize: '8pt',
          fontWeight: 'bold',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#374151',
          fontFamily: 'Arial, sans-serif',
          paddingBottom: '4px',
        }}>
          Photocopy
        </div>
        {children}
      </div>
    </div>
  );
}
