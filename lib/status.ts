export type DepartmentStatus = "green" | "amber" | "red";

export function getSalesStatus(
  activeDeals: number,
  dealsClosedThisWeek: number,
): DepartmentStatus {
  if (activeDeals >= 20 && dealsClosedThisWeek >= 5) return "green";
  if (activeDeals >= 10 || dealsClosedThisWeek >= 3) return "amber";
  return "red";
}

export function getOperationsStatus(overdueTasks: number): DepartmentStatus {
  if (overdueTasks <= 3) return "green";
  if (overdueTasks <= 8) return "amber";
  return "red";
}

export function getFinanceStatus(
  revenueAchievementPercentage: number,
): DepartmentStatus {
  if (revenueAchievementPercentage >= 90) return "green";
  if (revenueAchievementPercentage >= 70) return "amber";
  return "red";
}

export function getMarketingStatus(leadsGeneratedThisWeek: number): DepartmentStatus {
  if (leadsGeneratedThisWeek >= 100) return "green";
  if (leadsGeneratedThisWeek >= 50) return "amber";
  return "red";
}

export function getHRStatus(attendancePercentage: number): DepartmentStatus {
  if (attendancePercentage >= 90) return "green";
  if (attendancePercentage >= 80) return "amber";
  return "red";
}
