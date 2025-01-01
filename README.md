# Budgetly API

The official API for Budgetly, a financial management platform designed to help users monitor, plan, and optimize their finances. This API serves as the backend engine, providing secure and efficient endpoints for user authentication, transaction management, budget planning, savings insights, and AI-driven financial recommendations.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)

### Features

- User Management
- Transaction Management
- Budget Planning
- Savings Insights
- AI Financial Advisor

### Tech Stack

- Backend: Node.js with Express.js
- Database: Firestore (Cloud Firestore by Google Firebase)
- Authentication: Firebase Authentication with JWT Support
- AI Integration: Google's Generative AI (Gemini AI)
- Utilities: Multer for file uploads, bcrypt for password hashing, and rate-limiting for enhanced security.

### Getting Started

1. Clone the repository

```bash
git clone https://github.com/yourusername/budgetly-api.git
cd budgetly-api
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables: Create a `.env` file in the root directory for Google API key.

```bash
GENERATIVE_AI_KEY=your_google_ai_api_key
```

4. Set up Firebase: Create a Firebase project and enable Firestore and Authentication. Add the Service Account key to the project root directory as `serviceAccountKey.json`.

4. Start the server

```bash
npm run dev
```

5. The server should now be running on `http://localhost:3000`

### API Endpoints

- User Management

  - POST `/api/users/register` - Register a new user
  - POST `/api/users/login` - Login an existing user
  - GET `/api/users/:id` - Get user details by ID
  - PUT `/api/users/:id` - Update user details by ID
  - DELETE `/api/users/:id` - Delete a user by ID

- Transaction Management

  - POST `/api/transactions` - Add a new transaction
  - GET `/api/transactions` - Get all transactions
  - GET `/api/transactions/:id` - Get a transaction by ID
  - PUT `/api/transactions/:id` - Update a transaction by ID
  - DELETE `/api/transactions/:id` - Delete a transaction by ID

- Budget Planning

  - POST `/api/budgets` - Create a new budget
  - GET `/api/budgets` - Get all budgets
  - GET `/api/budgets/:id` - Get a budget by ID
  - PUT `/api/budgets/:id` - Update a budget by ID
  - DELETE `/api/budgets/:id` - Delete a budget by ID

- Savings Insights

  - GET `/api/savings` - Get savings insights

- AI Financial Advisor
  - POST `/api/ai/generate` - Generate financial advice
  - POST `/api/ai/predict-budget` - Predict next month's budget
  - POST `/api/ai/suggest-savings` - Suggest ways to save money
  - POST `api/ai/chat-finance` - Chat with the AI financial advisor
