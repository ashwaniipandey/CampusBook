# 📚 CampusBook — Student Textbook Marketplace & Exchange Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8.13-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-white?style=for-the-badge&logo=socket.io)](https://socket.io/)

> **CampusBook** is a full-stack, peer-to-peer textbook marketplace built exclusively for university students. Buy, sell, swap, and donate textbooks directly within your campus community to save money, reduce waste, and connect with fellow students.

---

## 🌟 Key Features

### 🛒 Marketplace & Book Discovery
- **Multi-Type Listings**: Sell for cash, request course book exchanges, or list books for free student donation.
- **Advanced Search & Filtering**: Real-time 400ms debounced search on title, author, ISBN, and course code with filters for campus university, category, condition, price range, listing type, and semester.
- **Dynamic Sorting & Pagination**: Sort by newest arrivals, price (low-high / high-low), or popularity with bookmarkable URL query state.
- **Detailed Book Pages**: Image galleries, condition ratings (`New`, `Like New`, `Good`, `Fair`, `Poor`), university course specifications, price savings calculations, and similar book recommendations.

### 🛍️ Cart, Wishlist & Campus Orders
- **Persistent Cart & Wishlist**: Add books to cart or wishlist with instant badge counts and optimistic UI updates.
- **Direct & Cart Checkout**: Place orders directly (`Buy Now` modal) or checkout the entire cart at once.
- **Safe Campus Handover**: Specify campus pickup locations (e.g., University Library, Student Union) and meetup notes.
- **Order Lifecycle Management**: Role-based state transitions (`placed` ➔ `confirmed` ➔ `completed` or `cancelled`) with automated book availability and sold state tracking.

### 🔄 Book Exchanges & Smart Matching
- **Automated Match Engine**: Scans active listings to automatically pair students looking to exchange textbooks for their upcoming semester courses.
- **Exchange Requests**: Send, accept, or decline 1-to-1 book swap requests with customized exchange proposals.

### 🎁 Free Textbook Donations
- **Community Giveaways**: Dedicated channel for seniors and graduating students to donate course books to incoming peers.
- **Need-Based Requests**: Submit donation requests with personal statement/reason, and donor approval workflow.

### 💬 Real-Time Campus Chat (Socket.io)
- **Instant Messaging**: Real-time peer-to-peer messaging between buyers, sellers, and exchange partners.
- **Rich Chat Features**: Typing indicators, online status, unread message badges, and direct links to active listings and orders.

### ⭐ Trust, Reviews & Student Verification
- **Peer Reviews & Ratings**: 1–5 star reviews and feedback left by buyers upon order completion; dynamically updates seller reputation score.
- **University Verification**: Campus email verification and student ID upload workflow with verified student badges.

### 🛡️ Comprehensive Admin Portal
- **Platform Analytics**: Interactive visual charts (revenue, active users, top universities, conversion metrics).
- **Listing Moderation**: Review, approve, or reject pending book submissions before they appear publicly.
- **Entity Management**: Full CRUD for universities, categories, users, orders, exchange requests, and donation claims.
- **User Moderation & Reports**: Suspend or reactivate users, review user reports, and resolve campus transaction disputes.

---

## 🏗️ Architecture & Monorepo Structure

CampusBook is organized as a monorepo separated into `client` (frontend) and `server` (backend):

