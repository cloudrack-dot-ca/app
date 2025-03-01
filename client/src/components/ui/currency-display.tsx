import React from 'react';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
  showSign?: boolean;
  showPrefix?: boolean;
  noCents?: boolean;
}

/**
 * CurrencyDisplay component for consistent currency formatting
 * 
 * Accepts an amount in cents and formats it as a currency string
 * 
 * @param amount - The amount in cents to display
 * @param currency - The currency code to display (default: "USD")
 * @param className - Additional CSS classes
 * @param showSign - Whether to show + for positive values
 * @param showPrefix - Whether to show the currency code
 * @param noCents - Whether to hide cents (round to whole numbers)
 */
export function CurrencyDisplay({
  amount,
  currency = "USD",
  className,
  showSign = false,
  showPrefix = true,
  noCents = false
}: CurrencyDisplayProps) {
  // Convert cents to dollars
  const dollars = amount / 100;
  
  // Format the value with the appropriate sign
  const isNegative = dollars < 0;
  const absoluteValue = Math.abs(dollars);
  const formattedValue = noCents 
    ? Math.round(absoluteValue).toString()
    : absoluteValue.toFixed(2);
  
  // Determine the sign to show
  let sign = '';
  if (isNegative) {
    sign = '-';
  } else if (showSign && dollars > 0) {
    sign = '+';
  }
  
  // Format with the currency symbol and sign
  const displayValue = `${sign}$${formattedValue}${showPrefix ? ` ${currency}` : ''}`;
  
  return (
    <span 
      className={cn(
        "font-mono tabular-nums", 
        isNegative ? "text-red-600" : (dollars > 0 ? "text-green-600" : "text-muted-foreground"),
        className
      )}
    >
      {displayValue}
    </span>
  );
}