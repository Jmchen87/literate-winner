# React example of minikit

Apart from a frontend, you'll need a backend, this template contains an example of that as well

## To run, install:

- deps, `cd frontend;pnpm i;cd -;cd backend;pnpm i`
- ngrok - Create a free ngrok account, follow the official [docs](https://ngrok.com/docs/getting-started/)
- nginx - use you favorite package manager :)

### nginx setup

To serve multiple localhost applications through a single ngrok tunnel (only one available for free-tier users), you can use nginx as a reverse proxy. Follow the steps below to set it up:

### Run nginx

Use the config provided in the root of this repo
`sudo nginx -c full/path/to/this/repo/nginx.conf`
or, if you run the command from the root dir
`sudo nginx -c $(pwd)/nginx.conf`

To stop nginx run `sudo nginx -s stop`

### Tunnel through Ngrok

`ngrok http 8080`
The port doesn't matter, make sure it's the `listen` one from nginx config

## Phase 1: World ID proof verification

Use Node 22 and pnpm 9. Copy frontend/.env.example and backend/.env.example to .env in their respective directories. Set APP_ID and WORLD_ID_ACTION on the backend and the corresponding public VITE_WORLD_APP_ID and VITE_WORLD_ID_ACTION on the frontend. App ID must match the registered Mini App. The frontend app ID is reserved configuration for SDK integration; the existing MiniKit installation is unchanged. Keep the API base /api. Run pnpm install --frozen-lockfile in each directory, then pnpm dev in each. Vite proxies /api to localhost:3000. Existing nginx proxy can also be used. Do not expose backend directly to an untrusted network.

Run pnpm build in frontend and pnpm exec tsc --noEmit in backend. See World auth CI for smoke checks. Payments are disabled in both interfaces. Verification is proof validation only, not a login session; no persistent replay protection or account binding exists. The global in-memory rate limit is a temporary single-process safeguard, not a production abuse-control solution. Do not deploy for production until these gaps and SDK compatibility are resolved.
