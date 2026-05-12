# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Overview

Three packages, each deployed independently to Vercel:

| Package | Purpose | URL |
|---|---|---|
| `toy-shogun-store/` | Public-facing e-commerce storefront | toy-shogun.vercel.app |
| `toy-shogun-admin/` | Internal staff/admin panel | toy-shogun-admin.vercel.app |
| `toy-shogun-server/` | Express API server (PayMongo + webhooks) | toy-shogun-server.vercel.app |

## Development Commands

Each package is independent — run from inside the package directory:

```bash
# Store (runs on :3000)
cd toy-shogun-store && npm start

# Admin (runs on :3001 if store is also running)
cd toy-shogun-admin && npm start

# Server (runs on :4000)
cd toy-shogun-server && node index.js

# Tests (store or admin)
cd toy-shogun-store && npm test
```

There is no root-level dev script — open three terminals.

## Environment Variables

**`toy-shogun-store/.env` and `toy-shogun-admin/.env`:**
```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
```

**`toy-shogun-server/.env`:**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PAYMONGO_SECRET_KEY=
PORT=4000
```

The server uses the **service role key** (bypasses RLS). The React apps use the **anon key** (subject to RLS).

## Architecture

### toy-shogun-store (React 19, CRA)

Public storefront — no login required for browsing or checkout. Two React contexts:

- **`AuthContext`** — optional Supabase auth for account pages (`/account`, `/account/orders`). Provides `user`, `signIn`, `signUp`, `signOut`.
- **`CartContext`** — localStorage-persisted cart. Provides `cartItems`, `addToCart`, `updateQuantity`, `removeFromCart`, `clearCart`, `cartTotal`, `cartCount`.

**Checkout flow:**
1. User fills form → inserts row into `online_orders` + rows into `online_order_items` directly via Supabase anon client
2. Calls `toy-shogun-server.vercel.app/create-payment` with `{ amount, orderId, customerName }`
3. Server creates a PayMongo payment link → returns `{ paymentLink, linkId }`
4. Store updates `online_orders.paymongo_link_id`, clears cart, redirects user to PayMongo

**Payment completion** is handled by the server webhook — the store just shows `/checkout/success` on redirect back.

### toy-shogun-admin (React 19, CRA + Bootstrap 5)

Protected by Supabase auth. Two route guard wrappers in `App.js`:
- `PrivateRoute` — any authenticated user
- `AdminRoute` — requires `role === 'admin'` (fetched from `users` table)

**`AuthContext`** — provides `user`, `role`, `logout`, `loading`. Fetches role from `public.users` on login. Defaults unknown roles to `'staff'` (note: the DB check constraint only allows `'admin'` | `'customer'`, so staff accounts need to use `'admin'` role in DB).

**`useNotifications` hook** — fetches from `notifications` table and subscribes to real-time inserts via a Supabase postgres_changes channel. Used in the Sidebar for the notification bell.

**`ImageUpload` component** — client-side image compression (max 1200px, JPEG 0.82 quality) before upload to Supabase Storage bucket `images`. Used in Inventory and Events pages.

### toy-shogun-server (Express 5, CommonJS)

Single file: `index.js`. Uses Supabase service role client.

**`POST /create-payment`** — Creates a PayMongo payment link. Required body: `{ amount, orderId, customerName }`. Returns `{ paymentLink, linkId }`.

**`POST /webhook/paymongo`** — PayMongo calls this on payment events. On `link.payment.paid`:
1. Finds order by `paymongo_link_id`
2. Updates `payment_status → 'paid'`, `status → 'confirmed'`
3. Calls `decrement_stock` RPC for each item in `online_order_items`
4. Inserts a `payment_confirmed` notification

CORS is configured to allow localhost:3000/3001 and both Vercel domains.

## Supabase Database (Project: `idksgwdzvyzazlydoywf`, region: ap-southeast-1)

All tables have RLS enabled. Key tables:

| Table | Purpose |
|---|---|
| `users` | Mirrors `auth.users`. `role` ∈ `{admin, customer}` |
| `products` | `is_published` controls store visibility; `is_preorder` + `preorder_release_date` for pre-orders |
| `categories` | Product categories, FK from `products.category_id` |
| `online_orders` | Store orders. `payment_status` ∈ `{pending,paid,failed,refunded}`, `status` ∈ `{pending,confirmed,processing,ready,completed,cancelled}`, `delivery_method` ∈ `{pickup,courier}` |
| `online_order_items` | Line items for online orders |
| `reservations` | Pre-order reservations. `status` ∈ `{pending,confirmed,cancelled}` |
| `notifications` | Admin notification feed. `type` ∈ `{new_order, payment_confirmed, pickup_ready, lbc_shipped, reservation_confirmed, reservation_cancelled, preorder_available}` |
| `transactions` | In-store POS transactions (separate from online orders) |
| `transaction_items` | Line items for in-store transactions |
| `receipts` | Receipts linked 1:1 to transactions |
| `audit_logs` | Action log with `old_data`/`new_data` JSONB |
| `events` | Tournament/gaming events. `is_published` controls store visibility |

**DB Functions:**
- `generate_sku` — trigger that auto-generates `ID-XXXXXXXX` SKU if none provided
- `get_user_role` — returns `role` for `auth.uid()`, used in RLS policies
- `decrement_stock(p_product_id, p_quantity)` — RPC called by the server webhook after payment

## Key Patterns

- **Direct Supabase from client** — both React apps query Supabase directly (no proxy). The server is only used for PayMongo (which requires the secret key).
- **No styling framework in store** — the store uses inline styles throughout. The admin uses Bootstrap/react-bootstrap components.
- **Product visibility** — only products with `is_published = true` appear in the store. Pre-orders appear on `/preorders` when `is_preorder = true`.
- **User accounts are optional in store** — checkout is guest-friendly. `online_orders.user_id` is nullable and set when the customer is logged in.
