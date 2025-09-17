# Stabylink Project (v4.0)

## Setup

1.  Run `npm run setup` in the root directory to install all dependencies for both frontend and backend.
2.  Create a `.env` file in the **root project directory** by copying the `.env.example` file.
3.  Fill in your database credentials, email service details, and other required keys in the root `.env` file.
4.  Create an empty database in your database management tool (like phpMyAdmin for MySQL or pgAdmin for PostgreSQL).
5.  Run the database migrations to create all necessary tables by executing the following command from the **root directory**:
    ```bash
    npm run db:migrate --workspace=backend
    ```

## Running the Application

### For Development
-   Run `npm run dev` from the root directory. This will start both the frontend and backend servers concurrently with hot-reloading.

### For Production
-   **Step 1: Build the application.** Run the following command from the root directory:
    ```bash
    npm run build
    ```
    This will build the frontend and copy the static files to the backend's public directory.
-   **Step 2: Start the server.** Run the following command:
    ```bash
    npm start
    ```
    This will start the Node.js server, which will serve both the API and the frontend application.