```
CampusBook/
├── client/                     # Next.js 14 App Router Frontend
│   ├── public/                 # Static assets & illustrations
│   └── src/
│       ├── app/                # Next.js App Router pages & layouts
│       │   ├── (auth)/         # login, signup, verify-otp, forgot-password, reset-password
│       │   ├── admin/          # Admin portal (dashboard, books, users, orders, reports...)
│       │   ├── books/[id]/     # Dynamic book detail & order modal page
│       │   ├── cart/           # Shopping cart & checkout
│       │   ├── dashboard/      # Student overview dashboard
│       │   ├── donations/      # Free textbook donation catalog & requests
│       │   ├── exchanges/      # Book exchange requests & proposals
│       │   ├── exchange-matches/# Smart algorithm exchange match feed
│       │   ├── explore/        # Marketplace search & filter catalog
│       │   ├── messages/       # Socket.io chat interface & conversation rooms
│       │   ├── my-books/       # Student listing inventory & manager
│       │   ├── notifications/  # Notification center
│       │   ├── orders/         # Buying & Selling order tracker
│       │   ├── profile/        # Public and student user profile
│       │   ├── sell/           # 5-step book listing upload wizard
│       │   ├── settings/       # Account, email, and password settings
│       │   ├── verify/         # Student ID campus verification
│       │   └── wishlist/       # Saved textbooks wishlist
│       ├── components/         # Reusable UI components (Navbar, Footer, ProtectedRoute...)
│       ├── context/            # AuthContext, CartContext, SocketContext
│       ├── hooks/              # Custom React hooks (debounce, toast, media query...)
│       ├── lib/                # API client (withCredentials fetch wrapper) & utilities
│       └── types/              # Shared TypeScript interfaces & types
│
├── server/                     # Node.js + Express Backend
│   └── src/
│       ├── config/             # Database (Mongoose), Cloudinary, & Socket.io setup
│       ├── controllers/        # Express route controllers (MVC)
│       ├── docs/               # Swagger / OpenAPI specification
│       ├── middlewares/        # Auth (JWT), rate limiting, upload (Multer), error handler
│       ├── models/             # Mongoose schemas (Book, User, Order, Review, Chat...)
│       ├── routes/             # Express API routes
│       ├── scripts/            # Database migration & utility scripts
│       ├── seeds/              # Seed data for universities, categories, users & books
│       ├── services/           # Socket.io events, email notifications, smart matching
│       ├── utils/              # Email transporter, tokens, custom AppError
│       ├── validations/        # Zod request validation schemas
│       ├── app.js              # Express application configuration
│       └── server.js           # Server entry point & HTTP/Socket.io listener
│
└── README.md                   # Project documentation
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom emerald/green campus theme
- **Icons**: [Lucide React](https://lucide.dev/)
- **State & Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) resolvers
- **Real-Time**: [Socket.io Client](https://socket.io/docs/v4/client-api/)
- **Charts & Animations**: [Recharts](https://recharts.org/), [Framer Motion](https://www.framer.com/motion/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose 8](https://mongoosejs.com/)
- **Authentication**: JWT stored in `httpOnly` secure cookies + Bearer token support
- **Real-Time Communication**: [Socket.io](https://socket.io/)
- **File Uploads**: [Multer](https://github.com/expressjs/multer) + [Cloudinary](https://cloudinary.com/)
- **Security**: [Helmet](https://helmetjs.github.io/), CORS, Express Mongo Sanitize, HPP, Express Rate Limit, Bcrypt.js
- **Documentation**: Swagger UI (`/api/docs`)
- **Testing**: [Jest](https://jestjs.io/), [Supertest](https://github.com/ladjs/supertest), [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

---

## 🚀 Quick Start Guide

### Prerequisites
Make sure you have installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` (or a remote MongoDB Atlas connection URI)

---

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/CampusBook.git
cd CampusBook
```

---

### 2. Configure Environment Variables

#### Backend (`server/.env`)
Create `server/.env` by copying `server/.env.example`:
```bash
cp server/.env.example server/.env
```
Populate the configuration values:
```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://127.0.0.1:27017/campusbook
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# Optional: Cloudinary image uploads (if omitted, default placeholders are used)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: SMTP email delivery (console logging used in development if omitted)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_user
EMAIL_PASS=your_pass
EMAIL_FROM="CampusBook <no-reply@campusbook.edu>"
```

#### Frontend (`client/.env.local`)
Create `client/.env.local` by copying `client/.env.example`:
```bash
cp client/.env.example client/.env.local
```
Set the API and Socket server URLs:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

---

### 3. Install Dependencies

#### Install Backend Packages:
```bash
cd server
npm install
```

#### Install Frontend Packages:
```bash
cd ../client
npm install
```

---

### 4. Seed the Database
Populate the database with sample universities (Stanford, MIT, Berkeley, Harvard...), academic categories, student accounts, and textbook listings:
```bash
cd ../server
npm run seed
```

> **Seeded Test Credentials**:
> - **Student Account**: `alex.johnson@stanford.edu` / `StudentPass123!` (or check console output of seed script)
> - **Admin Account**: `admin@campusbook.edu` / `AdminPass123!`

---

### 5. Run the Application

#### Start the Express Backend (Port 5001):
```bash
cd server
npm run dev
```
*Backend will start on `http://localhost:5001` with API at `http://localhost:5001/api`.*

