import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const FantasyLeagueView = () => {
  const { leagueId } = useParams();

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [league, setLeague] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Join modal state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState("");
  const [myTeams, setMyTeams] = useState([]);

  // --------- fetch league + leaderboard ----------
  const fetchLeague = async () => {
    try {
      setLoading(true);
      setApiError("");
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/fantasyLeagues/get-league/${leagueId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch league");
      // Expecting { league, leaderboard } even if no entries (leaderboard: [])
      setLeague(data.league || null);
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeague();
  }, [leagueId]);

  // --------- open picker + fetch user teams on demand ----------
  const openTeamPicker = async () => {
    try {
      setIsPickerOpen(true);
      if (myTeams.length > 0) return; // already loaded
      setTeamsLoading(true);
      setTeamsError("");
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:3000/fantasyTeams/get-fantasy-teams",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch teams");
      setMyTeams(data.teams || []);
    } catch (err) {
      setTeamsError(err.message || "Something went wrong");
    } finally {
      setTeamsLoading(false);
    }
  };

  const joinWithTeam = async (fantasyTeamId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:3000/fantasyLeagues/join-league",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ leagueId, fantasyTeamId }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to join league");
      setIsPickerOpen(false);
      // Refresh to reflect updated entryAmount + leaderboard
      fetchLeague();
    } catch (err) {
      // show error inline in the modal area for clarity
      setTeamsError(err.message || "Something went wrong");
    }
  };

  const roundsIncludedText = useMemo(() => {
    const rounds = league?.rules?.roundsIncluded || [];
    if (!rounds.length) return "—";
    return rounds.map((r) => r.roundNumber).join(", ");
  }, [league]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      {loading ? (
        <h3>Loading...</h3>
      ) : apiError ? (
        <p className="text-sm text-red-600">{apiError}</p>
      ) : !league ? (
        <p className="text-sm text-gray-600">League not found.</p>
      ) : (
        <>
          {/* ---------- Header / League info ---------- */}
          <section className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Image banner */}
            <div className="relative h-48 w-full">
              <img
                src={league.leagueImageURL}
                alt={league.leagueName}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                <div>
                  <h1 className="text-2xl font-bold text-white drop-shadow">
                    {league.leagueName}
                  </h1>
                  <p className="text-sm font-medium text-white/90">
                    {league.leagueType}
                  </p>
                </div>

                {/* Join button (you’ll handle already-joined/maxTeams later) */}
                <button
                  onClick={openTeamPicker}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
                >
                  Join League
                </button>
              </div>
            </div>

            {/* Quick stats bar */}
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs text-gray-500">Max Teams</p>
                <p className="text-base font-semibold text-gray-800">
                  {league?.rules?.maxTeams ?? "—"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs text-gray-500">Rounds Included</p>
                <p className="text-base font-semibold text-gray-800">
                  {roundsIncludedText}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs text-gray-500">Entries</p>
                <p className="text-base font-semibold text-gray-800">
                  {league.entryAmount}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-base font-semibold text-gray-800">
                  {league.leagueType}
                </p>
              </div>
            </div>
          </section>

          {/* ---------- Leaderboard ---------- */}
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
              Leaderboard
            </h3>
            {!leaderboard.length ? (
              <p className="text-sm text-gray-500">No entries yet.</p>
            ) : (
              <ul className="space-y-3">
                {leaderboard.map((row) => (
                  <li
                    key={`${row.rankingNumber}-${row.teamName}`}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-800">
                        {row.rankingNumber}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {row.teamName}
                        </p>
                        <p className="text-xs text-gray-600">{row.userName}</p>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {row.totalPoints} pts
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---------- Join Modal (team picker) ---------- */}
          {isPickerOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              role="dialog"
              aria-modal="true"
            >
              <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-base font-semibold text-gray-800">
                    Choose a team to join
                  </h4>
                  <button
                    onClick={() => setIsPickerOpen(false)}
                    className="rounded-md bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>

                {teamsLoading ? (
                  <p className="text-sm text-gray-600">Loading teams…</p>
                ) : teamsError ? (
                  <p className="text-sm text-red-600">{teamsError}</p>
                ) : !myTeams.length ? (
                  <p className="text-sm text-gray-600">No teams found.</p>
                ) : (
                  <ul className="space-y-3">
                    {myTeams.map((t) => (
                      <li key={t._id}>
                        <button
                          onClick={() => joinWithTeam(t._id)}
                          className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm hover:shadow-md"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {t.fantasyTeamName}
                            </p>
                            <p className="text-xs text-gray-600">
                              Budget left: ${t.remainingBudget.toFixed(1)} M
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-purple-700">
                            Select →
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FantasyLeagueView;
