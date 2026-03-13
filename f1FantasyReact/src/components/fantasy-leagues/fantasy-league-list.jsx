import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
const FantasyLeaguesList = () => {
  const [fantasyLeagues, setFantasyLeagues] = useState([]);

  const [filterJoinedLeagues, setfilterJoinedLeagues] = useState(false);
  const [filterLeagueType, setFilterLeagueType] = useState("all");

  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredLeagues = useMemo(() => {
    return fantasyLeagues?.filter((league) => {
      if (filterLeagueType !== "all" && filterLeagueType !== league.leagueType)
        return false;
      if (filterJoinedLeagues && !league.joined) return false;
      return true;
    });
  }, [fantasyLeagues, filterJoinedLeagues, filterLeagueType]);

  const getLeagues = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/fantasyLeagues/get-all-leagues`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.message || "Something went wrong");
        throw error;
      }
      const responseData = await response.json();
      setFantasyLeagues(responseData.simplifiedFantasyLeagues || []);
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLeagues();
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Filters Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={filterJoinedLeagues}
            onChange={(e) => setfilterJoinedLeagues(e.target.checked)}
          />
          Joined only
        </label>

        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
          value={filterLeagueType}
          onChange={(e) => setFilterLeagueType(e.target.value)}
        >
          <option value="all">All types</option>
          <option value="official">Official</option>
          <option value="community">Community</option>
        </select>

        <span className="ml-auto text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold">{filteredLeagues.length}</span> of{" "}
          <span className="font-semibold">{fantasyLeagues.length}</span>
        </span>
      </div>

      {/* Leagues List */}
      <ul className="space-y-4">
        {filteredLeagues.map((l) => (
          <li
            key={l.leagueId}
            className="rounded-xl border border-gray-200 bg-white p-0 shadow-sm overflow-hidden"
          >
            {/* League image */}

            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <Link
                  to={"/fantasyLeagues/view/" + l.leagueId}
                  className="truncate text-lg font-bold text-gray-800"
                >
                  {l.leagueName}
                </Link>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    l.joined
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {l.joined ? "Joined" : "Not joined"}
                </span>
              </div>
              {l.leagueImageURL && (
                <img
                  src={l.leagueImageURL}
                  alt={l.leagueName}
                  className="w-full h-48 object-cover object-center"
                />
              )}
              <div className="text-sm text-gray-600">
                <p>
                  Type:{" "}
                  <span className="font-medium text-gray-800">
                    {l.leagueType}
                  </span>
                </p>
                <p>
                  Entries:{" "}
                  <span className="font-medium text-gray-800">
                    {l.entryAmount}
                  </span>
                </p>
              </div>

              {/* rounds preview */}
              <div className="mt-2 text-xs text-gray-500">
                Rounds included:{" "}
                {l.roundsIncluded?.map((r) => r.roundNumber).join(", ") || "—"}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {apiError && <p className="mt-4 text-sm text-red-600">{apiError}</p>}
    </div>
  );
};

export default FantasyLeaguesList;
