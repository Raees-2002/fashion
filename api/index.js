const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cors = require('cors')

dotenv.config()

const authRouter = require('./routes/auth') 
const userRouter = require('./routes/user') 
const productRouter = require('./routes/product') 
const cartRouter = require('./routes/cart') 
const orderRouter = require('./routes/order')
const checkoutRouter = require('./routes/checkout')

const { 
  handleMalformedJson,
  formatCelebrateErrors
} = require('./middlewares/handleError')

const app = express()

// Environment variables
const PORT = process.env.PORT || 5000
const DB_URL = process.env.DB_URL
const SERVICE_NAME = process.env.SERVICE_NAME || "fashion-backend"
const VERSION = process.env.VERSION || "v1"

// Validate required env variables
if (!DB_URL) {
  console.error("ERROR: DB_URL is not defined in .env")
  process.exit(1)
}

// MongoDB connection
mongoose.set('strictQuery', true)

mongoose.connect(DB_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true
})
.then(() => console.log(`Connected to database (${SERVICE_NAME} ${VERSION})`))
.catch(err => {
  console.error("Database connection failed:", err)
  process.exit(1)
})

// Global middlewares
app.use(cors())
app.use(express.json())
app.use(handleMalformedJson)

// Health endpoint (REQUIRED for Kubernetes, Load Balancer, CI/CD)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: SERVICE_NAME,
    version: VERSION,
    timestamp: new Date(),
    uptime: process.uptime()
  })
})

// Server status endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: SERVICE_NAME,
    version: VERSION
  })
})

// Routes
app.use("/api/auth", authRouter)
app.use("/api/users", userRouter)
app.use("/api/products", productRouter)
app.use("/api/carts", cartRouter)
app.use("/api/orders", orderRouter)
app.use("/api/checkout", checkoutRouter)

// Celebrate validation error formatter
app.use(formatCelebrateErrors)

// Start server
app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} ${VERSION} running on port ${PORT}`)
})
