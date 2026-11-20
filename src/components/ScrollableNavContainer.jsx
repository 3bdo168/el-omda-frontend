import React from 'react';
import { ScrollableRow } from './ScrollableRow';

/**
 * Backward-compatible wrapper delegating to `ScrollableRow` in `tabs` mode.
 */
export const ScrollableNavContainer = ({
  children,
  className = '',
  containerClassName = '',
  variant = 'amber',
  scrollAmountRatio = 0.75,
  activeKey = null,
  activeSelector = '',
  ariaLabel = '',
  ...rest
}) => (
  <ScrollableRow
    mode="tabs"
    variant={variant}
    className={className}
    containerClassName={containerClassName}
    scrollAmountRatio={scrollAmountRatio}
    activeKey={activeKey}
    activeSelector={activeSelector}
    ariaLabel={ariaLabel}
    {...rest}
  >
    {children}
  </ScrollableRow>
);
