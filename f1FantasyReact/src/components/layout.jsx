// src/components/Layout.jsx
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();
  const isAuth = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth/login");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* ---------- Navbar ---------- */}
      <header className="bg-gray-900 text-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <Link to="/" className="text-xl font-bold">
            F1 Fantasy
          </Link>

          {/* desktop links */}
          <ul className="hidden gap-6 md:flex">
            <li>
              <NavLink
                to="/fantasyTeams"
                className={({ isActive }) =>
                  isActive ? "font-semibold text-red-400" : "hover:text-red-400"
                }
              >
                Teams
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/fantasyLeagues"
                className={({ isActive }) =>
                  isActive ? "font-semibold text-red-400" : "hover:text-red-400"
                }
              >
                Leagues
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/help"
                className={({ isActive }) =>
                  isActive ? "font-semibold text-red-400" : "hover:text-red-400"
                }
              >
                Help
              </NavLink>
            </li>
          </ul>

          {/* auth buttons */}
          <div className="flex items-center gap-4">
            {isAuth ? (
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm hover:bg-red-700"
              >
                Log out
              </button>
            ) : (
              <Link
                to="/auth/login"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm hover:bg-red-700"
              >
                Log in
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* ---------- Routed content ---------- */}
      <main className="flex-1 bg-gray-50 p-4">
        <Outlet />
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="bg-gray-900 py-6 text-center text-sm text-gray-400">
        <p>
          © {new Date().getFullYear()} F1 Fantasy · Built with&nbsp;
          <a
            href="https://vitejs.dev/"
            className="text-red-400 underline hover:text-red-500"
            target="_blank"
            rel="noreferrer"
          >
            Vite
          </a>{" "}
          & Tailwind CSS
        </p>
      </footer>
    </div>
  );
}
