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
  
  // Build the display string parts separately to avoid formatting issues
  let prefix = '';
  let currencySuffix = showPrefix ? ` ${currency}` : '';
  
  // Handle positive amounts
  if (!isNegative) {
    prefix = showSign && dollars > 0 ? '+$' : '$';
    return (
      <span 
        className={cn(
          "font-mono tabular-nums", 
          dollars > 0 ? "text-green-600" : "text-muted-foreground",
          className
        )}
      >
        {prefix}{formattedValue}{currencySuffix}
      </span>
    );
  }
  
  // Handle negative amounts
  return (
    <span 
      className={cn(
        "font-mono tabular-nums", 
        "text-red-600",
        className
      )}
    >
      -${formattedValue}{currencySuffix}
    </span>
  );
}