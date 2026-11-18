/**
 * Delivery capacity assumption (brief §60) — not workforce planning,
 * just a documented operational bottleneck pipeline math should
 * respect. A single, editable constant rather than a scheduling
 * system.
 */
export const MAX_CONCURRENT_DECISION_SPRINTS = 2;

export interface CapacityAssessment {
  activeSprintCount: number;
  maxConcurrentSprints: number;
  atCapacity: boolean;
  availableSlots: number;
}

export function assessCapacity(activeSprintCount: number, maxConcurrentSprints: number = MAX_CONCURRENT_DECISION_SPRINTS): CapacityAssessment {
  return {
    activeSprintCount,
    maxConcurrentSprints,
    atCapacity: activeSprintCount >= maxConcurrentSprints,
    availableSlots: Math.max(maxConcurrentSprints - activeSprintCount, 0),
  };
}
