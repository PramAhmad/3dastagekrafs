export type UmkmStatus = "PENDING" | "APPROVED" | "REJECTED"

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
}
