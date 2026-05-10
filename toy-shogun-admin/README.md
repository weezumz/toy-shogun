# Toy Shogun — Hobby Shop Management System

Toy Shogun is a React-based hobby shop management dashboard built with Supabase for authentication and data storage. It provides inventory control, point-of-sale checkout, user administration, category management, and audit logging in a single app.

## System Overview

### Core Capabilities
- Secure email/password login with Supabase Auth
- Protected customer-facing and admin pages behind authentication
- Inventory management with product CRUD, stock status, and category assignment
- Point of Sale workflow with cart, payment selection, stock deduction, receipt generation, and transaction recording
- User management for admin and staff accounts
- Category management for product organization
- Audit logging of system actions, including inserts, updates, and deletes

### Main Pages
- `/login` — user login page
- `/` — Dashboard summary page
- `/inventory` — Inventory management
- `/pos` — Point of Sale checkout
- `/users` — User administration
- `/audit` — Audit log history
- `/categories` — Category management

### Key Architecture
- `src/App.js` — route setup + protected route handling
- `src/context/AuthContext.js` — global authentication state and session management
- `src/supabaseClient.js` — Supabase client initialization
- `src/components/Layout.js` — shared page layout and sidebar container
- `src/components/Sidebar.js` — application navigation and logout
- `src/hooks/useAuditLog.js` — reusable audit logging helper

### Backend Model Assumptions
The app expects the following Supabase tables:
- `products`
- `categories`
- `transactions`
- `transaction_items`
- `receipts`
- `users`
- `audit_logs`

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
