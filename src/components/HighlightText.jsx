import React from 'react';
import { highlightMatch } from '../utils/arabicSearch';

const VARIANT_CLASSES = {
  emerald: 'bg-emerald-100 text-emerald-900',
  purple: 'bg-purple-100 text-purple-900',
  amber: 'bg-amber-100 text-amber-900',
  inverse: 'bg-white/25 text-white',
};

/**
 * Renders text with normalized Arabic search matches highlighted cleanly.
 */
export const HighlightText = ({
  text,
  query,
  variant = 'emerald',
  markClassName = '',
}) => {
  const safeText = text ?? '';
  if (!query || !String(query).trim()) {
    return <>{safeText}</>;
  }

  const segments = highlightMatch(safeText, query);
  const highlightClasses =
    markClassName || VARIANT_CLASSES[variant] || VARIANT_CLASSES.emerald;

  return (
    <>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark
            key={i}
            className={`${highlightClasses} rounded-sm px-0.5 font-extrabold`}
            style={{ textDecoration: 'none' }}
          >
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        )
      )}
    </>
  );
};
