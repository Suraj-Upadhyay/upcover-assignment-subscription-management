# 💳 NestJS + Stripe Subscription System

This project is a high-performance implementation of a subscription-based API. It features a robust **Stripe Integration**, secure **JWT Authentication**, and a **Dockerized MongoDB** backend.

---

## 🏗️ Technical Architecture

To ensure scalability and maintainability, the following design decisions were made:

* **Module Encapsulation**: Stripe logic is isolated in a dedicated `StripeModule`. This prevents payment provider logic from leaking into core business modules.
* **Async Synchronization**: We utilize Stripe Checkout metadata to pass the internal `userId`. This ensures that when the asynchronous Webhook fires, we can accurately map the event back to our MongoDB user record.
* **Idempotency & Data Integrity**: 
    * **Webhook Handling**: Uses MongoDB `findOneAndUpdate` with `upsert: true` to ensure the handler is **idempotent**. Duplicate network retries from Stripe will not corrupt the database state.
    * **Double-Subscription Guard**: Implemented in `SubscriptionsService` to prevent users from initiating multiple active checkout sessions simultaneously.
* **Security**: All subscription endpoints (excluding Webhooks) are protected by a `JwtAuthGuard`. Webhooks utilize Stripe's signature verification to ensure requests are authentic and untampered.

---

## 🛠️ Prerequisites

Before starting, ensure you have the following installed:
* **Node.js** (v18 or higher)
* **Docker & Docker Compose**
* **Stripe CLI** ([Official Install Guide](https://stripe.com/docs/stripe-cli))

---

## 🐳 Step 1: Infrastructure (Docker)

The project uses Docker to provide a consistent database environment. 

1.  **Start MongoDB and Mongo Express**:
    ```bash
    docker-compose up -d
    ```
    * **MongoDB**: Accessible at `localhost:27017`
    * **Mongo Express (GUI)**: Accessible at `http://localhost:8081` (Login: `admin` / `password`)

---

## 🔑 Step 2: Environment Configuration

Create a `.env` file in the root directory. You can use the following template as a guide:

| Variable | Description |
| :--- | :--- |
| `PORT` | Local server port (default: `3000`) |
| `MONGODB_URI` | `mongodb://admin:password@localhost:27017/subscription_db?authSource=admin` |
| `JWT_SECRET` | Secure string for signing JWT tokens |
| `STRIPE_SECRET_KEY` | Your Stripe Secret Key from the dashboard |
| `STRIPE_WEBHOOK_SECRET` | Obtained from Stripe CLI (see Step 3) |
| `FRONTEND_URL` | `http://localhost:3000` |

---

## 📡 Step 3: Stripe CLI & Webhook Setup

Since Stripe cannot communicate with `localhost` directly, the Stripe CLI acts as a secure proxy to tunnel events.

1.  **Login to Stripe**:
    ```bash
    stripe login
    ```
2.  **Start the Webhook Listener**:
    ```bash
    stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
    ```
3.  **Capture the Secret**:
    The terminal will display: `Your webhook signing secret is whsec_....` 
    Copy this value into your `.env` as `STRIPE_WEBHOOK_SECRET`.

---

## 🏃 Step 4: Run the Application

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start in development mode**:
    ```bash
    npm run start:dev
    ```
3.  **API Documentation**:
    Access the Swagger UI at `http://localhost:3000/api/docs`.

---

## 🧪 Testing the Flow

1.  **Signup**: `POST /api/v1/auth/signup`. Creates a User in Mongo and a Customer in Stripe.
2.  **Login**: `POST /api/v1/auth/login`. Copy the returned `access_token`.
3.  **Get Plans**: `GET /api/v1/plans`. Note the ID (e.g., `basic`, `standard`, `premium`).
4.  **Checkout**: `POST /api/v1/subscriptions/checkout`.
    * **Headers**: `Authorization: Bearer <your_token>`
    * **Body**: `{"planId": "standard"}`
5.  **Pay**: Click the URL returned in the response. Use the test card: `4242 4242 4242 4242`.
6.  **Verify**: Check your NestJS console. You should see:
    `✅ Subscription activated for User: <user_id>`

---

## ✅ Unit Tests

Run the unit test suite to verify core logic and guards:
```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
