# FinalWeb2025

An online learning platform built with Node.js, Express, Handlebars, and PostgreSQL.

## 1) System Overview

This project provides an e-learning platform with 3 user roles:

- Student: sign up/sign in, search courses, add to cart, purchase courses, learn through lectures, track progress, and submit feedback.
- Instructor: create/edit courses, manage lectures, and update profile information.
- Admin: manage users, categories, courses, and platform statistics.

The UI is rendered with Handlebars, sessions are handled by express-session, and database queries are executed through Knex.

## 2) Tech Stack

- Node.js (ESM)
- Express
- Express Handlebars
- PostgreSQL
- Knex
- Multer (upload)
- Nodemailer (OTP email sending)

## 3) Environment Requirements

- Node.js >= 18
- npm >= 9
- PostgreSQL (or Supabase PostgreSQL)

Quick check:

```bash
node -v
npm -v
```

## 4) Installation

```bash
npm install
```

## 5) Database Configuration

The database connection is currently hard-coded in `utils/db.js`.

You need to update the connection settings to match your environment:

- host
- port
- user
- password
- database

If you use local PostgreSQL, create a new database and update the corresponding connection settings in `utils/db.js`.

Notes:

- This project does not include migration/seed SQL files.
- You need to import an existing schema backup (if available) or create tables based on the current app structure.
- Tables referenced in the source code include: `users`, `courses`, `categories`, `lectures`, `purchased`, `watchlist`, `feedback`, `lecture_progress`, `enrollments`, `otp_tokens`, `instructors`.

## 6) OTP Email Configuration

The sign-up flow sends OTP codes via email. SMTP settings are currently hard-coded in `routes/account.route.js` (Mailtrap sandbox).

You should replace SMTP credentials with your own account before demo/deployment:

- host
- port
- user
- pass

If SMTP is not configured correctly, OTP verification during sign-up will fail.

## 7) Run the Project

Run in production mode:

```bash
npm start
```

Run in development mode (auto-restart):

```bash
npm run dev
```

By default, the app runs at:

```text
http://localhost:4000
```

## 8) Main Directory Structure

```text
app.js
controllers/
middlewares/
models/
routes/
utils/
views/
static/
uploads/
tools/
```

## 9) Roles and Permissions

The system routes users based on the `permission` field:

- `1` -> student
- `2` -> instructor
- `3` -> admin

After sign-in, users are redirected to their corresponding role page.

## 10) Common Issues

1. Database connection error

- Recheck connection settings in `utils/db.js`.
- Ensure PostgreSQL/Supabase is running and accepts connections.

2. OTP email is not sent during sign-up

- Verify SMTP settings in `routes/account.route.js`.
- Check network/firewall and SMTP account status.

3. HTTP 500 error page

- Check terminal logs for detailed stack traces.

## 11) Useful Commands

```bash
npm start        # Run the app
npm run dev      # Run in dev mode with nodemon
node tools/hash-fix.js   # Optional script to fix password hashes
```

## 12) Security Note

Sensitive information is currently hard-coded in the source (database credentials, SMTP credentials, session secret).
For production deployment, move these values to environment variables and use a `.env` file.
