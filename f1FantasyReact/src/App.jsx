import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Login from "./components/auth/login-form";
import Signup from "./components/auth/signup-form";
import Layout from "./components/layout";
import { ProtectedRoute, AdminRoute } from "./scripts/auth.jsx";
import FantasyTeamsList from "./components/fantasy-teams/fantasy-teams-list.jsx";
import FantasyTeamView from "./components/fantasy-teams/fantasy-team-view.jsx";
import FantasyTeamBuilder from "./components/fantasy-teams/fantasy-teams-builder.jsx";
import FantasyLeaguesList from "./components/fantasy-leagues/fantasy-league-list.jsx";
import FantasyLeagueView from "./components/fantasy-leagues/fantasy-league-view.jsx";
import FaqsPoints from "./components/help/faqs-points.jsx";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  Outlet,
} from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Outlet />}>
          <Route index element={<h1>404: Page not found</h1>} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="*" element={<h1>404: Page not found</h1>} />
        </Route>

        <Route element={<Layout />}>
          <Route element={<ProtectedRoute />}>
            <Route index element={<h1>home page</h1>} />{" "}
            {/*only logged in users*/}
            <Route path="/fantasyTeams" element={<Outlet />}>
              <Route index element={<FantasyTeamsList />} />
              <Route path="view/:teamId" element={<FantasyTeamView />} />
              <Route
                path="edit/:teamId"
                element={<FantasyTeamBuilder mode={"edit"} />}
              />
              <Route
                path="new-team"
                element={<FantasyTeamBuilder mode={"build"} />}
              />
            </Route>
            <Route path="/fantasyLeagues" element={<Outlet />}>
              <Route index element={<FantasyLeaguesList />} />
              <Route path="view/:leagueId" element={<FantasyLeagueView />} />
            </Route>
            <Route path="/help" element={<FaqsPoints />} />
            <Route path="*" element={<h1>404: Page not found</h1>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
