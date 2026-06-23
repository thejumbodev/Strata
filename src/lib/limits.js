export const PLAN_LIMITS = {
  free:       { channels: 1,        cards: 20,       members: 3        },
  pro:        { channels: Infinity, cards: Infinity, members: 25       },
  enterprise: { channels: Infinity, cards: Infinity, members: Infinity },
}

export const getPlanLimits = (plan) => PLAN_LIMITS[plan] || PLAN_LIMITS.free
