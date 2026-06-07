import type { Access, FieldAccess } from 'payload'

/**
 * Access-control helpers for RockFlower Travels.
 *
 * Two auth collections exist:
 *  - `users`     → staff/operators (the only collection that can log into /admin)
 *  - `customers` → public riders (front-of-site auth, no admin access)
 *
 * Staff carry a `roles` array (`admin` | `operator`). Helpers below treat a
 * principal as staff ONLY when it came from the `users` collection, so a
 * signed-in customer can never satisfy a staff check by coincidence.
 */

type MaybeUser =
  | {
      collection?: string
      roles?: string[] | null
      id?: string | number
    }
  | null
  | undefined

const isStaffUser = (user: MaybeUser): boolean => user?.collection === 'users'

export const hasRole = (user: MaybeUser, role: string): boolean =>
  isStaffUser(user) && Array.isArray(user?.roles) && user!.roles!.includes(role)

/** Any authenticated staff member (admin or operator). */
export const isStaff: Access = ({ req: { user } }) =>
  isStaffUser(user) && (hasRole(user, 'admin') || hasRole(user, 'operator'))

/** Admins only. */
export const isAdmin: Access = ({ req: { user } }) => hasRole(user, 'admin')

/** Field-level admin check (boolean only). */
export const isAdminField: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin')

/** Public read — catalog content the marketing site renders for anyone. */
export const publicRead: Access = () => true

/**
 * Row-level read for customer-owned documents (bookings).
 * Staff see everything; a signed-in customer sees only their own rows; guests see nothing.
 */
export const isStaffOrOwnCustomer =
  (ownerField = 'customer'): Access =>
  ({ req: { user } }) => {
    if (isStaffUser(user)) {
      return hasRole(user, 'admin') || hasRole(user, 'operator')
    }
    if (user?.collection === 'customers' && user.id != null) {
      return { [ownerField]: { equals: user.id } }
    }
    return false
  }
