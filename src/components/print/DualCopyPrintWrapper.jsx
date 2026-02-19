import React from 'react';

/**
 * DualCopyPrintWrapper
 *
 * Wraps a print form component and renders it twice on a single A4 page:
 * - Top half: "ORIGINAL COPY"
 * - Dashed cut line separator
 * - Bottom half: "PHOTOCOPY"
 *
 * Usage:
 *   <DualCopyPrintWrapper>
 *     <GuaranteeLetter account={...} assistance={...} currentUser={...} />
 *   </DualCopyPrintWrapper>
 */
export default function DualCopyPrintWrapper({ children }) {
  return (
    <div className="dual-copy-print-wrapper">
      {/* Top Half - Original Copy */}
      <div className="dual-copy-form-section">
        <div className="dual-copy-label" style={{
          textAlign: 'center',
          fontSize: '7pt',
          fontWeight: 'bold',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#374151',
          fontFamily: 'Arial, sans-serif',
          paddingBottom: '2px',
        }}>
          Original Copy
        </div>
        <div className="dual-copy-form-content">
          {children}
        </div>
      </div>

      {/* Cut Line Separator */}
      <div className="dual-copy-separator" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '3px 0',
      }}>
        <div style={{
          flex: 1,
          borderTop: '1.5px dashed #6b7280',
        }} />
        <span style={{
          fontSize: '6.5pt',
          color: '#6b7280',
          fontFamily: 'Arial, sans-serif',
          whiteSpace: 'nowrap',
          letterSpacing: '0.5px',
        }}>
          &#9986; CUT HERE
        </span>
        <div style={{
          flex: 1,
          borderTop: '1.5px dashed #6b7280',
        }} />
      </div>

      {/* Bottom Half - Photocopy */}
      <div className="dual-copy-form-section">
        <div className="dual-copy-label" style={{
          textAlign: 'center',
          fontSize: '7pt',
          fontWeight: 'bold',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#374151',
          fontFamily: 'Arial, sans-serif',
          paddingBottom: '2px',
        }}>
          Photocopy
        </div>
        <div className="dual-copy-form-content">
          {children}
        </div>
      </div>
    </div>
  );
}
