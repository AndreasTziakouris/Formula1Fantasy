import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { clearStoredAuth, getAuthToken, getStoredUserRole } from "../lib/api";

export default function Layout() {
  const navigate = useNavigate();
  const isAuth = !!getAuthToken();
  const isAdmin = getStoredUserRole() === "admin";

  const handleLogout = () => {
    clearStoredAuth();
    navigate("/auth/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <Link to="/" className="text-xl font-bold tracking-tight">
            F1 Fantasy
          </Link>

          <ul className="hidden gap-6 md:flex">
            <li>
              <NavLink
                to="/fantasyTeams"
                className={({ isActive }) =>
                  isActive
                    ? "font-semibold text-red-400"
                    : "text-slate-300 hover:text-red-400"
                }
              >
                Teams
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/fantasyLeagues"
                className={({ isActive }) =>
                  isActive
                    ? "font-semibold text-red-400"
                    : "text-slate-300 hover:text-red-400"
                }
              >
                Leagues
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/help"
                className={({ isActive }) =>
                  isActive
                    ? "font-semibold text-red-400"
                    : "text-slate-300 hover:text-red-400"
                }
              >
                Help
              </NavLink>
            </li>
            {isAdmin ? (
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    isActive
                      ? "font-semibold text-amber-300"
                      : "text-slate-300 hover:text-amber-300"
                  }
                >
                  Admin
                </NavLink>
              </li>
            ) : null}
          </ul>

          <div className="flex items-center gap-4">
            {isAuth ? (
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm hover:bg-red-700"
              >
                Log Out
              </button>
            ) : (
              <Link
                to="/auth/login"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm hover:bg-red-700"
              >
                Log In
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1 p-4">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        <p>
          © {new Date().getFullYear()} F1 Fantasy · Fan-made full-stack
          recreation built with{" "}
          <a
            href="https://vitejs.dev/"
            className="text-red-500 underline hover:text-red-600"
            target="_blank"
            rel="noreferrer"
          >
            Vite
          </a>{" "}
          and Tailwind CSS
        </p>
      </footer>
    </div>
  );
}
