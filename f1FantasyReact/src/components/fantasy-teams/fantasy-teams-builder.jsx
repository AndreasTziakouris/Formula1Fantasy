import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
const FantasyTeamsBuilder = ({ mode }) => {
  //console.log("mounted");
  const { teamId } = useParams();
  const { state } = useLocation();

  const initialFantasyTeam = state?.team;
  const [allDrivers, setAllDrivers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [includedDrivers, setIncludedDrivers] = useState(
    initialFantasyTeam?.f1Drivers?.map((driver) => driver.driverId._id) ?? []
  );
  const [doublePointsDriverId, setDoublePointsDriverId] = useState(
    initialFantasyTeam?.f1Drivers?.find(
      (driver) => driver.doublePoints === true
    )?.driverId._id ?? null
  );

  const [includedTeams, setIncludedTeams] = useState(
    initialFantasyTeam?.f1Teams?.map((team) => team.teamId._id) ?? []
  );
  const [fantasyTeamName, setFantasyTeamName] = useState(
    initialFantasyTeam?.fantasyTeamName ?? ""
  );
  const [budgetLeft, setBudgetLeft] = useState(
    initialFantasyTeam?.remainingBudget ?? 100
  );
  const [transfersLeft, setTransfersLeft] = useState(
    initialFantasyTeam?.remainingTransfers ?? 3
  );
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState([]);
  const [activeTab, setActiveTab] = useState("drivers"); // UI-only tab state
  //driverId and teamId to driverDocs and teamDocs hash maps
  const driverById = useMemo(
    () => Object.fromEntries(allDrivers.map((d) => [d._id, d])),
    [allDrivers]
  );
  const teamById = useMemo(
    () => Object.fromEntries(allTeams.map((t) => [t._id, t])),
    [allTeams]
  );
  const initialDriverIdSet = useMemo(
    () =>
      new Set(initialFantasyTeam?.f1Drivers?.map((d) => d.driverId._id) ?? []),
    [initialFantasyTeam]
  );
  const initialTeamIdSet = useMemo(
    () => new Set(initialFantasyTeam?.f1Teams?.map((t) => t.teamId._id) ?? []),
    [initialFantasyTeam]
  );

  const countTransfers = (finalIds, initialSet) => {
    let c = 0;
    for (const id of finalIds) if (!initialSet.has(id)) c++;
    return c;
  };
  const fetchF1Drivers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3000/fantasyTeams/f1drivers",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || undefined);
      }
      const driverData = await response.json();
      setAllDrivers(driverData);
      //console.log(driverData);
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    }
  };
  const fetchF1Teams = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3000/fantasyTeams/f1teams",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || undefined);
      }
      const teamData = await response.json();
      setAllTeams(teamData);
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    }
  };

  const isDriverIncluded = (driverId) =>
    includedDrivers.some((xId) => xId === driverId);
  const isTeamIncluded = (teamId) =>
    includedTeams.some((xId) => xId === teamId);

  const canAddDriver = (driverId) => {
    const driverDoc = driverById[driverId];
    if (isDriverIncluded(driverId)) return false;
    if (transfersLeft <= 0) return false; //we need a way to improve UI. We need to show why a user can't add a driver, not just not render the button
    if (includedDrivers.length >= 5) return false;
    return budgetLeft - driverDoc.driverCost >= 0;
  };
  const canAddTeam = (teamId) => {
    const teamDoc = teamById[teamId];
    if (isTeamIncluded(teamId)) return false;
    if (transfersLeft <= 0) return false;
    if (includedTeams.length >= 2) return false;
    return budgetLeft - teamDoc.teamCost >= 0;
  };

  const addDriver = (driverId) => {
    if (!canAddDriver(driverId)) return; //shouldn't really happen, we don't render the button if not
    const driverDoc = driverById[driverId];
    setIncludedDrivers((prev) => [...prev, driverId]);
    setBudgetLeft((prev) => prev - driverDoc.driverCost);
    //setTransfersLeft((prev) => prev - 1);
  };
  const addTeam = (teamId) => {
    if (!canAddTeam(teamId)) return; //shouldn't really happen, we don't render the button if not
    const teamDoc = teamById[teamId];
    setIncludedTeams((prev) => [...prev, teamId]);
    setBudgetLeft((prev) => prev - teamDoc.teamCost);
    //setTransfersLeft((prev) => prev - 1);
  };

  const removeDriver = (driverId) => {
    const driverDoc = driverById[driverId];
    setIncludedDrivers((prev) => prev.filter((xId) => xId !== driverId));
    if (driverId === doublePointsDriverId) {
      setDoublePointsDriverId(null);
    }
    setBudgetLeft((prev) => prev + driverDoc.driverCost);
  };
  const removeTeam = (teamId) => {
    const teamDoc = teamById[teamId];
    setIncludedTeams((prev) => prev.filter((xId) => xId !== teamId));
    setBudgetLeft((prev) => prev + teamDoc.teamCost);
  };

  const toggleDoublePoints = (driverId) => {
    if (!isDriverIncluded(driverId)) return;
    setDoublePointsDriverId((prev) => (prev === driverId ? null : driverId));
  };

  const validateTeam = () => {
    const errors = [];
    let transfersMade = 0;

    if (mode === "edit" && initialFantasyTeam) {
      const driverTransfers = countTransfers(
        includedDrivers,
        initialDriverIdSet
      );
      const teamTransfers = countTransfers(includedTeams, initialTeamIdSet);
      transfersMade = driverTransfers + teamTransfers;

      if (transfersMade > transfersLeft) {
        errors.push(
          `Too many transfers (used ${transfersMade}, allowed ${transfersLeft})`
        );
      }
    }

    if (includedDrivers.length !== 5) {
      errors.push(
        `Incorrect number of drivers (selected ${includedDrivers.length} / 5)`
      );
    }
    if (includedTeams.length !== 2) {
      errors.push(
        `Incorrect number of teams (selected ${includedTeams.length} / 2)`
      );
    }
    if (budgetLeft < 0) {
      errors.push(`Over budget by ${Math.abs(budgetLeft)} M`);
    }
    if (!fantasyTeamName.trim()) {
      errors.push("Please enter a team name.");
    }
    if (!doublePointsDriverId) {
      errors.push("Please select a DRS driver");
    }
    setValidationError(errors);
    return { ok: errors.length === 0, transfersMade };
  };

  const saveTeam = async () => {
    try {
      setSaving(true);
      setValidationError([]);

      const { ok, transfersMade } = validateTeam();
      if (!ok) {
        setSaving(false);
        return;
      }

      const token = localStorage.getItem("token");
      const remainingTransfersToSend =
        mode === "edit" && initialFantasyTeam
          ? Math.max(0, transfersLeft - transfersMade)
          : transfersLeft;

      const newFantasyTeam = {
        fantasyTeamId: initialFantasyTeam?._id,
        fantasyTeamName,
        f1Drivers: includedDrivers.map((driverId) => {
          const d = driverById[driverId];
          return {
            driverId: d._id,
            driverSurname: d.surname,
            doublePoints: doublePointsDriverId === driverId,
          };
        }),
        f1Teams: includedTeams.map((teamId) => {
          const t = teamById[teamId];
          return { teamId: t._id, teamName: t.name };
        }),
        remainingBudget: budgetLeft,
        remainingTransfers: remainingTransfersToSend,
      };

      const response = await fetch(
        "http://localhost:3000/fantasyTeams/update-fantasy-team",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify(newFantasyTeam),
        }
      );
      if (!response.ok)
        throw new Error((await response.json()).message || "Failed to save");

      const data = await response.json();
      setTransfersLeft(remainingTransfersToSend);
      window.location.href = `/fantasyTeams/view/${data._id}`;
    } catch (err) {
      setApiError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchF1Drivers(), fetchF1Teams()]);
      setLoading(false);
    };
    load();
  }, []);

  const includedDriverSlots = [
    ...(includedDrivers || []),
    ...Array(5).fill(null),
  ].slice(0, 5);

  const includedTeamSlots = [
    ...(includedTeams || []),
    ...Array(2).fill(null),
  ].slice(0, 2);
  const placeholder = "https://via.placeholder.com/160x160.png?text=%20";
  return (
    <div className="mx-auto max-w-6xl p-6">
      {!loading ? (
        <div>
          {/* Top row: team name + budget/transfers + save */}
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <Link
              to={
                mode === "edit"
                  ? `/fantasyTeams/view/${teamId}`
                  : `/fantasyTeams`
              }
              className="rounded-lg px-4 py-2 text-sm font-semibold transition
                  bg-red-400 text-gray-800 hover:bg-red-800"
            >
              ← Back
            </Link>
            <input
              type="text"
              placeholder="Insert team name"
              value={fantasyTeamName}
              onChange={(e) => setFantasyTeamName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none md:max-w-xs"
            />

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <span className="font-medium text-gray-600">
                Budget Left:{" "}
                <span className="font-semibold text-green-600">
                  ${budgetLeft.toFixed(1)} M
                </span>
              </span>
              <span className="font-medium text-gray-600">
                Transfers Left:{" "}
                <span className="font-semibold text-gray-900">
                  {transfersLeft}
                </span>
              </span>
            </div>

            <button
              onClick={saveTeam}
              disabled={
                saving ||
                loading ||
                includedDrivers.length !== 5 ||
                includedTeams.length !== 2
              }
              className={`inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-semibold transition ${
                saving ||
                loading ||
                includedDrivers.length !== 5 ||
                includedTeams.length !== 2
                  ? "cursor-not-allowed bg-gray-300 text-gray-600"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {saving ? "Saving Team..." : "Save Team"}
            </button>
          </div>
          {validationError.length > 0 && (
            <div>
              {validationError.map((msg, i) => (
                <p key={i} className="mb-2 text-sm text-red-600">
                  {msg}
                </p>
              ))}
            </div>
          )}
          {apiError && <p className="mb-4 text-sm text-red-600">{apiError}</p>}
          {/* Main 2-col layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* LEFT: Selected team (drivers + constructors) */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              {/* Drivers grid – same look as team view */}
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {includedDriverSlots.map((driverId, i) => {
                  if (!driverId) {
                    return (
                      <div
                        key={`empty-driver-${i}`}
                        className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400"
                      >
                        <img
                          src={placeholder}
                          alt="Empty slot"
                          className="h-16 w-16 rounded-full object-cover opacity-40"
                        />
                        <p className="mt-2 text-xs font-medium">Empty Driver</p>
                      </div>
                    );
                  }
                  const driverDoc = driverById[driverId];
                  if (!driverDoc) {
                    return (
                      <div
                        key={`loading-driver-${i}`}
                        className="flex h-48 items-center justify-center rounded-lg border border-gray-200 bg-white"
                      >
                        <span className="text-xs text-gray-500">Loading…</span>
                      </div>
                    );
                  }
                  const initial = `${
                    driverDoc.name?.charAt(0) || ""
                  }. ${driverDoc.surname?.toUpperCase()}`;

                  return (
                    <div
                      key={driverDoc._id}
                      className="relative flex h-48 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow"
                    >
                      {doublePointsDriverId === driverId && (
                        <span className="absolute left-1 top-1 z-10 rounded-full bg-black/80 px-1.5 py-0.5 text-[10px] font-extrabold text-white ring-2 ring-white">
                          2×
                        </span>
                      )}

                      <img
                        src={driverDoc.imageUrl}
                        alt={initial}
                        className="h-32 w-full object-cover"
                      />

                      <div className="flex-1 px-2 py-1 text-center">
                        <p className="truncate text-sm font-bold text-gray-800">
                          {initial}
                        </p>
                        <p className="text-xs font-medium text-gray-600">
                          ${driverDoc.driverCost} M
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Teams grid – same look as team view */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {includedTeamSlots.map((teamId, i) => {
                  if (!teamId) {
                    return (
                      <div
                        key={`empty-team-${i}`}
                        className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400"
                      >
                        <img
                          src={placeholder}
                          alt="Empty team"
                          className="h-20 w-32 object-cover opacity-40"
                        />
                        <p className="mt-2 text-xs font-medium">Empty Team</p>
                      </div>
                    );
                  }

                  const teamDoc = teamById[teamId];
                  if (!teamDoc) {
                    return (
                      <div
                        key={`loading-team-${i}`}
                        className="flex h-48 items-center justify-center rounded-lg border border-gray-200 bg-white"
                      >
                        <span className="text-xs text-gray-500">Loading…</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={teamId}
                      className="flex h-48 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow"
                    >
                      <img
                        src={teamDoc.imageUrl || placeholder}
                        alt={teamDoc.name}
                        className="h-32 w-full object-cover"
                      />
                      <div className="flex-1 px-3 py-1">
                        <p className="truncate text-sm font-bold text-gray-800">
                          {teamDoc.fullName || teamDoc.name}
                        </p>
                        <p className="text-xs font-medium text-gray-600">
                          ${teamDoc.teamCost} M
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Pool with tabs + scroll */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              {/* Tabs */}
              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("drivers")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "drivers"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Drivers
                </button>
                <span className="text-sm text-gray-500">
                  {includedDrivers.length}/5
                </span>

                <button
                  type="button"
                  onClick={() => setActiveTab("teams")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "teams"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Constructors
                </button>
                <span className="text-sm text-gray-500">
                  {includedTeams.length}/2
                </span>
              </div>

              {/* Scrollable list area */}
              <div
                className="overflow-y-auto pr-1"
                style={{ maxHeight: "70vh" }}
              >
                {activeTab === "drivers" ? (
                  <ul className="grid grid-cols-1 gap-4">
                    {allDrivers.map((driver) => {
                      const isSelected = isDriverIncluded(driver._id);
                      const isDoublePoints =
                        doublePointsDriverId === driver._id;
                      return (
                        <li key={driver._id}>
                          <article className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md">
                            {driver.imageUrl && (
                              <img
                                src={driver.imageUrl}
                                alt={driver.surname}
                                className="h-16 w-28 rounded-md object-cover"
                              />
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-gray-900">
                                {driver.name} {driver.surname}
                              </div>
                              <div className="text-xs font-medium text-gray-600">
                                Cost: ${driver.driverCost} M
                              </div>
                            </div>
                            {!isDoublePoints && isSelected && (
                              <button
                                className="ml-auto rounded-lg px-3 py-2 text-sm font-semibold transition bg-red-400 text-white hover:bg-red-700"
                                onClick={() => toggleDoublePoints(driver._id)}
                              >
                                Set DRS (x2)
                              </button>
                            )}
                            <button
                              className={`ml-auto rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                isSelected
                                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  : canAddDriver(driver._id)
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "cursor-not-allowed bg-gray-300 text-gray-600"
                              }`}
                              onClick={() =>
                                isSelected
                                  ? removeDriver(driver._id)
                                  : addDriver(driver._id)
                              }
                              disabled={
                                !isSelected && !canAddDriver(driver._id)
                              }
                            >
                              {isSelected ? "Remove" : "Add"}
                            </button>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <ul className="grid grid-cols-1 gap-4">
                    {allTeams.map((team) => {
                      const isSelected = isTeamIncluded(team._id);
                      return (
                        <li key={team._id}>
                          <article className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md">
                            {team.imageUrl && (
                              <img
                                src={team.imageUrl}
                                alt={team.fullName || team.name}
                                className="h-16 w-28 rounded-md object-cover"
                              />
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-gray-900">
                                {team.fullName || team.name}
                              </div>
                              <div className="text-xs font-medium text-gray-600">
                                Cost: ${team.teamCost} M
                              </div>
                            </div>

                            <button
                              className={`ml-auto rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                isSelected
                                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  : canAddTeam(team._id)
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "cursor-not-allowed bg-gray-300 text-gray-600"
                              }`}
                              onClick={() =>
                                isSelected
                                  ? removeTeam(team._id)
                                  : addTeam(team._id)
                              }
                              disabled={!isSelected && !canAddTeam(team._id)}
                            >
                              {isSelected ? "Remove" : "Add"}
                            </button>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
          )
        </div>
      ) : (
        <h3>Loading…</h3>
      )}
    </div>
  );
};

export default FantasyTeamsBuilder;
