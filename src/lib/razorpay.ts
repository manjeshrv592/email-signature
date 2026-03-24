import Razorpay from "razorpay";

// ═══════════════════════════════════════════
// Razorpay Client (lazy — avoids build-time crash)
// ═══════════════════════════════════════════

let _razorpay: Razorpay | null = null;

export function getRazorpay(): Razorpay {
    if (!_razorpay) {
        _razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });
    }
    return _razorpay;
}

// ═══════════════════════════════════════════
// Plan Configuration
// ═══════════════════════════════════════════

export type PlanTier = "starter" | "business" | "enterprise";
export type BillingCycle = "monthly" | "yearly";

export interface PlanConfig {
    tier: PlanTier;
    name: string;
    description: string;
    features: string[];
    maxUsers: number;
    prices: {
        monthly: number; // in paise (INR × 100)
        yearly: number;
    };
    // These come from Razorpay dashboard — populate after creating plans there
    razorpayPlanIds: {
        monthly: string;
        yearly: string;
    };
}

export const PLANS: PlanConfig[] = [
    {
        tier: "starter",
        name: "Starter",
        description: "For small teams getting started with email signatures",
        features: [
            "Up to 50 users",
            "1 signature template",
            "Basic rule engine",
            "Email support",
        ],
        maxUsers: 50,
        prices: {
            monthly: 410000, // ₹4,100
            yearly: 4100000, // ₹41,000 (2 months free)
        },
        razorpayPlanIds: {
            monthly: process.env.RAZORPAY_PLAN_STARTER_MONTHLY || "",
            yearly: process.env.RAZORPAY_PLAN_STARTER_YEARLY || "",
        },
    },
    {
        tier: "business",
        name: "Business",
        description: "For growing organizations with advanced needs",
        features: [
            "Up to 200 users",
            "Unlimited templates",
            "Full rule engine",
            "Dynamic resources",
            "Priority support",
        ],
        maxUsers: 200,
        prices: {
            monthly: 830000, // ₹8,300
            yearly: 8300000, // ₹83,000 (2 months free)
        },
        razorpayPlanIds: {
            monthly: process.env.RAZORPAY_PLAN_BUSINESS_MONTHLY || "",
            yearly: process.env.RAZORPAY_PLAN_BUSINESS_YEARLY || "",
        },
    },
    {
        tier: "enterprise",
        name: "Enterprise",
        description: "For large organizations with full control",
        features: [
            "Unlimited users",
            "Unlimited templates",
            "Full rule engine",
            "Dynamic resources",
            "Server-side injection",
            "Dedicated support",
        ],
        maxUsers: Infinity,
        prices: {
            monthly: 1660000, // ₹16,600
            yearly: 16600000, // ₹1,66,000 (2 months free)
        },
        razorpayPlanIds: {
            monthly: process.env.RAZORPAY_PLAN_ENTERPRISE_MONTHLY || "",
            yearly: process.env.RAZORPAY_PLAN_ENTERPRISE_YEARLY || "",
        },
    },
];

// ═══════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════

export function getPlanConfig(tier: PlanTier): PlanConfig | undefined {
    return PLANS.find((p) => p.tier === tier);
}

export function formatPrice(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN")}`;
}
