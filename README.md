## Description

this project is a Node.js monorepo containing multiple packages. Add a brief description of its purpose and what problem it solves.

## Installation

This is a monorepo with multiple packages:

- `backend`
- `frontend`
- `(root)`

To install all dependencies:

```bash
# Install root dependencies
npm install

# Or install dependencies in each package
cd backend && npm install
cd frontend && npm install
cd . && npm install
```

## Usage

You can run the following scripts:

- `npm run dev` (available in: backend, frontend, (root))
- `npm start` (in backend)
- `npm run build` (in frontend)
- `npm run preview` (in frontend)
- `npm run dev:backend` (in (root))
- `npm run dev:frontend` (in (root))
- `npm run dev:ml` (in (root))
- `npm run install:all` (in (root))

## Dependencies

This project uses the following dependencies (across 3 packages):

- axios
- cors
- express
- mapbox-gl
- react
- react-dom
- socket.io
- socket.io-client

## Folder Structure

Project structure:

```
├── .gitignore
├── README.md
├── backend
│   ├── package-lock.json
│   ├── package.json
│   ├── src
│   │   ├── data
│   │   │   ├── ambulances.ts
│   │   │   └── hospitals.ts
│   │   ├── routes
│   │   │   └── emergency.ts
│   │   ├── server.ts
│   │   ├── services
│   │   │   ├── decisionEngine.ts
│   │   │   ├── mlService.ts
│   │   │   └── routeService.ts
│   │   ├── sockets
│   │   │   └── socketHandler.ts
│   │   └── types
│   │       └── index.ts
│   └── tsconfig.json
├── eslint.config.js
├── frontend
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── src
│   │   ├── App.tsx
│   │   ├── components
│   │   │   ├── AmbulanceMarker.tsx
│   │   │   ├── BottomPanel.tsx
│   │   │   ├── DecisionModal.tsx
│   │   │   ├── EmergencyButton.tsx
│   │   │   ├── ErrorModal.tsx
│   │   │   ├── InfoPanel.tsx
│   │   │   ├── LeftPanel.tsx
│   │   │   ├── MapView.tsx
│   │   │   ├── RightPanel.tsx
│   │   │   ├── RouteDisplay.tsx
│   │   │   └── TrafficWidget.tsx
│   │   ├── hooks
│   │   │   └── useEmergency.ts
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── services
│   │   │   ├── api.ts
│   │   │   └── socket.ts
│   │   ├── types
│   │   │   └── index.ts
│   │   └── utils
│   │       └── format.ts
│   ├── tailwind.config.js
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── ml-service
│   ├── app.py
│   ├── models
│   │   ├── __pycache__
│   │   │   └── eta_model.cpython-314.pyc
│   │   └── eta_model.py
│   ├── requirements.txt
│   └── utils
│       ├── __pycache__
│       │   └── feature_builder.cpython-314.pyc
│       └── feature_builder.py
├── package-lock.json
├── package.json
└── vite.config.ts
```

## License

Add your license information here.

## Built By

Built with ❤️ by @AryanSharma48