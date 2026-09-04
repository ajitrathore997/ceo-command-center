function getPositiveNumber(name: string): number {
  const value = Number(process.env[name]);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be configured as a positive number.`);
  }

  return value;
}

function getNonNegativeInteger(name: string): number {
  const value = Number(process.env[name]);

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be configured as a non-negative integer.`);
  }

  return value;
}

export function getDashboardConfig() {
  return {
    monthlyRevenueTarget: getPositiveNumber("MONTHLY_REVENUE_TARGET"),
    openPositions: getNonNegativeInteger("OPEN_POSITIONS"),
  };
}
