import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import { resolveAssetUrl } from "../../lib/assets";

const createTeamForm = () => ({
  name: "",
  fullName: "",
  principalName: "",
  principalNationality: "",
  principalExperienceYears: "",
  description: "",
  imageUrl: "",
  teamCost: "",
});

const createDriverForm = (teams) => ({
  name: "",
  surname: "",
  abbreviation: "",
  f1TeamId: teams[0]?._id || "",
  description: "",
  imageUrl: "",
  driverCost: "",
});

const getDriverTeamId = (driver) =>
  driver.f1TeamId?.toString?.() ?? driver.f1TeamId ?? "";

const syncRaceForm = (currentForm, teams, drivers) => {
  const currentDrivers = new Map(
    (currentForm?.f1DriversPerformance || []).map((driver) => [
      driver.driverId,
      driver,
    ])
  );
  const currentTeams = new Map(
    (currentForm?.f1TeamPerformance || []).map((team) => [team.teamId, team])
  );

  return {
    roundNumber: currentForm?.roundNumber || "",
    circuitName: currentForm?.circuitName || "",
    safetyCars: currentForm?.safetyCars || false,
    f1DriversPerformance: drivers.map((driver) => {
      const existing = currentDrivers.get(driver._id);
      return {
        driverId: driver._id,
        finishPosition: existing?.finishPosition ?? "",
        sprintFinishPosition: existing?.sprintFinishPosition ?? "0",
        qualiPosition: existing?.qualiPosition ?? "",
        fastestLap: existing?.fastestLap ?? false,
        points: existing?.points ?? "",
        placesFromStartingPosition:
          existing?.placesFromStartingPosition ?? "0",
      };
    }),
    f1TeamPerformance: teams.map((team) => {
      const existingTeam = currentTeams.get(team._id);
      const teamDrivers = drivers.filter(
        (driver) => getDriverTeamId(driver) === team._id
      );

      return {
        teamId: team._id,
        fastestPitStop: existingTeam?.fastestPitStop ?? false,
        overallPoints: existingTeam?.overallPoints ?? "",
        drivers: teamDrivers.map((driver) => {
          const existingDriver = existingTeam?.drivers?.find(
            (entry) => entry.driverId === driver._id
          );
          return {
            driverId: driver._id,
            pointsScored: existingDriver?.pointsScored ?? "",
          };
        }),
      };
    }),
  };
};

const createEmptyRaceForm = (teams, drivers) =>
  syncRaceForm(null, teams, drivers);

const isBlank = (value) =>
  value === "" || value === null || value === undefined;

