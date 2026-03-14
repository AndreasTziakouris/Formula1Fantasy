import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import { resolveAssetUrl } from "../../lib/assets";

const FantasyLeagueView = () => {
  const { leagueId } = useParams();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [league, setLeague] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState("");
  const [myTeams, setMyTeams] = useState([]);

  useEffect(() => {
    let ignore = false;

    const loadLeague = async () => {
      try {
        setLoading(true);
        setApiError("");

        const data = await apiRequest(
          `/fantasyLeagues/get-league/${leagueId}`,
          { auth: true }
        );

        if (!ignore) {
          setLeague(data.league || null);
          setLeaderboard(data.leaderboard || []);
        }
      } catch (err) {
        if (!ignore) {
          setApiError(err.message || "Failed to fetch league");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadLeague();

    return () => {
      ignore = true;
    };
  }, [leagueId]);

  const reloadLeague = async () => {
    const data = await apiRequest(`/fantasyLeagues/get-league/${leagueId}`, {
      auth: true,
    });
    setLeague(data.league || null);
    setLeaderboard(data.leaderboard || []);
  };

  const openTeamPicker = async () => {
    try {
      setIsPickerOpen(true);
      setTeamsError("");

      if (myTeams.length > 0) {
        return;
      }

      setTeamsLoading(true);
      const data = await apiRequest("/fantasyTeams/get-fantasy-teams", {
        auth: true,
      });
      setMyTeams(data.teams || []);
    } catch (err) {
      setTeamsError(err.message || "Failed to fetch teams");
    } finally {
      setTeamsLoading(false);
    }
  };

  const joinWithTeam = async (fantasyTeamId) => {
    try {
      setTeamsError("");

      await apiRequest("/fantasyLeagues/join-league", {
        method: "POST",
        auth: true,
        body: { leagueId, fantasyTeamId },
      });

      setIsPickerOpen(false);
      await reloadLeague();
    } catch (err) {
      setTeamsError(err.message || "Failed to join league");
    }
  };

  const roundsIncludedText = useMemo(() => {
    const rounds = league?.rules?.roundsIncluded || [];
    return rounds.length
      ? rounds.map((round) => round.roundNumber).join(", ")
      : "—";
  }, [league]);

  const isLeagueFull =
    league && league.rules?.maxTeams !== undefined
      ? league.entryAmount >= league.rules.maxTeams
      : false;

  return (
    <div className="mx-auto max-w-6xl p-6">
      {loading ? (
        <h3 className="text-lg font-semibold text-slate-700">Loading league...</h3>
      ) : apiError ? (
        <p className="text-sm text-red-600">{apiError}</p>
      ) : !league ? (
        <p className="text-sm text-slate-600">League not found.</p>
      ) : (
        <>
          <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-56 w-full">
              <img
                src={resolveAssetUrl(league.leagueImageURL)}
                alt={league.leagueName}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white drop-shadow">
                    {league.leagueName}
                  </h1>
                  <p className="mt-1 text-sm font-medium text-white/90">
                    {league.leagueType}
                  </p>
                </div>

                <button
                  onClick={openTeamPicker}
                  disabled={league.userJoined || isLeagueFull}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold shadow ${
                    league.userJoined || isLeagueFull
                      ? "cursor-not-allowed bg-slate-300 text-slate-700"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {league.userJoined
                    ? "Already Joined"
                    : isLeagueFull
                      ? "League Full"
                      : "Join League"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Max Teams
                </p>
                <p className="text-base font-semibold text-slate-800">
                  {league?.rules?.maxTeams ?? "—"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Rounds Included
                </p>
                <p className="text-base font-semibold text-slate-800">
                  {roundsIncludedText}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Entries
                </p>
                <p className="text-base font-semibold text-slate-800">
                  {league.entryAmount}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <p className="text-base font-semibold text-slate-800">
                  {league.userJoined ? "Joined" : isLeagueFull ? "Full" : "Open"}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">
              Leaderboard
            </h2>
            {!leaderboard.length ? (
              <p className="text-sm text-slate-500">No entries yet.</p>
            ) : (
              <ul className="space-y-3">
                {leaderboard.map((row) => (
                  <li
                    key={`${row.rankingNumber}-${row.teamName}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800">
                        {row.rankingNumber}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {row.teamName}
                        </p>
                        <p className="text-xs text-slate-600">{row.userName}</p>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {row.totalPoints} pts
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {isPickerOpen ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              role="dialog"
              aria-modal="true"
            >
              <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-800">
                    Choose a team to join
                  </h3>
                  <button
                    onClick={() => setIsPickerOpen(false)}
                    className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-300"
                  >
                    Close
                  </button>
                </div>

                {teamsLoading ? (
                  <p className="text-sm text-slate-600">Loading teams...</p>
                ) : teamsError ? (
                  <p className="text-sm text-red-600">{teamsError}</p>
                ) : !myTeams.length ? (
                  <p className="text-sm text-slate-600">No teams found.</p>
                ) : (
                  <ul className="space-y-3">
                    {myTeams.map((team) => (
                      <li key={team._id}>
                        <button
                          onClick={() => joinWithTeam(team._id)}
                          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left shadow-sm hover:bg-white"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {team.fantasyTeamName}
                            </p>
                            <p className="text-xs text-slate-600">
                              Budget left: $
                              {Number(team.remainingBudget).toFixed(1)} M
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-red-500">
                            Select →
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default FantasyLeagueView;
