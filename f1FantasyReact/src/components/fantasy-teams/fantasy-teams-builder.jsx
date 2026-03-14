import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import { EMPTY_IMAGE, resolveAssetUrl } from "../../lib/assets";

const BUDGET_CAP = 100;
const INITIAL_TRANSFERS = 3;

const countTransfers = (finalIds, initialSet) => {
  let count = 0;

  for (const id of finalIds) {
    if (!initialSet.has(id)) {
      count += 1;
    }
  }

  return count;
};

const FantasyTeamsBuilder = ({ mode }) => {
  const navigate = useNavigate();
  const { teamId } = useParams();

  const [allDrivers, setAllDrivers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [initialFantasyTeam, setInitialFantasyTeam] = useState(null);
  const [includedDrivers, setIncludedDrivers] = useState([]);
  const [includedTeams, setIncludedTeams] = useState([]);
  const [doublePointsDriverId, setDoublePointsDriverId] = useState(null);
  const [fantasyTeamName, setFantasyTeamName] = useState("");
  const [budgetLeft, setBudgetLeft] = useState(BUDGET_CAP);
  const [transfersLeft, setTransfersLeft] = useState(INITIAL_TRANSFERS);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [activeTab, setActiveTab] = useState("drivers");

  const driverById = useMemo(
    () => Object.fromEntries(allDrivers.map((driver) => [driver._id, driver])),
    [allDrivers]
  );
  const teamById = useMemo(
    () => Object.fromEntries(allTeams.map((team) => [team._id, team])),
    [allTeams]
  );
  const initialDriverIdSet = useMemo(
    () =>
      new Set(initialFantasyTeam?.f1Drivers?.map((driver) => driver.driverId._id) ?? []),
    [initialFantasyTeam]
  );
  const initialTeamIdSet = useMemo(
    () =>
      new Set(initialFantasyTeam?.f1Teams?.map((team) => team.teamId._id) ?? []),
    [initialFantasyTeam]
  );

  const driverTransfersUsed =
    mode === "edit"
      ? countTransfers(includedDrivers, initialDriverIdSet)
      : 0;
  const teamTransfersUsed =
    mode === "edit" ? countTransfers(includedTeams, initialTeamIdSet) : 0;
  const totalTransfersUsed = driverTransfersUsed + teamTransfersUsed;
  const displayTransfersLeft =
    mode === "edit"
      ? Math.max(0, transfersLeft - totalTransfersUsed)
      : transfersLeft;

  useEffect(() => {
    let ignore = false;

    const loadBuilderData = async () => {
      try {
        setLoading(true);
        setApiError("");

        const [drivers, teams, teamResponse] = await Promise.all([
          apiRequest("/fantasyTeams/f1drivers", { auth: true }),
          apiRequest("/fantasyTeams/f1teams", { auth: true }),
          mode === "edit"
            ? apiRequest(`/fantasyTeams/get-fantasy-team/${teamId}`, {
                auth: true,
              })
            : Promise.resolve(null),
        ]);

        if (ignore) {
          return;
        }

        setAllDrivers(drivers || []);
        setAllTeams(teams || []);

        if (mode === "edit") {
          const team = teamResponse?.team?.[0];

          if (!team) {
            throw new Error("Fantasy team not found");
          }

          setInitialFantasyTeam(team);
          setIncludedDrivers(team.f1Drivers.map((driver) => driver.driverId._id));
          setIncludedTeams(team.f1Teams.map((constructor) => constructor.teamId._id));
          setDoublePointsDriverId(
            team.f1Drivers.find((driver) => driver.doublePoints)?.driverId._id ||
              null
          );
          setFantasyTeamName(team.fantasyTeamName);
          setBudgetLeft(Number(team.remainingBudget ?? BUDGET_CAP));
          setTransfersLeft(Number(team.remainingTransfers ?? INITIAL_TRANSFERS));
        } else {
          setInitialFantasyTeam(null);
          setIncludedDrivers([]);
          setIncludedTeams([]);
          setDoublePointsDriverId(null);
          setFantasyTeamName("");
          setBudgetLeft(BUDGET_CAP);
          setTransfersLeft(INITIAL_TRANSFERS);
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

    loadBuilderData();

    return () => {
      ignore = true;
    };
  }, [mode, teamId]);

  const isDriverIncluded = (driverId) => includedDrivers.includes(driverId);
  const isTeamIncluded = (constructorId) => includedTeams.includes(constructorId);

  const canAddDriver = (driverId) => {
    const driver = driverById[driverId];

    if (!driver || isDriverIncluded(driverId) || includedDrivers.length >= 5) {
      return false;
    }

    if (
      mode === "edit" &&
      !initialDriverIdSet.has(driverId) &&
      displayTransfersLeft <= 0
    ) {
      return false;
    }

    return budgetLeft - Number(driver.driverCost) >= 0;
  };

  const canAddTeam = (constructorId) => {
    const team = teamById[constructorId];

    if (!team || isTeamIncluded(constructorId) || includedTeams.length >= 2) {
      return false;
    }

    if (
      mode === "edit" &&
      !initialTeamIdSet.has(constructorId) &&
      displayTransfersLeft <= 0
    ) {
      return false;
    }

    return budgetLeft - Number(team.teamCost) >= 0;
  };

  const addDriver = (driverId) => {
    if (!canAddDriver(driverId)) {
      return;
    }

    const driver = driverById[driverId];
    setValidationErrors([]);
    setIncludedDrivers((current) => [...current, driverId]);
    setBudgetLeft((current) => current - Number(driver.driverCost));
  };

  const addTeam = (constructorId) => {
    if (!canAddTeam(constructorId)) {
      return;
    }

    const team = teamById[constructorId];
    setValidationErrors([]);
    setIncludedTeams((current) => [...current, constructorId]);
    setBudgetLeft((current) => current - Number(team.teamCost));
  };

  const removeDriver = (driverId) => {
    const driver = driverById[driverId];

    if (!driver) {
      return;
    }

    setValidationErrors([]);
    setIncludedDrivers((current) => current.filter((id) => id !== driverId));
    setBudgetLeft((current) => current + Number(driver.driverCost));

    if (driverId === doublePointsDriverId) {
      setDoublePointsDriverId(null);
    }
  };

  const removeTeam = (constructorId) => {
    const team = teamById[constructorId];

    if (!team) {
      return;
    }

    setValidationErrors([]);
    setIncludedTeams((current) => current.filter((id) => id !== constructorId));
    setBudgetLeft((current) => current + Number(team.teamCost));
  };

  const toggleDoublePoints = (driverId) => {
    if (!isDriverIncluded(driverId)) {
      return;
    }

    setValidationErrors([]);
    setDoublePointsDriverId((current) => (current === driverId ? null : driverId));
  };

  const validateTeam = () => {
    const errors = [];

    if (!fantasyTeamName.trim()) {
      errors.push("Please enter a team name.");
    }
    if (includedDrivers.length !== 5) {
      errors.push(`Select exactly 5 drivers. Current selection: ${includedDrivers.length}.`);
    }
    if (includedTeams.length !== 2) {
      errors.push(`Select exactly 2 constructors. Current selection: ${includedTeams.length}.`);
    }
    if (!doublePointsDriverId) {
      errors.push("Select one driver for DRS double points.");
    }
    if (budgetLeft < 0) {
      errors.push(`You are over budget by $${Math.abs(budgetLeft).toFixed(1)} M.`);
    }
    if (mode === "edit" && totalTransfersUsed > transfersLeft) {
      errors.push(
        `Too many transfers used (${totalTransfersUsed}/${transfersLeft}).`
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const saveTeam = async () => {
    if (!validateTeam()) {
      return;
    }

    try {
      setSaving(true);
      setApiError("");

      const payload = {
        fantasyTeamId: initialFantasyTeam?._id,
        fantasyTeamName: fantasyTeamName.trim(),
        f1Drivers: includedDrivers.map((driverId) => ({
          driverId,
          doublePoints: doublePointsDriverId === driverId,
        })),
        f1Teams: includedTeams.map((constructorId) => ({
          teamId: constructorId,
        })),
      };

      const savedTeam = await apiRequest("/fantasyTeams/update-fantasy-team", {
        method: "PUT",
        auth: true,
        body: payload,
      });

      navigate(`/fantasyTeams/view/${savedTeam._id}`, { replace: true });
    } catch (err) {
      if (err.status === 400 || err.status === 403) {
        setValidationErrors([err.message || "Unable to save this team."]);
      } else {
        setApiError(err.message || "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  };

  const includedDriverSlots = [...includedDrivers, ...Array(5).fill(null)].slice(
    0,
    5
  );
  const includedTeamSlots = [...includedTeams, ...Array(2).fill(null)].slice(0, 2);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h3 className="text-lg font-semibold text-slate-700">Loading builder...</h3>
      </div>
    );
  }

  if (mode === "edit" && !initialFantasyTeam) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <Link
          to="/fantasyTeams"
          className="inline-flex rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Back to teams
        </Link>
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {apiError || "Fantasy team not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <Link
          to={mode === "edit" ? `/fantasyTeams/view/${teamId}` : "/fantasyTeams"}
          className="inline-flex rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Back
        </Link>

        <input
          type="text"
          placeholder="Enter team name"
          value={fantasyTeamName}
          onChange={(event) => {
            setValidationErrors([]);
            setFantasyTeamName(event.target.value);
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none md:max-w-xs"
        />

        <div className="flex flex-wrap items-center gap-6 text-sm">
          <span className="font-medium text-slate-600">
            Budget Left:{" "}
            <span className="font-semibold text-emerald-600">
              ${budgetLeft.toFixed(1)} M
            </span>
          </span>
          <span className="font-medium text-slate-600">
            Transfers Left:{" "}
            <span className="font-semibold text-slate-900">
              {displayTransfersLeft}
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
              ? "cursor-not-allowed bg-slate-300 text-slate-600"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {saving ? "Saving Team..." : "Save Team"}
        </button>
      </div>

      {validationErrors.length ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          {validationErrors.map((message) => (
            <p key={message} className="text-sm text-red-700">
              {message}
            </p>
          ))}
        </div>
      ) : null}
      {apiError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {apiError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {includedDriverSlots.map((driverId, index) => {
              if (!driverId) {
                return (
                  <div
                    key={`empty-driver-${index}`}
                    className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400"
                  >
                    <img
                      src={EMPTY_IMAGE}
                      alt="Empty driver slot"
                      className="h-16 w-16 rounded-full object-cover opacity-50"
                    />
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide">
                      Empty Driver
                    </p>
                  </div>
                );
              }

              const driver = driverById[driverId];

              if (!driver) {
                return null;
              }

              const label = `${driver.name?.charAt(0) || ""}. ${driver.surname?.toUpperCase()}`;

              return (
                <article
                  key={driver._id}
                  className="relative flex h-48 flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow"
                >
                  {doublePointsDriverId === driverId ? (
                    <span className="absolute left-2 top-2 z-10 rounded-full bg-black/80 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                      DRS x2
                    </span>
                  ) : null}

                  <img
                    src={resolveAssetUrl(driver.imageUrl)}
                    alt={label}
                    className="h-32 w-full object-cover"
                  />

                  <div className="flex-1 px-2 py-2 text-center">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {label}
                    </p>
                    <p className="text-xs font-medium text-slate-600">
                      ${Number(driver.driverCost).toFixed(1)} M
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {includedTeamSlots.map((constructorId, index) => {
              if (!constructorId) {
                return (
                  <div
                    key={`empty-team-${index}`}
                    className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400"
                  >
                    <img
                      src={EMPTY_IMAGE}
                      alt="Empty constructor slot"
                      className="h-20 w-32 object-cover opacity-50"
                    />
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide">
                      Empty Constructor
                    </p>
                  </div>
                );
              }

              const team = teamById[constructorId];

              if (!team) {
                return null;
              }

              return (
                <article
                  key={constructorId}
                  className="flex h-48 flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow"
                >
                  <img
                    src={resolveAssetUrl(team.imageUrl)}
                    alt={team.name}
                    className="h-32 w-full object-cover"
                  />
                  <div className="flex-1 px-3 py-2">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {team.fullName || team.name}
                    </p>
                    <p className="text-xs font-medium text-slate-600">
                      ${Number(team.teamCost).toFixed(1)} M
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("drivers")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === "drivers"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-800 hover:bg-slate-300"
              }`}
            >
              Drivers
            </button>
            <span className="text-sm text-slate-500">{includedDrivers.length}/5</span>

            <button
              type="button"
              onClick={() => setActiveTab("teams")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === "teams"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-800 hover:bg-slate-300"
              }`}
            >
              Constructors
            </button>
            <span className="text-sm text-slate-500">{includedTeams.length}/2</span>
          </div>

          <div className="overflow-y-auto pr-1" style={{ maxHeight: "70vh" }}>
            {activeTab === "drivers" ? (
              <ul className="grid grid-cols-1 gap-4">
                {allDrivers.map((driver) => {
                  const isSelected = isDriverIncluded(driver._id);
                  const isDoublePoints = doublePointsDriverId === driver._id;

                  return (
                    <li key={driver._id}>
                      <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md">
                        <img
                          src={resolveAssetUrl(driver.imageUrl)}
                          alt={driver.surname}
                          className="h-16 w-28 rounded-md object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {driver.name} {driver.surname}
                          </div>
                          <div className="text-xs font-medium text-slate-600">
                            Cost: ${Number(driver.driverCost).toFixed(1)} M
                          </div>
                        </div>
                        {isSelected && !isDoublePoints ? (
                          <button
                            className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                            onClick={() => toggleDoublePoints(driver._id)}
                          >
                            Set DRS
                          </button>
                        ) : null}
                        <button
                          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            isSelected
                              ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                              : canAddDriver(driver._id)
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "cursor-not-allowed bg-slate-300 text-slate-600"
                          }`}
                          onClick={() =>
                            isSelected
                              ? removeDriver(driver._id)
                              : addDriver(driver._id)
                          }
                          disabled={!isSelected && !canAddDriver(driver._id)}
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
                      <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md">
                        <img
                          src={resolveAssetUrl(team.imageUrl)}
                          alt={team.fullName || team.name}
                          className="h-16 w-28 rounded-md object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {team.fullName || team.name}
                          </div>
                          <div className="text-xs font-medium text-slate-600">
                            Cost: ${Number(team.teamCost).toFixed(1)} M
                          </div>
                        </div>

                        <button
                          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            isSelected
                              ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                              : canAddTeam(team._id)
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "cursor-not-allowed bg-slate-300 text-slate-600"
                          }`}
                          onClick={() =>
                            isSelected ? removeTeam(team._id) : addTeam(team._id)
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
        </section>
      </div>
    </div>
  );
};

export default FantasyTeamsBuilder;
