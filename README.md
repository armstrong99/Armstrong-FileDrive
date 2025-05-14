# 🌐 FileDrive – Cloud File Manager (DEMO PROJECT)

Welcome to **FileDrive**, a full-stack demo project that replicates cloud file storage features (like Google Drive or Dropbox). It includes folder hierarchy management, secure file uploads, and seamless integration with AWS S3 – all powered by **Next.js 14 App Router**, **TypeScript**, **Prisma**, **NextAuth**, and **React**.

---

## ✨ Demo

- 🔗 **Live App**: [https://armstrong-file-drive.vercel.app/](https://armstrong-file-drive.vercel.app/)
- 👤 **LinkedIn**: [https://www.linkedin.com/in/ndukwearmstrong/](https://www.linkedin.com/in/ndukwearmstrong/)

---

## 🚀 Features

### ✅ 1. PERFORMANCE-FOCUSED UI

- Utilized `React.memo`, `useCallback`, and `useMemo` to **minimize re-renders** and optimize render cycles.
- Leveraged **path-based caching** using `Map<string, FolderNode[]>` to avoid repeated tree reconstruction.
- Optimized **staging + upload flow** to prevent unnecessary DOM updates.

### ✅ 2. AUTHENTICATION VIA NEXTAUTH.JS + GOOGLE SSO

- Integrated `next-auth` with **Google SSO** for smooth and secure authentication.
- Ensured protected routes (like the dashboard) redirect unauthenticated users automatically.

### ✅ 3. AWS S3 INTEGRATION

- Created an **IAM user** on AWS with minimal permissions to access an **S3 bucket**.
- Upload functionality supports:
  - **Individual files**.
  - **Whole folders**, preserving internal structure.
- Files are uploaded to `uploads/{userId}/{relativePath}` with metadata stored in a No-SQL DB (Mongodb Atlas).

### ✅ 4. ADVANCED TREE BUILDING ALGORITHM

- Implemented a recursive algorithm to parse uploaded folders/files into a **nested folder tree**.
- Maps relative paths to structured `FolderNode` and `FileNode` objects with size aggregation and hierarchy logic.
- This enables an intuitive and scalable representation of complex folder structures.

### ✅ 5. REAL-TIME UI SYNC WITH PRISMA + DATABASE

- Used **Prisma ORM** for modeling Users and Files in a Postgres database.
- Every upload is:
  - Persisted in S3.
  - Logged with metadata in the database.
  - Synced immediately in the UI using local state and path mapping logic.

---

## 🛠️ How to Run Locally

> **Requirements:** Node.js 18+, MongoDB Atlas, AWS Account

1. **Clone this repo**

   ```bash
   git clone <repo-url>
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

Add values for:

Google OAuth credentials `(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)`

`AWS S3 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME, AWS_REGION)`

`NextAuth secrets and database URL`

4. **Set up Prisma**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the dev server**

   ```bash
   npm run dev
   ```

6. **Should be running now on:**

   ```bash
   Open: http://localhost:3000
   ```

## 📚 Tech Stack

- **Frontend**: React 19, Next.js 15 App Router, TailwindCSS, Toastify

- **Backend**: Next.js API Routes, NextAuth.js, Prisma

- **Storage**: AWS S3

- **Database**: Mongodb (via Prisma)

- **Authentication**: Google SSO (OAuth 2.0)