const AdminPage = () => {
  const [teams, setTeams] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [teamForm, setTeamForm] = useState(createTeamForm);
  const [driverForm, setDriverForm] = useState(createDriverForm([]));
  const [raceForm, setRaceForm] = useState(createEmptyRaceForm([], []));
  const [roundToProcess, setRoundToProcess] = useState("");

  const [teamFeedback, setTeamFeedback] = useState(null);
  const [driverFeedback, setDriverFeedback] = useState(null);
  const [raceFeedback, setRaceFeedback] = useState(null);
  const [processFeedback, setProcessFeedback] = useState(null);
  const [processSummary, setProcessSummary] = useState(null);

  const [submittingTeam, setSubmittingTeam] = useState(false);
  const [submittingDriver, setSubmittingDriver] = useState(false);
  const [submittingRace, setSubmittingRace] = useState(false);
  const [processingRound, setProcessingRound] = useState(false);

  const teamById = useMemo(
    () => Object.fromEntries(teams.map((team) => [team._id, team])),
    [teams]
  );
  const sortedRaces = useMemo(
    () => [...races].sort((a, b) => b.roundNumber - a.roundNumber),
    [races]
  );
  const teamsWithoutDrivers = useMemo(
    () =>
      teams.filter(
        (team) =>
          !drivers.some((driver) => getDriverTeamId(driver) === team._id)
      ),
    [drivers, teams]
  );

  const loadAdminData = async () => {
    const [teamData, driverData, raceData] = await Promise.all([
      apiRequest("/admin/f1-teams", { auth: true }),
      apiRequest("/admin/f1-drivers", { auth: true }),
      apiRequest("/admin/f1-races", { auth: true }),
    ]);

    const nextTeams = teamData.teams || [];
    const nextDrivers = driverData.drivers || [];

    setTeams(nextTeams);
    setDrivers(nextDrivers);
    setRaces(raceData.races || []);
    setDriverForm((current) => ({
      ...current,
      f1TeamId: nextTeams.some((team) => team._id === current.f1TeamId)
        ? current.f1TeamId
        : nextTeams[0]?._id || "",
    }));
    setRaceForm((current) => syncRaceForm(current, nextTeams, nextDrivers));

    return { nextTeams, nextDrivers, nextRaces: raceData.races || [] };
  };

  useEffect(() => {
    let ignore = false;

    const initialize = async () => {
      try {
        setLoading(true);
        setPageError("");
        const [teamData, driverData, raceData] = await Promise.all([
          apiRequest("/admin/f1-teams", { auth: true }),
          apiRequest("/admin/f1-drivers", { auth: true }),
          apiRequest("/admin/f1-races", { auth: true }),
        ]);

        if (ignore) {
          return;
        }

        const nextTeams = teamData.teams || [];
        const nextDrivers = driverData.drivers || [];

        setTeams(nextTeams);
        setDrivers(nextDrivers);
        setRaces(raceData.races || []);
        setDriverForm(createDriverForm(nextTeams));
        setRaceForm(createEmptyRaceForm(nextTeams, nextDrivers));
      } catch (err) {
        if (!ignore) {
          setPageError(err.message || "Failed to load admin data");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      ignore = true;
    };
  }, []);

  const setSectionFeedback = (setter, type, message) => {
    setter({ type, message });
  };

  const handleTeamFormChange = (field, value) => {
    setTeamFeedback(null);
    setTeamForm((current) => ({ ...current, [field]: value }));
  };

  const handleDriverFormChange = (field, value) => {
    setDriverFeedback(null);
    setDriverForm((current) => ({ ...current, [field]: value }));
  };

  const handleRaceFieldChange = (field, value) => {
    setRaceFeedback(null);
    setRaceForm((current) => ({ ...current, [field]: value }));
  };

  const handleRaceDriverChange = (driverId, field, value) => {
    setRaceFeedback(null);
    setRaceForm((current) => ({
      ...current,
      f1DriversPerformance: current.f1DriversPerformance.map((driver) =>
        driver.driverId === driverId ? { ...driver, [field]: value } : driver
      ),
    }));
  };

  const handleRaceTeamChange = (teamId, field, value) => {
    setRaceFeedback(null);
    setRaceForm((current) => ({
      ...current,
      f1TeamPerformance: current.f1TeamPerformance.map((team) =>
        team.teamId === teamId ? { ...team, [field]: value } : team
      ),
    }));
  };

  const handleRaceTeamDriverChange = (teamId, driverId, value) => {
    setRaceFeedback(null);
    setRaceForm((current) => ({
      ...current,
      f1TeamPerformance: current.f1TeamPerformance.map((team) =>
        team.teamId === teamId
          ? {
              ...team,
              drivers: team.drivers.map((driver) =>
                driver.driverId === driverId
                  ? { ...driver, pointsScored: value }
                  : driver
              ),
            }
          : team
      ),
    }));
  };

  const submitTeam = async (event) => {
    event.preventDefault();

    try {
      setSubmittingTeam(true);
      setTeamFeedback(null);

      await apiRequest("/admin/insert-f1-team-data", {
        method: "POST",
        auth: true,
        body: {
          name: teamForm.name.trim(),
          fullName: teamForm.fullName.trim(),
          f1TeamPrincipal: {
            name: teamForm.principalName.trim(),
            nationality: teamForm.principalNationality.trim() || undefined,
            experienceYears: isBlank(teamForm.principalExperienceYears)
              ? undefined
              : Number(teamForm.principalExperienceYears),
          },
          description: teamForm.description.trim(),
          imageUrl: teamForm.imageUrl.trim(),
          teamCost: Number(teamForm.teamCost),
        },
      });

      await loadAdminData();
      setTeamForm(createTeamForm());
      setSectionFeedback(setTeamFeedback, "success", "Constructor created.");
    } catch (err) {
      setSectionFeedback(
        setTeamFeedback,
        "error",
        err.message || "Failed to create constructor."
      );
    } finally {
      setSubmittingTeam(false);
    }
  };

  const submitDriver = async (event) => {
    event.preventDefault();

    try {
      setSubmittingDriver(true);
      setDriverFeedback(null);

      await apiRequest("/admin/insert-f1-driver-data", {
        method: "POST",
        auth: true,
        body: {
          name: driverForm.name.trim(),
          surname: driverForm.surname.trim(),
          abbreviation: driverForm.abbreviation.trim(),
          f1TeamId: driverForm.f1TeamId,
          description: driverForm.description.trim(),
          imageUrl: driverForm.imageUrl.trim(),
          driverCost: Number(driverForm.driverCost),
        },
      });

      const { nextTeams } = await loadAdminData();
      setDriverForm(createDriverForm(nextTeams));
      setSectionFeedback(setDriverFeedback, "success", "Driver created.");
    } catch (err) {
      setSectionFeedback(
        setDriverFeedback,
        "error",
        err.message || "Failed to create driver."
      );
    } finally {
      setSubmittingDriver(false);
    }
  };

  const submitRace = async (event) => {
    event.preventDefault();

    if (teamsWithoutDrivers.length) {
      setSectionFeedback(
        setRaceFeedback,
        "error",
        `Every constructor must have at least one driver before race entry. Missing: ${teamsWithoutDrivers
          .map((team) => team.name)
          .join(", ")}.`
      );
      return;
    }

    const missingDriverFields = raceForm.f1DriversPerformance.some(
      (driver) =>
        isBlank(driver.finishPosition) ||
        isBlank(driver.qualiPosition) ||
        isBlank(driver.points)
    );
    const missingTeamFields = raceForm.f1TeamPerformance.some(
      (team) =>
        isBlank(team.overallPoints) ||
        team.drivers.some((driver) => isBlank(driver.pointsScored))
    );

    if (
      isBlank(raceForm.roundNumber) ||
      !raceForm.circuitName.trim() ||
      missingDriverFields ||
      missingTeamFields
    ) {
      setSectionFeedback(
        setRaceFeedback,
        "error",
        "Fill in round metadata plus every driver and constructor scoring field."
      );
      return;
    }

    try {
      setSubmittingRace(true);
      setRaceFeedback(null);

      await apiRequest("/admin/insert-f1-race-data", {
        method: "POST",
        auth: true,
        body: {
          roundNumber: Number(raceForm.roundNumber),
          circuitName: raceForm.circuitName.trim(),
          safetyCars: raceForm.safetyCars,
          f1DriversPerformance: raceForm.f1DriversPerformance.map((driver) => ({
            driverId: driver.driverId,
            finishPosition: Number(driver.finishPosition),
            sprintFinishPosition: Number(driver.sprintFinishPosition || 0),
            qualiPosition: Number(driver.qualiPosition),
            fastestLap: driver.fastestLap,
            points: Number(driver.points),
            placesFromStartingPosition: Number(
              driver.placesFromStartingPosition || 0
            ),
          })),
          f1TeamPerformance: raceForm.f1TeamPerformance.map((team) => ({
            teamId: team.teamId,
            drivers: team.drivers.map((driver) => ({
              driverId: driver.driverId,
              pointsScored: Number(driver.pointsScored),
            })),
            fastestPitStop: team.fastestPitStop,
            overallPoints: Number(team.overallPoints),
          })),
        },
      });

      const { nextTeams, nextDrivers } = await loadAdminData();
      setRaceForm(createEmptyRaceForm(nextTeams, nextDrivers));
      setSectionFeedback(setRaceFeedback, "success", "Race round created.");
    } catch (err) {
      setSectionFeedback(
        setRaceFeedback,
        "error",
        err.message || "Failed to create race round."
      );
    } finally {
      setSubmittingRace(false);
    }
  };

  const submitProcessRound = async (event) => {
    event.preventDefault();

    if (isBlank(roundToProcess)) {
      setSectionFeedback(
        setProcessFeedback,
        "error",
        "Enter a round number to process."
      );
      return;
    }

    try {
      setProcessingRound(true);
      setProcessFeedback(null);

      const data = await apiRequest("/admin/process-round", {
        method: "POST",
        auth: true,
        body: { roundNumber: Number(roundToProcess) },
      });

      setProcessSummary(data.summary || null);
      setSectionFeedback(setProcessFeedback, "success", data.message);
    } catch (err) {
      setSectionFeedback(
        setProcessFeedback,
        "error",
        err.message || "Failed to process round."
      );
    } finally {
      setProcessingRound(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <h3 className="text-lg font-semibold text-slate-700">
          Loading admin panel...
        </h3>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <p className="text-sm text-red-600">{pageError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-500">
          Admin Operations
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Race Control</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Manage the reusable admin operations for this project: create
              constructors, register drivers, enter full race rounds, and push
              scoring updates into fantasy teams and leagues.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <a className="rounded-full bg-slate-100 px-3 py-2" href="#constructors">
              Constructors
            </a>
            <a className="rounded-full bg-slate-100 px-3 py-2" href="#drivers">
              Drivers
            </a>
            <a className="rounded-full bg-slate-100 px-3 py-2" href="#races">
              Races
            </a>
            <a className="rounded-full bg-slate-100 px-3 py-2" href="#process-round">
              Process Round
            </a>
          </div>
        </div>
      </header>

      <section
        id="constructors"
        className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Constructors</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {teams.length} total
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {teams.map((team) => (
              <article
                key={team._id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <img
                  src={resolveAssetUrl(team.imageUrl)}
                  alt={team.name}
                  className="h-36 w-full object-cover"
                />
                <div className="space-y-2 p-4">
                  <p className="text-lg font-bold text-slate-900">
                    {team.fullName || team.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    Principal: {team.f1TeamPrincipal?.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    Cost: ${Number(team.teamCost).toFixed(1)} M
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <form
          onSubmit={submitTeam}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Create constructor
          </h3>
          <div className="mt-4 grid gap-3">
            <input
              required
              value={teamForm.name}
              onChange={(event) => handleTeamFormChange("name", event.target.value)}
              placeholder="Short name"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            <input
              required
              value={teamForm.fullName}
              onChange={(event) =>
                handleTeamFormChange("fullName", event.target.value)
              }
              placeholder="Full team name"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            <input
              required
              value={teamForm.principalName}
              onChange={(event) =>
                handleTeamFormChange("principalName", event.target.value)
              }
              placeholder="Team principal name"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={teamForm.principalNationality}
                onChange={(event) =>
                  handleTeamFormChange("principalNationality", event.target.value)
                }
                placeholder="Principal nationality"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
              <input
                type="number"
                min="0"
                value={teamForm.principalExperienceYears}
                onChange={(event) =>
                  handleTeamFormChange(
                    "principalExperienceYears",
                    event.target.value
                  )
                }
                placeholder="Experience years"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <input
              required
              value={teamForm.imageUrl}
              onChange={(event) =>
                handleTeamFormChange("imageUrl", event.target.value)
              }
              placeholder="/images/Teams/teamRedBull.png"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            <input
              required
              type="number"
              min="0"
              step="0.1"
              value={teamForm.teamCost}
              onChange={(event) =>
                handleTeamFormChange("teamCost", event.target.value)
              }
              placeholder="Team cost"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            <textarea
              value={teamForm.description}
              onChange={(event) =>
                handleTeamFormChange("description", event.target.value)
              }
              placeholder="Description"
              className="min-h-28 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            {teamForm.imageUrl ? (
              <img
                src={resolveAssetUrl(teamForm.imageUrl)}
                alt="Constructor preview"
                className="h-36 w-full rounded-xl object-cover"
              />
            ) : null}
          </div>
          {teamFeedback ? (
            <p
              className={`mt-4 text-sm ${
                teamFeedback.type === "error" ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {teamFeedback.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submittingTeam}
            className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submittingTeam ? "Saving..." : "Create Constructor"}
          </button>
        </form>
      </section>

      <section id="drivers" className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Drivers</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {drivers.length} total
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {drivers.map((driver) => {
              const team = teamById[getDriverTeamId(driver)];

              return (
                <article
                  key={driver._id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  <img
                    src={resolveAssetUrl(driver.imageUrl)}
                    alt={`${driver.name} ${driver.surname}`}
                    className="h-40 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <p className="text-lg font-bold text-slate-900">
                      {driver.name} {driver.surname}
                    </p>
                    <p className="text-sm text-slate-600">
                      {driver.abbreviation} · {team?.name || "No team"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Cost: ${Number(driver.driverCost).toFixed(1)} M
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={submitDriver}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900">Create driver</h3>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                value={driverForm.name}
                onChange={(event) =>
                  handleDriverFormChange("name", event.target.value)
                }
                placeholder="First name"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
              <input
                required
                value={driverForm.surname}
                onChange={(event) =>
                  handleDriverFormChange("surname", event.target.value)
                }
                placeholder="Surname"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                value={driverForm.abbreviation}
                onChange={(event) =>
                  handleDriverFormChange("abbreviation", event.target.value)
                }
                placeholder="Abbreviation"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900"
              />
              <select
                required
                value={driverForm.f1TeamId}
                onChange={(event) =>
                  handleDriverFormChange("f1TeamId", event.target.value)
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.fullName || team.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              required
              value={driverForm.imageUrl}
              onChange={(event) =>
                handleDriverFormChange("imageUrl", event.target.value)
              }
              placeholder="/images/drivers/driverVerstappen.png"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            <input
              required
              type="number"
              min="0"
              step="0.1"
              value={driverForm.driverCost}
              onChange={(event) =>
                handleDriverFormChange("driverCost", event.target.value)
              }
              placeholder="Driver cost"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            <textarea
              value={driverForm.description}
              onChange={(event) =>
                handleDriverFormChange("description", event.target.value)
              }
              placeholder="Description"
              className="min-h-28 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            {driverForm.imageUrl ? (
              <img
                src={resolveAssetUrl(driverForm.imageUrl)}
                alt="Driver preview"
                className="h-40 w-full rounded-xl object-cover"
              />
            ) : null}
          </div>
          {driverFeedback ? (
            <p
              className={`mt-4 text-sm ${
                driverFeedback.type === "error"
                  ? "text-red-600"
                  : "text-emerald-600"
              }`}
            >
              {driverFeedback.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submittingDriver || teams.length === 0}
            className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submittingDriver ? "Saving..." : "Create Driver"}
          </button>
        </form>
      </section>

      <section id="races" className="grid gap-6 lg:grid-cols-[0.8fr,1.2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Existing Races</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {sortedRaces.length} logged
            </span>
          </div>
          <div className="space-y-3">
            {sortedRaces.map((race) => (
              <article
                key={race._id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Round {race.roundNumber}
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      {race.circuitName}
                    </h3>
                  </div>
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                    {race.safetyCars ? "Safety cars" : "Green race"}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Driver rows
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {race.f1DriversPerformance.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Constructor rows
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {race.f1TeamPerformance.length}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <form
          onSubmit={submitRace}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Create full race round
              </h3>
              <p className="text-sm text-slate-600">
                Enter a complete scoring snapshot for every current driver and
                constructor.
              </p>
            </div>
            {teamsWithoutDrivers.length ? (
              <p className="text-sm font-medium text-red-600">
                Teams without drivers:{" "}
                {teamsWithoutDrivers.map((team) => team.name).join(", ")}
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              required
              type="number"
              min="1"
              value={raceForm.roundNumber}
              onChange={(event) =>
                handleRaceFieldChange("roundNumber", event.target.value)
              }
              placeholder="Round number"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            <input
              required
              value={raceForm.circuitName}
              onChange={(event) =>
                handleRaceFieldChange("circuitName", event.target.value)
              }
              placeholder="Circuit name"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 md:col-span-2"
            />
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 md:col-span-3">
              <input
                type="checkbox"
                checked={raceForm.safetyCars}
                onChange={(event) =>
                  handleRaceFieldChange("safetyCars", event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              Safety cars occurred during the round
            </label>
          </div>

          <div className="mt-6 space-y-4">
            <h4 className="text-base font-semibold text-slate-900">
              Driver performance
            </h4>
            {raceForm.f1DriversPerformance.map((row) => {
              const driver = drivers.find((entry) => entry._id === row.driverId);
              const team = teamById[getDriverTeamId(driver || {})];

              return (
                <article
                  key={row.driverId}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <img
                      src={resolveAssetUrl(driver?.imageUrl)}
                      alt={driver?.surname || "Driver"}
                      className="h-14 w-20 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {driver?.name} {driver?.surname}
                      </p>
                      <p className="text-xs text-slate-600">
                        {team?.fullName || team?.name || "No team assigned"}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      required
                      type="number"
                      min="1"
                      value={row.finishPosition}
                      onChange={(event) =>
                        handleRaceDriverChange(
                          row.driverId,
                          "finishPosition",
                          event.target.value
                        )
                      }
                      placeholder="Finish position"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                    <input
                      type="number"
                      min="0"
                      value={row.sprintFinishPosition}
                      onChange={(event) =>
                        handleRaceDriverChange(
                          row.driverId,
                          "sprintFinishPosition",
                          event.target.value
                        )
                      }
                      placeholder="Sprint finish"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                    <input
                      required
                      type="number"
                      min="1"
                      value={row.qualiPosition}
                      onChange={(event) =>
                        handleRaceDriverChange(
                          row.driverId,
                          "qualiPosition",
                          event.target.value
                        )
                      }
                      placeholder="Qualifying position"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                    <input
                      required
                      type="number"
                      step="0.1"
                      value={row.points}
                      onChange={(event) =>
                        handleRaceDriverChange(
                          row.driverId,
                          "points",
                          event.target.value
                        )
                      }
                      placeholder="Fantasy points"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                    <input
                      type="number"
                      value={row.placesFromStartingPosition}
                      onChange={(event) =>
                        handleRaceDriverChange(
                          row.driverId,
                          "placesFromStartingPosition",
                          event.target.value
                        )
                      }
                      placeholder="Places from grid"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                    <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={row.fastestLap}
                        onChange={(event) =>
                          handleRaceDriverChange(
                            row.driverId,
                            "fastestLap",
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Fastest lap
                    </label>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-6 space-y-4">
            <h4 className="text-base font-semibold text-slate-900">
              Constructor performance
            </h4>
            {raceForm.f1TeamPerformance.map((teamRow) => {
              const team = teamById[teamRow.teamId];
              const relatedDrivers = teamRow.drivers.map((driverRow) => ({
                row: driverRow,
                driver: drivers.find((driver) => driver._id === driverRow.driverId),
              }));

              return (
                <article
                  key={teamRow.teamId}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <img
                      src={resolveAssetUrl(team?.imageUrl)}
                      alt={team?.name || "Constructor"}
                      className="h-14 w-24 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {team?.fullName || team?.name}
                      </p>
                      <p className="text-xs text-slate-600">
                        {relatedDrivers.length} linked drivers
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      required
                      type="number"
                      step="0.1"
                      value={teamRow.overallPoints}
                      onChange={(event) =>
                        handleRaceTeamChange(
                          teamRow.teamId,
                          "overallPoints",
                          event.target.value
                        )
                      }
                      placeholder="Constructor overall points"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                    <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={teamRow.fastestPitStop}
                        onChange={(event) =>
                          handleRaceTeamChange(
                            teamRow.teamId,
                            "fastestPitStop",
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Fastest pit stop
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {relatedDrivers.map(({ row, driver }) => (
                      <div
                        key={row.driverId}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {driver?.name} {driver?.surname}
                        </p>
                        <input
                          required
                          type="number"
                          step="0.1"
                          value={row.pointsScored}
                          onChange={(event) =>
                            handleRaceTeamDriverChange(
                              teamRow.teamId,
                              row.driverId,
                              event.target.value
                            )
                          }
                          placeholder="Constructor contribution"
                          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                        />
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          {raceFeedback ? (
            <p
              className={`mt-4 text-sm ${
                raceFeedback.type === "error"
                  ? "text-red-600"
                  : "text-emerald-600"
              }`}
            >
              {raceFeedback.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submittingRace}
            className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submittingRace ? "Saving..." : "Create Race Round"}
          </button>
        </form>
      </section>

      <section
        id="process-round"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-6 lg:grid-cols-[0.7fr,1.3fr]">
          <form onSubmit={submitProcessRound}>
            <h2 className="text-xl font-semibold text-slate-900">Process round</h2>
            <p className="mt-2 text-sm text-slate-600">
              Apply a completed race round to fantasy team totals and league
              standings.
            </p>
            <input
              type="number"
              min="1"
              value={roundToProcess}
              onChange={(event) => {
                setProcessFeedback(null);
                setRoundToProcess(event.target.value);
              }}
              placeholder="Round number"
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            {processFeedback ? (
              <p
                className={`mt-3 text-sm ${
                  processFeedback.type === "error"
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {processFeedback.message}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={processingRound}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {processingRound ? "Processing..." : "Process Round"}
            </button>
          </form>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Last process summary
            </h3>
            {processSummary ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Fantasy teams updated
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {processSummary.fantasyTeams?.updatedCount ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Skipped: {processSummary.fantasyTeams?.skippedCount ?? 0}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    League entries updated
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {processSummary.leagueEntries?.updatedCount ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Already applied:{" "}
                    {processSummary.leagueEntries?.alreadyAppliedCount ?? 0}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Round
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {processSummary.roundNumber}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Affected leagues:{" "}
                    {processSummary.leagueEntries?.affectedLeagueCount ?? 0}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                No round has been processed from this admin session yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
