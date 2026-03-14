import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import { resolveAssetUrl } from "../../lib/assets";

const MAX_TEAMS = 3;

const FantasyTeamsList = () => {
  const [apiError, setApiError] = useState("");
  const [fantasyTeams, setFantasyTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadFantasyTeams = async () => {
      try {
        setLoading(true);
        setApiError("");

        const data = await apiRequest("/fantasyTeams/get-fantasy-teams", {
          auth: true,
        });

        if (!ignore) {
          setFantasyTeams(data.teams || []);
        }
      } catch (err) {
        if (!ignore) {
          setApiError(err.message || "Something went wrong");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadFantasyTeams();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h3 className="text-lg font-semibold text-slate-700">Loading teams...</h3>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-red-500">
          My Garage
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fantasy Teams</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Manage your active lineups, review cost-cap usage, and jump back
              into edits before the next round.
            </p>
          </div>
          <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
            Teams built:{" "}
            <span className="font-semibold text-slate-900">
              {fantasyTeams.length}/{MAX_TEAMS}
            </span>
          </div>
        </div>
      </header>

      {fantasyTeams.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            No fantasy teams yet
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Start with your first lineup and choose one driver for DRS double
            points.
          </p>
        </section>
      ) : (
        <ul className="space-y-6">
          {fantasyTeams.map((team, index) => {
            const drsDriver =
              team.f1Drivers.find((driver) => driver.doublePoints) ||
              team.f1Drivers[0];

            if (!drsDriver?.driverId) {
              return null;
            }

            const formattedName = `${drsDriver.driverId.name.charAt(0)}. ${drsDriver.driverId.surname.toUpperCase()}`;

            return (
              <li key={team._id || index}>
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Team #{index + 1}
                      </p>
                      <h2 className="text-xl font-bold text-slate-900">
                        {team.fantasyTeamName}
                      </h2>
                    </div>
                    <Link
                      to={`/fantasyTeams/view/${team._id}`}
                      className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800"
                    >
                      View Team
                    </Link>
                  </div>

                  <div className="grid gap-6 md:grid-cols-[180px,1fr]">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <div className="relative h-40 w-full">
                        <img
                          src={resolveAssetUrl(drsDriver.driverId.imageUrl)}
                          alt={formattedName}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute left-3 top-3 rounded-full bg-black/80 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
                          DRS x2
                        </span>
                      </div>
                      <div className="border-t border-slate-200 px-3 py-3">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {formattedName}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          ${Number(drsDriver.driverId.driverCost).toFixed(1)} M
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Remaining Budget
                        </p>
                        <p className="mt-2 text-2xl font-bold text-emerald-600">
                          ${Number(team.remainingBudget).toFixed(1)} M
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Transfers Left
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {team.remainingTransfers}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Total Points
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {team.totalPoints}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {fantasyTeams.length < MAX_TEAMS ? (
        <Link
          to="/fantasyTeams/new-team"
          className="inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Create New Team
        </Link>
      ) : (
        <p className="text-sm font-medium text-red-600">
          Maximum number of teams reached.
        </p>
      )}

      {apiError ? <p className="text-sm text-red-600">{apiError}</p> : null}
    </div>
  );
};

export default FantasyTeamsList;