#### Start the Next.js Frontend (Port 3000):
In a separate terminal:
```bash
cd client
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## 📡 API Reference Overview

| Module | Method | Endpoint | Description | Access |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Register new student | Public |
| **Auth** | `POST` | `/api/auth/login` | Student / Admin login (sets JWT cookie) | Public |
| **Auth** | `GET` | `/api/auth/me` | Fetch authenticated session | Private |
| **Auth** | `POST` | `/api/auth/logout` | Clear auth cookie | Private |
| **Books** | `GET` | `/api/books` | Search, filter, and paginate marketplace books | Public |
| **Books** | `GET` | `/api/books/filters-meta` | Aggregated metadata & facet counts | Public |
| **Books** | `GET` | `/api/books/:id` | Single book details with views count & rating | Public / Opt Auth |
| **Books** | `GET` | `/api/books/:id/similar` | Up to 6 recommended similar textbooks | Public |
| **Books** | `POST` | `/api/books` | Create listing (multipart with up to 5 images) | Private |
| **Books** | `GET` | `/api/books/my` | Current user's book inventory | Private |
| **Books** | `PATCH` | `/api/books/:id/mark-sold` | Mark book as sold | Private (Owner) |
| **Wishlist** | `GET` | `/api/wishlist` | Get user's saved wishlist | Private |
| **Wishlist** | `POST` | `/api/wishlist/:bookId` | Add book to wishlist | Private |
| **Wishlist** | `DELETE`| `/api/wishlist/:bookId` | Remove book from wishlist | Private |
| **Cart** | `GET` | `/api/cart` | Get shopping cart & total amount | Private |
| **Cart** | `POST` | `/api/cart/:bookId` | Add book to shopping cart | Private |
| **Cart** | `DELETE`| `/api/cart/:bookId` | Remove item from cart | Private |
| **Cart** | `DELETE`| `/api/cart` | Clear entire shopping cart | Private |
| **Orders** | `POST` | `/api/orders` | Place single book or checkout cart order | Private |
| **Orders** | `GET` | `/api/orders?role=buying\|selling`| List user orders | Private |
| **Orders** | `PATCH`| `/api/orders/:id/status` | Confirm, cancel, or complete order | Private |
| **Reviews**| `POST` | `/api/reviews` | Submit rating & review for completed order | Private (Buyer) |
| **Reviews**| `GET` | `/api/users/:id/reviews` | Get public reviews for a seller | Public |
| **Exchanges**| `POST`| `/api/exchanges` | Create book exchange request | Private |
| **Exchanges**| `GET` | `/api/exchanges/matches`| Smart algorithm matching exchanges | Private |
| **Donations**| `POST`| `/api/donations` | Request a free donated book | Private |
| **Chat** | `GET` | `/api/conversations` | List user chat conversations | Private |
| **Chat** | `GET` | `/api/conversations/:id/messages`| Fetch chat messages | Private |
| **Admin** | `GET` | `/api/admin/analytics/overview` | Platform KPI stats & metrics | Admin Only |
| **Admin** | `PATCH`| `/api/admin/books/:id/status` | Approve / Reject book listing | Admin Only |

*Interactive Swagger documentation can be viewed at `http://localhost:5001/api/docs` when `ENABLE_DOCS=true`.*

---

## 🧪 Testing & Code Quality

### Backend Tests
CampusBook includes comprehensive automated test coverage with Jest, Supertest, and an in-memory MongoDB runner:
```bash
cd server
npm test
```
To run tests with code coverage analysis:
```bash
npm run test:coverage
```

### TypeScript Type-Checking
Verify zero TypeScript compilation errors on the client:
```bash
cd client
npx tsc --noEmit
```

---

## 🔒 Security Practices

- **HTTP-Only Cookies**: Authentication tokens are stored in `httpOnly`, `SameSite=Lax` cookies to prevent XSS-based credential theft.
- **Data Sanitization**: `express-mongo-sanitize` defends against NoSQL injection vectors.
- **HTTP Parameter Pollution Protection**: `hpp` protects against HTTP parameter pollution.
- **Strict Rate Limiting**: Built-in rate limiters on auth, checkout, and search endpoints protect against brute-force attacks and abuse.
- **Secure File Uploads**: Image uploads are handled in-memory and strictly validated by MIME type (JPEG/PNG/WEBP) and file size (max 5MB) before transmission to Cloudinary.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Distributed freely for academic and university community use.

