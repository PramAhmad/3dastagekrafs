export type UmkmStatus = "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE"

export type SubscriptionPlan = "TRIAL" | "PRO" | "ENTERPRISE"

export interface UmkmRegistration {
  id: string
  ownerName: string
  email: string
  phone: string // WhatsApp
  businessName: string
  businessCategory: string
  city: string
  fullAddress: string
  productDescription: string
  monthlyProductionEst: string
  nibOrDoc?: string
  status: UmkmStatus
  adminNotes?: string
  registeredAt: string
  reviewedAt?: string
  password?: string
  // Prototype Trial & Subscription (2-Week Trial Period)
  trialStartedAt?: string
  trialEndsAt?: string
  subscriptionPlan?: SubscriptionPlan
}
