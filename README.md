# NexProduct Admin

A React + Vite product dashboard. By default it uses DummyJSON as a demo API.

## What’s included

- Login screen and authenticated dashboard flow.
- Product catalog with search, category filters, sorting, pagination, and product details.
- Add, edit, and delete product flows, with demo changes saved in the current browser.
- NexProduct SVG logo and favicon.
- Configurable API base URL and error handling for API requests.
- Production build configuration and static-host deployment notes.

## Run locally

In PowerShell, from the project folder:

```sh
npm install
Copy-Item .env.example .env.local
npm run dev
```

Demo sign-in: `emilys` / `emilyspass`.

## Configuration

Set `VITE_API_BASE_URL` to the root URL of an API that implements the DummyJSON-compatible auth and product routes used by this app. The default is `https://dummyjson.com`. Values prefixed with `VITE_` are included in browser assets, so never put secrets in them.

## Build and deploy

```sh
npm run build
npm run preview
```

The build was verified with `npm run build`, and `npm audit` reported no known vulnerabilities at the time of review.

Deploy the generated `dist/` directory to a static host configured to serve `index.html` for application routes such as `/login` and `/products/1`. Configure the production `VITE_API_BASE_URL` at build time and allow the deployed origin in the API's CORS policy. Serve the site over HTTPS.

## Demo API limits

DummyJSON is a sample API, not a production data service. Its add, edit, and delete routes simulate mutations and do not persist them on the server. This app keeps those changes in browser `localStorage`, which is local to one browser and is not a substitute for shared durable storage. The demo login token is also stored in browser storage. For production accounts and real catalog data, connect a backend that persists changes and uses secure server-managed authentication (for example, HttpOnly, Secure, SameSite cookies), then update the client to match its API contract.

## Product list behavior

- Search, category, sort, order, and page are reflected in the URL.
- Search and category can be combined. Results are filtered and paginated consistently in the browser after loading the selected source set.
- Local demo mutations are overlaid on API data and survive refreshes in the same browser.
