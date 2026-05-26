export type NetworkRole = 'player' | 'captain' | 'staff' | 'admin'

export interface VerificationPermission {
  canVerifyGraph: boolean
  canPublishProfiles: boolean
  canViewPlayerNetwork: boolean
}

const PERMISSIONS: Record<NetworkRole, VerificationPermission> = {
  player: {
    canVerifyGraph: false,
    canPublishProfiles: false,
    canViewPlayerNetwork: true,
  },
  captain: {
    canVerifyGraph: true,
    canPublishProfiles: true,
    canViewPlayerNetwork: true,
  },
  staff: {
    canVerifyGraph: true,
    canPublishProfiles: true,
    canViewPlayerNetwork: true,
  },
  admin: {
    canVerifyGraph: true,
    canPublishProfiles: true,
    canViewPlayerNetwork: true,
  },
}

export function getDevPermission(role: NetworkRole): VerificationPermission {
  return PERMISSIONS[role]
}

export function isPublishRole(role: string): role is 'captain' | 'staff' | 'admin' {
  return role === 'captain' || role === 'staff' || role === 'admin'
}
