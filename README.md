# Formula1Fantasy

Formula1Fantasy is a full-stack recreation of the core Formula 1 Fantasy experience. Users can sign up, build budget-constrained fantasy teams, assign a DRS driver, join leagues, and track points across race rounds. The project includes a public player-facing app and an admin area for managing constructors, drivers, race data, and round processing.

## Live Demo

- Frontend: `https://formula1fantasy-ten.vercel.app`
- Backend health check: `https://formula1fantasy.onrender.com/health`

Because the frontend and backend are running on free hosting, the first request after inactivity can be slow. If the app looks unresponsive on first load, open the backend health check once, wait up to a minute for the services to wake up, and then try the main app again.

## Demo Accounts

The deployed server is currently running on dummy data.

These accounts are public and are intended for exploring the sample environment:

- User account
  - Email: `user@gmail.com`
  - Password: `User1234!`
- Admin account
  - Email: `admin@gmail.com`
  - Password: `Admin1234!`

The admin account can modify the dummy database through the admin panel, so the live data should be treated as disposable.

## What The Project Does

### Player Features

- Sign up and log in with JWT-based authentication
- Create fantasy teams with 5 drivers and 2 constructors
- Stay within a budget cap enforced by the backend
- Choose one driver as the DRS multiplier pick
- View team history and round-by-round points
- Browse leagues, join leagues, and view league standings

### Admin Features

- Create constructors
- Create drivers and assign them to constructors
- Insert full race round data
- Run the two-step round processing flow after race entry
- Browse existing constructors, drivers, and race entries from the admin panel

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- React Hook Form
- Vercel

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcrypt
- Render
- MongoDB Atlas

## Project Structure

```text
Formula1Fantasy/
  f1Fantasy/        # Express + MongoDB backend
  f1FantasyReact/   # React + Vite frontend
```

## How To Use The App

### As a user

1. Open the live frontend.
2. Sign in with the sample user account or create your own account.
3. Create a fantasy team by selecting 5 drivers and 2 constructors.
4. Choose one driver as the DRS pick.
5. Save the team and review its budget, roster, and round history.
6. Browse available leagues and join one with a selected fantasy team.

### As an admin

1. Sign in with the admin account.
2. Open `/admin`.
3. Add constructors and drivers if you want to change the dummy dataset.
4. Create a race round by entering driver and constructor scoring data.
5. Process a round to apply those results to fantasy teams and league tables.

## How Scoring Works In This Project

This project stores race round data in the database and then applies that data to fantasy teams and leagues through an admin workflow. It is not connected to an official live Formula 1 data feed.

In practice, the flow is:

1. An admin creates or updates the season data set.
2. An admin inserts a completed race round.
3. The first admin processing endpoint updates every eligible fantasy team by writing that round's score into the fantasy team schema and recalculating team totals.
4. The second admin processing endpoint walks through the affected leagues, applies the league-level scoring rules, updates entry totals, and refreshes the leaderboard ordering.

In a real deployed setting, that kind of round processing can be handled as a short operational window of roughly 5 to 10 minutes, even when the system is serving a much larger user base.

## Running It Locally

Local setup is possible, but the project is mainly intended to be tried through the deployed version.

### Prerequisites

- Node.js
- A MongoDB instance

### Backend setup

Create a `.env` file inside `f1Fantasy/` with:

```env
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
CURRENT_ROUND_NUMBER=1
```

Then run:

```bash
cd f1Fantasy
npm install
npm run dev
```

The backend runs on `http://localhost:3000` by default.

### Frontend setup

If you want the frontend to talk to a local backend, create a `.env` file inside `f1FantasyReact/` with:

```env
VITE_API_URL=http://localhost:3000
```

Then run:

```bash
cd f1FantasyReact
npm install
npm run dev
```

The frontend runs on the Vite development server, usually `http://localhost:5173`.

## Notes About The Current Live Version

- The deployed app uses dummy data.
- The demo accounts are public.
- The admin account can change the dummy data at any time.
- The project is intended as a portfolio-quality full-stack application, not a production fantasy platform.

## Known Limitations

- The live environment is not connected to real-time F1 data.
- The dummy dataset may change because the public admin account can modify it.
- The backend and frontend are deployed separately.
- The free hosting setup may introduce cold starts after inactivity.
