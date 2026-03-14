require("dotenv").config();

const DEFAULT_BASE_URL = process.env.INTEGRATION_BASE_URL || "http://localhost:3000";

const requiredEnvVars = [
  "INTEGRATION_ADMIN_EMAIL",
  "INTEGRATION_ADMIN_PASSWORD",
  "INTEGRATION_USER_EMAIL",
  "INTEGRATION_USER_PASSWORD",
];

const requiredDriverSurnames = [
  "Leclerc",
  "Hamilton",
  "Verstappen",
  "Tsunoda",
  "Alonso",
];

const requiredConstructorNames = ["Scuderia Ferrari", "Red Bull Racing"];

const now = new Date();
const runId = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
  now.getUTCDate()
).padStart(2, "0")}${String(now.getUTCHours()).padStart(2, "0")}${String(
  now.getUTCMinutes()
).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}`;

const createdArtifacts = {
  adminTeamId: null,
  userTeamId: null,
  tempConstructorId: null,
  tempDriverId: null,
  tempRaceId: null,
  tempLeagueId: null,
  tempRoundNumber: null,
};

const fail = (message) => {
  throw new Error(message);
};

const assert = (condition, message) => {
  if (!condition) {
    fail(message);
  }
};

const safeJsonParse = async (response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { raw: text };
  }
};

const formatStepPrefix = (index, total) => `[${String(index).padStart(2, "0")}/${total}]`;

const request = async ({
  method,
  path,
  token,
  expectedStatus,
  body,
  label,
}) => {
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${DEFAULT_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await safeJsonParse(response);
  const acceptedStatuses = Array.isArray(expectedStatus)
    ? expectedStatus
    : [expectedStatus];

  if (!acceptedStatuses.includes(response.status)) {
    fail(
      `${label} failed with status ${response.status}. Expected ${acceptedStatuses.join(
        ", "
      )}. Response: ${JSON.stringify(data)}`
    );
  }

  return { status: response.status, data };
};

const logStep = (stepNumber, totalSteps, message) => {
  console.log(`${formatStepPrefix(stepNumber, totalSteps)} ${message}`);
};

const getFieldFromResponse = (data, fieldName, label) => {
  const value = data?.[fieldName];
  if (!value) {
    fail(`${label} did not return ${fieldName}`);
  }
  return value;
};

const buildRacePayload = ({ roundNumber, circuitName, drivers, teams }) => {
  const driverRows = drivers.map((driver, index) => ({
    driverId: driver._id,
    finishPosition: index + 1,
    sprintFinishPosition: 0,
    qualiPosition: index + 1,
    fastestLap: index === 0,
    points: Math.max(0, 26 - index * 2),
    placesFromStartingPosition: 0,
  }));

  const driversByTeamId = drivers.reduce((accumulator, driver) => {
    const teamId = driver.f1TeamId;
    if (!accumulator.has(teamId)) {
      accumulator.set(teamId, []);
    }
    accumulator.get(teamId).push(driver);
    return accumulator;
  }, new Map());

  const teamRows = teams.map((team, index) => {
    const teamDrivers = driversByTeamId.get(team._id) || [];
    assert(
      teamDrivers.length > 0,
      `Cannot build race payload for ${team.name} because no driver rows were selected`
    );

    const driverEntries = teamDrivers.map((driver) => {
      const matchingDriverRow = driverRows.find((row) => row.driverId === driver._id);
      return {
        driverId: driver._id,
        pointsScored: matchingDriverRow.points,
      };
    });

    const driverPoints = driverEntries.reduce(
      (sum, driverEntry) => sum + driverEntry.pointsScored,
      0
    );

    return {
      teamId: team._id,
      drivers: driverEntries,
      fastestPitStop: index === 0,
      overallPoints: driverPoints + (index === 0 ? 10 : 0),
    };
  });

  return {
    roundNumber,
    circuitName,
    safetyCars: false,
    f1DriversPerformance: driverRows,
    f1TeamPerformance: teamRows,
  };
};

const findRequiredLineup = (drivers, teams) => {
  const selectedDrivers = requiredDriverSurnames.map((surname) => {
    const driver = drivers.find((candidate) => candidate.surname === surname);
    assert(driver, `Required driver ${surname} was not found in API data`);
    return driver;
  });

  const selectedTeams = requiredConstructorNames.map((teamName) => {
    const team = teams.find((candidate) => candidate.name === teamName);
    assert(team, `Required constructor ${teamName} was not found in API data`);
    return team;
  });

  const totalCost =
    selectedDrivers.reduce((sum, driver) => sum + Number(driver.driverCost), 0) +
    selectedTeams.reduce((sum, team) => sum + Number(team.teamCost), 0);

  assert(totalCost <= 100, `Selected validation lineup exceeds budget cap: ${totalCost}`);

  return { selectedDrivers, selectedTeams };
};

const createFantasyTeamPayload = (fantasyTeamName, drivers, teams, existingTeamId) => ({
  ...(existingTeamId ? { fantasyTeamId: existingTeamId } : {}),
  fantasyTeamName,
  f1Drivers: drivers.map((driver, index) => ({
    driverId: driver._id,
    doublePoints: index === 0,
  })),
  f1Teams: teams.map((team) => ({
    teamId: team._id,
  })),
});

const main = async () => {
  for (const envVar of requiredEnvVars) {
    assert(process.env[envVar], `Missing required environment variable: ${envVar}`);
  }

  const steps = [];

  const ctx = {
    adminToken: null,
    userToken: null,
    adminDrivers: null,
    adminTeams: null,
    adminRaces: null,
    selectedDrivers: null,
    selectedTeams: null,
    tempLeague: null,
  };

  steps.push(async () => {
    const { data } = await request({
      method: "GET",
      path: "/health",
      expectedStatus: 200,
      label: "health check",
    });
    assert(data?.status === "ok", "Health endpoint did not return status=ok");
  });

  steps.push(async () => {
    const { data } = await request({
      method: "POST",
      path: "/auth/login",
      expectedStatus: 200,
      body: {
        email: process.env.INTEGRATION_ADMIN_EMAIL,
        password: process.env.INTEGRATION_ADMIN_PASSWORD,
      },
      label: "admin login",
    });
    ctx.adminToken = getFieldFromResponse(data, "token", "admin login");
  });

  steps.push(async () => {
    const { data } = await request({
      method: "POST",
      path: "/auth/login",
      expectedStatus: 200,
      body: {
        email: process.env.INTEGRATION_USER_EMAIL,
        password: process.env.INTEGRATION_USER_PASSWORD,
      },
      label: "user login",
    });
    ctx.userToken = getFieldFromResponse(data, "token", "user login");
  });

  steps.push(async () => {
    const { data } = await request({
      method: "GET",
      path: "/admin/f1-drivers",
      token: ctx.adminToken,
      expectedStatus: 200,
      label: "admin get drivers",
    });
    ctx.adminDrivers = data?.drivers;
    assert(Array.isArray(ctx.adminDrivers) && ctx.adminDrivers.length >= 10, "Admin drivers endpoint returned insufficient data");
  });

  steps.push(async () => {
    const { data } = await request({
      method: "GET",
      path: "/admin/f1-teams",
      token: ctx.adminToken,
      expectedStatus: 200,
      label: "admin get teams",
    });
    ctx.adminTeams = data?.teams;
    assert(Array.isArray(ctx.adminTeams) && ctx.adminTeams.length >= 5, "Admin teams endpoint returned insufficient data");
  });

  steps.push(async () => {
    const { data } = await request({
      method: "GET",
      path: "/admin/f1-races",
      token: ctx.adminToken,
      expectedStatus: 200,
      label: "admin get races",
    });
    ctx.adminRaces = data?.races;
    assert(Array.isArray(ctx.adminRaces) && ctx.adminRaces.length >= 1, "Admin races endpoint returned insufficient data");
  });

  steps.push(async () => {
    const { selectedDrivers, selectedTeams } = findRequiredLineup(
      ctx.adminDrivers,
      ctx.adminTeams
    );
    ctx.selectedDrivers = selectedDrivers;
    ctx.selectedTeams = selectedTeams;
  });

  steps.push(async () => {
    const { data } = await request({
      method: "GET",
      path: "/fantasyTeams/f1drivers",
      token: ctx.userToken,
      expectedStatus: 200,
      label: "user get drivers",
    });
    assert(Array.isArray(data) && data.length >= 10, "User drivers endpoint returned insufficient data");
  });

  steps.push(async () => {
    const { data } = await request({
      method: "GET",
      path: "/fantasyTeams/f1teams",
      token: ctx.userToken,
      expectedStatus: 200,
      label: "user get constructors",
    });
    assert(Array.isArray(data) && data.length >= 5, "User constructors endpoint returned insufficient data");
  });

  steps.push(async () => {
    const { data } = await request({
      method: "PUT",
      path: "/fantasyTeams/update-fantasy-team",
      token: ctx.userToken,
      expectedStatus: 201,
      body: createFantasyTeamPayload(
        `Integration User Team ${runId}`,
        ctx.selectedDrivers,
        ctx.selectedTeams
      ),
      label: "user create fantasy team",
    });
    createdArtifacts.userTeamId = getFieldFromResponse(
      data,
      "_id",
      "user create fantasy team"
    );
    assert(data.remainingBudget >= 0, "User fantasy team remainingBudget was invalid");
  });

  steps.push(async () => {
    await request({
      method: "PUT",
      path: "/fantasyTeams/update-fantasy-team",
      token: ctx.userToken,
      expectedStatus: 400,
      body: {
        fantasyTeamName: `Invalid Duplicate Team ${runId}`,
        f1Drivers: [
          { driverId: ctx.selectedDrivers[0]._id, doublePoints: true },
          { driverId: ctx.selectedDrivers[0]._id, doublePoints: false },
          { driverId: ctx.selectedDrivers[2]._id, doublePoints: false },
          { driverId: ctx.selectedDrivers[3]._id, doublePoints: false },
          { driverId: ctx.selectedDrivers[4]._id, doublePoints: false },
        ],
        f1Teams: ctx.selectedTeams.map((team) => ({ teamId: team._id })),
      },
      label: "user create invalid fantasy team",
    });
  });

  steps.push(async () => {
    const { data } = await request({
      method: "GET",
      path: "/fantasyTeams/get-fantasy-teams",
      token: ctx.userToken,
      expectedStatus: 200,
      label: "user get all fantasy teams",
    });
    assert(
      Array.isArray(data?.teams) &&
        data.teams.some((team) => team._id === createdArtifacts.userTeamId),
      "User fantasy teams list does not include the created team"
    );
  });

  steps.push(async () => {
    const { data } = await request({
      method: "GET",
      path: `/fantasyTeams/get-fantasy-team/${createdArtifacts.userTeamId}`,
      token: ctx.userToken,
      expectedStatus: 200,
      label: "user get fantasy team by id",
    });
    assert(
      Array.isArray(data?.team) && data.team[0]?._id === createdArtifacts.userTeamId,
      "User fantasy team detail did not return the created team"
    );
  });

  steps.push(async () => {
    const { data } = await request({
      method: "PUT",
      path: "/fantasyTeams/update-fantasy-team",
      token: ctx.adminToken,
      expectedStatus: 201,
      body: createFantasyTeamPayload(
        `Integration Admin Team ${runId}`,
        ctx.selectedDrivers,
        ctx.selectedTeams
      ),
      label: "admin create fantasy team",
    });
    createdArtifacts.adminTeamId = getFieldFromResponse(
      data,
      "_id",
      "admin create fantasy team"
    );
  });

  steps.push(async () => {
    const { data } = await request({
      method: "POST",
      path: "/admin/insert-f1-team-data",
      token: ctx.adminToken,
      expectedStatus: 201,
      body: {
        name: `Integration Constructor ${runId}`,
        fullName: `Integration Constructor ${runId} GP`,
        f1TeamPrincipal: {
          name: `Principal ${runId}`,
          nationality: "Dutch",
          experienceYears: 9,
        },
        description: "Temporary constructor created by integration test",
        imageUrl: "/images/Teams/teamRedBull.png",
        teamCost: 11,
      },
      label: "admin insert constructor",
    });
    createdArtifacts.tempConstructorId = getFieldFromResponse(
      data,
      "teamId",
      "admin insert constructor"
    );
  });

  steps.push(async () => {
    const { data } = await request({
      method: "POST",
      path: "/admin/insert-f1-driver-data",
      token: ctx.adminToken,
      expectedStatus: 201,
      body: {
        name: "Integration",
        surname: `Driver${runId}`,
        abbreviation: `I${runId.slice(-2)}`,
        f1TeamId: createdArtifacts.tempConstructorId,
        description: "Temporary driver created by integration test",
        imageUrl: "/images/drivers/driverVerstappen.png",
        driverCost: 9.5,
      },
      label: "admin insert driver",
    });
    createdArtifacts.tempDriverId = getFieldFromResponse(
      data,
      "driverId",
      "admin insert driver"
    );
  });

  steps.push(async () => {
    const maxRoundNumber = ctx.adminRaces.reduce((maxRound, race) => {
      return Math.max(maxRound, Number(race.roundNumber) || 0);
    }, 0);
    const nextRoundNumber = maxRoundNumber + 1;
    createdArtifacts.tempRoundNumber = nextRoundNumber;

    const fullRacePayload = buildRacePayload({
      roundNumber: nextRoundNumber,
      circuitName: `Integration Circuit ${runId}`,
      drivers: ctx.adminDrivers,
      teams: ctx.adminTeams,
    });

    const { data } = await request({
      method: "POST",
      path: "/admin/insert-f1-race-data",
      token: ctx.adminToken,
      expectedStatus: 201,
      body: fullRacePayload,
      label: "admin insert race",
    });
    createdArtifacts.tempRaceId = getFieldFromResponse(
      data,
      "raceId",
      "admin insert race"
    );
  });

  steps.push(async () => {
    const duplicateRacePayload = buildRacePayload({
      roundNumber: createdArtifacts.tempRoundNumber,
      circuitName: `Integration Circuit ${runId}`,
      drivers: ctx.adminDrivers,
      teams: ctx.adminTeams,
    });

    await request({
      method: "POST",
      path: "/admin/insert-f1-race-data",
      token: ctx.adminToken,
      expectedStatus: 409,
      body: duplicateRacePayload,
      label: "admin insert duplicate race round",
    });
  });

  steps.push(async () => {
    const { data } = await request({
      method: "PUT",
      path: "/admin/fantasyLeagues/update-league",
      token: ctx.adminToken,
      expectedStatus: 201,
      body: {
        leagueType: "integration",
        leagueName: `Integration League ${runId}`,
        leagueImageURL: "/images/Leagues/league1.png",
        maxTeams: 5,
        roundsIncluded: [
          {
            raceId: createdArtifacts.tempRaceId,
            roundNumber: createdArtifacts.tempRoundNumber,
          },
        ],
      },
      label: "admin create integration league",
    });
    const league = data?.result;
    assert(league?._id, "Admin create league did not return a league id");
    createdArtifacts.tempLeagueId = league._id;
  });

  steps.push(async () => {
    const { data } = await request({
      method: "GET",
      path: "/fantasyLeagues/get-all-leagues",
      token: ctx.userToken,
      expectedStatus: 200,
      label: "user get all leagues",
    });
    assert(
      Array.isArray(data?.simplifiedFantasyLeagues) &&
        data.simplifiedFantasyLeagues.some(
          (league) => league.leagueId === createdArtifacts.tempLeagueId
        ),
      "User league list does not include the temporary integration league"
    );
  });

  steps.push(async () => {
    await request({
      method: "GET",
      path: `/fantasyLeagues/get-league/${createdArtifacts.tempLeagueId}`,
      token: ctx.userToken,
      expectedStatus: 200,
      label: "user get league detail",
    });
  });

  steps.push(async () => {
    await request({
      method: "GET",
      path: "/fantasyLeagues/get-joined-leagues",
      token: ctx.userToken,
      expectedStatus: 200,
      label: "user get joined leagues before join",
    });
  });

  steps.push(async () => {
    await request({
      method: "POST",
      path: "/fantasyLeagues/join-league",
      token: ctx.userToken,
      expectedStatus: 201,
      body: {
        leagueId: createdArtifacts.tempLeagueId,
        fantasyTeamId: createdArtifacts.userTeamId,
      },
      label: "user join league with owned team",
    });
  });

  steps.push(async () => {
    await request({
      method: "POST",
      path: "/fantasyLeagues/join-league",
      token: ctx.userToken,
      expectedStatus: 403,
      body: {
        leagueId: createdArtifacts.tempLeagueId,
        fantasyTeamId: createdArtifacts.adminTeamId,
      },
      label: "user join league with admin team",
    });
  });

  steps.push(async () => {
    const { data } = await request({
      method: "GET",
      path: "/fantasyLeagues/get-joined-leagues",
      token: ctx.userToken,
      expectedStatus: 200,
      label: "user get joined leagues after join",
    });
    assert(
      Array.isArray(data?.simplifiedJoinedLeagues) &&
        data.simplifiedJoinedLeagues.some(
          (league) => league.leagueId === createdArtifacts.tempLeagueId
        ),
      "Joined leagues response does not include the integration league after joining"
    );
  });

  steps.push(async () => {
    const { data } = await request({
      method: "POST",
      path: "/admin/process-round",
      token: ctx.adminToken,
      expectedStatus: 200,
      body: {
        roundNumber: createdArtifacts.tempRoundNumber,
      },
      label: "admin process round first run",
    });
    const summary = data?.summary;
    assert(summary?.roundNumber === createdArtifacts.tempRoundNumber, "Process round summary used the wrong round");
    assert(summary?.fantasyTeams?.updatedCount >= 1, "Process round did not update any fantasy teams");
  });

  steps.push(async () => {
    const { data } = await request({
      method: "POST",
      path: "/admin/process-round",
      token: ctx.adminToken,
      expectedStatus: 200,
      body: {
        roundNumber: createdArtifacts.tempRoundNumber,
      },
      label: "admin process round second run",
    });
    const summary = data?.summary;
    assert(
      summary?.leagueEntries?.alreadyAppliedCount >= 1,
      "Second process-round call did not report already-applied league entries"
    );
  });

  steps.push(async () => {
    await request({
      method: "POST",
      path: "/admin/update-all-fantasy-teams",
      token: ctx.adminToken,
      expectedStatus: 200,
      body: {
        roundNumber: createdArtifacts.tempRoundNumber,
      },
      label: "legacy update-all-fantasy-teams",
    });
  });

  steps.push(async () => {
    await request({
      method: "POST",
      path: "/admin/update-all-league-entries",
      token: ctx.adminToken,
      expectedStatus: 200,
      body: {
        roundNumber: createdArtifacts.tempRoundNumber,
      },
      label: "legacy update-all-league-entries",
    });
  });

  steps.push(async () => {
    const { data } = await request({
      method: "GET",
      path: `/fantasyLeagues/get-league/${createdArtifacts.tempLeagueId}`,
      token: ctx.userToken,
      expectedStatus: 200,
      label: "user get processed league detail",
    });
    assert(
      Array.isArray(data?.leaderboard) && data.leaderboard.length >= 1,
      "Processed league detail did not return a leaderboard"
    );
  });

  console.log(`Running destructive backend integration suite against ${DEFAULT_BASE_URL}`);
  console.log(`Artifacts created by this run will be prefixed with Integration ... ${runId}`);

  for (const [index, step] of steps.entries()) {
    logStep(index + 1, steps.length, step.name || "integration step");
    await step();
  }

  console.log("Integration suite passed.");
  console.log(
    JSON.stringify(
      {
        createdArtifacts,
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error("Integration suite failed.");
  console.error(error.stack || error.message || error);
  console.error(
    JSON.stringify(
      {
        createdArtifacts,
      },
      null,
      2
    )
  );
  process.exit(1);
});
