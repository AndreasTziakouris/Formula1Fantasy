import React, { useState, useEffect } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
const FantasyTeamsList = () => {
  const [apiError, setApiError] = useState("");
  const [fantasyTeams, setFantasyTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchFantasyTeams = async () => {
    try {
      const token = localStorage.getItem("token");
      setLoading(true);
      const response = await fetch(
        "http://localhost:3000/fantasyTeams/get-fantasy-teams",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Fetching data failed");
      }
      const data = await response.json();
      const fantasyTeams = data.teams;
      const message = data.message; //update error state to this
      setFantasyTeams(fantasyTeams);
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchFantasyTeams();
  }, []);

  return (
    <div>
      {loading ? (
        <h3>Loading…</h3>
      ) : (
        <>
          <h5>Teams Found: {`${fantasyTeams.length}/3`}</h5>
          <div>
            {" "}
            {/* teams div */}
            {/* ------------- LIST ------------- */}
            <ul className="space-y-6">
              {fantasyTeams.map((team, index) => {
                const doublePointsDriver = team.f1Drivers.find(
                  (driver) => driver.doublePoints
                );
                const formattedName = `${doublePointsDriver.driverId.name.charAt(
                  0
                )}. ${doublePointsDriver.driverId.surname.toUpperCase()}`;
                return (
                  <li key={team._id || index}>
                    <div className="relative rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
                      {/* ── header ── */}
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-500">
                          #{index + 1}
                        </span>
                        <h3 className="truncate text-lg font-bold text-gray-800">
                          {team.fantasyTeamName}
                        </h3>
                      </div>

                      {/* ── double-points driver ── */}
                      <div className="inline-block w-32 overflow-hidden rounded-lg border border-gray-300 bg-white text-center shadow">
                        {/* image + 2× badge */}
                        <div className="relative h-28 w-full">
                          <img
                            src={doublePointsDriver.driverId.imageUrl}
                            alt={formattedName}
                            className="h-full w-full object-cover"
                          />

                          <span className="absolute top-1 left-1 rounded-full bg-black/80 px-1.5 py-0.5 text-[10px] font-extrabold text-white ring-2 ring-white">
                            2×
                          </span>
                        </div>

                        {/* name + cost */}
                        <div className="border-t border-gray-200 px-1.5 py-1">
                          <p className="truncate text-[13px] font-semibold text-gray-900">
                            {formattedName}
                          </p>
                          <p className="mt-0.5 text-[12px] font-medium text-gray-700">
                            ${doublePointsDriver.driverId.driverCost} M
                          </p>
                        </div>
                      </div>

                      {/* ── footer ── */}
                      <div className="mt-4 flex items-center justify-between text-sm">
                        {/* left side: budget */}
                        <span className="font-medium text-gray-500">
                          Budget&nbsp;left:&nbsp;
                          <span className="font-semibold text-green-600">
                            ${team.remainingBudget.toFixed(1)}&nbsp;M
                          </span>
                        </span>

                        {/* right side: view button */}
                        <Link
                          to={`/fantasyTeams/view/${team._id}`}
                          className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-purple-700"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          {fantasyTeams.length <= 2 ? (
            <Link
              to={`/fantasyTeams/new-team`}
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded transition"
            >
              Create New Team
            </Link>
          ) : (
            <h3 className="text-red-600">Maximum amount of teams reached!</h3>
          )}
          {apiError && <p className="mb-2 text-sm text-red-600">{apiError}</p>}
        </>
      )}
    </div>
  );
};

export default FantasyTeamsList;
