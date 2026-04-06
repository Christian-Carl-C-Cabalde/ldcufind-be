import dotenv from 'dotenv'
dotenv.config()

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'

// Import all route modules
import adminRoutes from './modules/admin/admin.routes.js'
import itemRoutes from './modules/item/item.routes.js'
import claimRoutes from './modules/claim/claim.routes.js'
import dashboardRoutes from './modules/dashboard/dashboard.routes.js'
import userRoutes from './modules/user/user.routes.js'

const app = new Hono()

// Enable CORS for Angular frontend
app.use('/*', cors({
  origin: 'http://localhost:4200',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Health check
app.get('/', (c) => {
  return c.text('LDCUFind API is running!')
})

// Mount all routes
app.route('/api/admin', adminRoutes)
app.route('/api/items', itemRoutes)
app.route('/api/claims', claimRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/users', userRoutes)

// Use PORT from .env, fallback to 3000
const port = Number(process.env.PORT) || 3000

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)