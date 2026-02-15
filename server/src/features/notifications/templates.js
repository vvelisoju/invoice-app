// Notification Template Registry & Interpolation
// Each template defines a templateKey, default title/body with {variable} placeholders,
// category (for icon mapping on frontend), and default targetType.

export const NOTIFICATION_TEMPLATES = {
  // ── Onboarding ────────────────────────────────────────────────────────
  welcome: {
    category: 'onboarding',
    targetType: 'USER',
    title: 'Welcome to Invoice Baba! 🎉',
    body: 'Your business {businessName} is ready. Create your first invoice now!',
  },

  // ── Plan & Billing ────────────────────────────────────────────────────
  plan_activated: {
    category: 'plan',
    targetType: 'USER',
    title: 'Plan Activated: {planName}',
    body: 'Your {planName} plan is now active. Enjoy premium features!',
  },
  plan_expiring_soon: {
    category: 'plan',
    targetType: 'USER',
    title: 'Plan Expiring Soon',
    body: 'Your {planName} plan expires on {expiryDate}. Renew to avoid interruption.',
  },
  plan_expired: {
    category: 'plan',
    targetType: 'USER',
    title: 'Plan Expired',
    body: 'Your {planName} plan has expired. Upgrade to continue using premium features.',
  },
  plan_changed_by_admin: {
    category: 'plan',
    targetType: 'USER',
    title: 'Plan Updated',
    body: 'Your plan has been changed to {planName} by the administrator.',
  },
  payment_success: {
    category: 'billing',
    targetType: 'USER',
    title: 'Payment Successful',
    body: '₹{amount} payment for {planName} received. Invoice #{invoiceNumber} generated.',
  },
  payment_failed: {
    category: 'billing',
    targetType: 'USER',
    title: 'Payment Failed',
    body: 'Your payment of ₹{amount} for {planName} failed. Please try again.',
  },

  // ── Usage Limits ──────────────────────────────────────────────────────
  usage_limit_warning: {
    category: 'usage',
    targetType: 'USER',
    title: 'Usage Limit Warning',
    body: "You've used {used}/{limit} invoices this month. Upgrade your plan for more.",
  },
  usage_limit_reached: {
    category: 'usage',
    targetType: 'USER',
    title: 'Monthly Limit Reached',
    body: "You've reached your {limit} invoice limit for this month. Upgrade to continue.",
  },

  // ── Account ───────────────────────────────────────────────────────────
  business_suspended: {
    category: 'account',
    targetType: 'BUSINESS',
    title: 'Account Suspended',
    body: 'Your business account has been suspended. Contact support for details.',
  },
  business_reactivated: {
    category: 'account',
    targetType: 'BUSINESS',
    title: 'Account Reactivated',
    body: 'Your business account is now active again. Welcome back!',
  },

  // ── Platform (Admin broadcasts) ───────────────────────────────────────
  new_feature: {
    category: 'platform',
    targetType: 'ALL',
    title: 'New Feature: {featureName}',
    body: '{description}',
  },
  maintenance: {
    category: 'platform',
    targetType: 'ALL',
    title: 'Scheduled Maintenance',
    body: 'Invoice Baba will be under maintenance on {date} from {startTime} to {endTime}.',
  },

  // ── Custom (Admin free-form) ──────────────────────────────────────────
  custom: {
    category: 'custom',
    targetType: 'ALL',
    title: '{title}',
    body: '{body}',
  },
}

/**
 * Interpolate {variable} placeholders in a string.
 * Missing variables are left as-is.
 */
function interpolate(template, variables = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match
  })
}

/**
 * Resolve a template by key with variable interpolation.
 * Returns { title, body, category } or null if template not found.
 */
export function resolveTemplate(templateKey, variables = {}) {
  const template = NOTIFICATION_TEMPLATES[templateKey]
  if (!template) return null

  return {
    templateKey,
    category: template.category,
    targetType: template.targetType,
    title: interpolate(template.title, variables),
    body: interpolate(template.body, variables),
  }
}

/**
 * List all available template keys with metadata (for admin UI).
 */
export function listTemplates() {
  return Object.entries(NOTIFICATION_TEMPLATES).map(([key, tmpl]) => ({
    templateKey: key,
    category: tmpl.category,
    targetType: tmpl.targetType,
    titlePattern: tmpl.title,
    bodyPattern: tmpl.body,
  }))
}
