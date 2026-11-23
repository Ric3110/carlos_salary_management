'use strict';


const MONTHS_PER_YEAR = 12n;
const WORKING_DAYS_PER_YEAR = 314n;
const HOURS_PER_DAY = 8n;
const MINUTES_PER_HOUR = 60n;

function toCentavos(amount) {
  const value = String(amount);
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) {
    throw new Error(`Invalid non-negative monetary value returned by database: ${value}`);
  }
  return BigInt(match[1]) * 100n + BigInt((match[2] || '').padEnd(2, '0'));
}

function roundDiv(numerator, denominator) {
  return (numerator + denominator / 2n) / denominator;
}

function centsToDecimal(value) {
  const whole = value / 100n;
  const fraction = (value % 100n).toString().padStart(2, '0');
  return `${whole}.${fraction}`;
}

function centsToPeso(value) {
  const whole = (value / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = (value % 100n).toString().padStart(2, '0');
  return `₱${whole}.${fraction}`;
}

function rateBreakdown(monthlyCentavos) {
  const annual = monthlyCentavos * MONTHS_PER_YEAR;
  const cents = {
    monthly: monthlyCentavos,
    annual,
    daily: roundDiv(annual, WORKING_DAYS_PER_YEAR),
    hourly: roundDiv(annual, WORKING_DAYS_PER_YEAR * HOURS_PER_DAY),
    per_minute: roundDiv(
      annual,
      WORKING_DAYS_PER_YEAR * HOURS_PER_DAY * MINUTES_PER_HOUR,
    ),
  };
  return {
    monthly: centsToDecimal(cents.monthly),
    annual: centsToDecimal(cents.annual),
    daily: centsToDecimal(cents.daily),
    hourly: centsToDecimal(cents.hourly),
    per_minute: centsToDecimal(cents.per_minute),
    
    formatted: {
      monthly: centsToPeso(cents.monthly),
      annual: centsToPeso(cents.annual),
      daily: centsToPeso(cents.daily),
      hourly: centsToPeso(cents.hourly),
      per_minute: centsToPeso(cents.per_minute),
    },
  };
}

module.exports = { toCentavos, rateBreakdown };
