import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import { resolveAssetUrl } from "../../lib/assets";

const FantasyLeaguesList = () => {
  const [fantasyLeagues, setFantasyLeagues] = useState([]);
  const [filterJoinedLeagues, setFilterJoinedLeagues] = useState(false);
  const [filterLeagueType, setFilterLeagueType] = useState("all");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(true);

  const filteredLeagues = useMemo(() => {
    return fantasyLeagues.filter((league) => {
      if (filterLeagueType !== "all" && filterLeagueType !== league.leagueType) {
        return false;
      }

      if (filterJoinedLeagues && !league.joined) {
        return false;
      }

      return true;
    });
  }, [fantasyLeagues, filterJoinedLeagues, filterLeagueType]);

  useEffect(() => {
    let ignore = false;

    const loadLeagues = async () => {
      try {
        setLoading(true);
        setApiError("");

        const data = await apiRequest("/fantasyLeagues/get-all-leagues", {
          auth: true,
        });

        if (!ignore) {
          setFantasyLeagues(data.simplifiedFantasyLeagues || []);
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

    loadLeagues();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-red-500">
          League Hub
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Fantasy Leagues
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Browse official and community leagues, filter down to the competitions
          you joined, and drill into live leaderboards.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={filterJoinedLeagues}
            onChange={(event) => setFilterJoinedLeagues(event.target.checked)}
          />
          Joined only
        </label>

        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
          value={filterLeagueType}
          onChange={(event) => setFilterLeagueType(event.target.value)}
        >
          <option value="all">All types</option>
          <option value="official">Official</option>
          <option value="community">Community</option>
        </select>

        <span className="ml-auto text-sm text-slate-600">
          Showing{" "}
          <span className="font-semibold">{filteredLeagues.length}</span> of{" "}
          <span className="font-semibold">{fantasyLeagues.length}</span>
        </span>
      </div>

      {loading ? (
        <h3 className="text-lg font-semibold text-slate-700">Loading leagues...</h3>
      ) : null}

      {!loading && filteredLeagues.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">No leagues found</h2>
          <p className="mt-2 text-sm text-slate-600">
            Try changing the filters to see more competitions.
          </p>
        </section>
      ) : null}

      <ul className="space-y-4">
        {filteredLeagues.map((league) => (
          <li
            key={league.leagueId}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <img
              src={resolveAssetUrl(league.leagueImageURL)}
              alt={league.leagueName}
              className="h-52 w-full object-cover object-center"
            />

            <div className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/fantasyLeagues/view/${league.leagueId}`}
                    className="truncate text-xl font-bold text-slate-900 hover:text-red-500"
                  >
                    {league.leagueName}
                  </Link>
                  <p className="mt-1 text-sm text-slate-600">
                    Type:{" "}
                    <span className="font-medium text-slate-800">
                      {league.leagueType}
                    </span>
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    league.joined
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {league.joined ? "Joined" : "Open"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Entries
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {league.entryAmount}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 lg:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Rounds included
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {league.roundsIncluded
                      ?.map((round) => round.roundNumber)
                      .join(", ") || "—"}
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {apiError ? <p className="mt-4 text-sm text-red-600">{apiError}</p> : null}
    </div>
  );
};

export default FantasyLeaguesList;
