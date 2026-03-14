const mongoose = require("mongoose");

const f1DriverModel = require("../models/f1Driver");
const f1TeamModel = require("../models/f1Team");

const BUDGET_CAP = 100;
const INITIAL_TRANSFERS = 3;

const createHttpError = (statusCode, message, data) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (data !== undefined) {
    error.data = data;
  }
  return error;
};

const roundCurrency = (value) => Math.round(value * 100) / 100;

const normalizeObjectId = (value, fieldName) => {
  const normalizedValue = value?.toString?.() ?? value;
  if (!mongoose.Types.ObjectId.isValid(normalizedValue)) {
    throw createHttpError(400, `${fieldName} must be a valid id`);
  }
  return normalizedValue.toString();
};

const assertUniqueIds = (ids, fieldName) => {
  if (new Set(ids).size !== ids.length) {
    throw createHttpError(400, `${fieldName} cannot contain duplicates`);
  }
};

const countAddedSelections = (nextIds, previousIds) => {
  const previousIdSet = new Set(previousIds.map((id) => id.toString()));
  return nextIds.reduce((count, id) => {
    return previousIdSet.has(id.toString()) ? count : count + 1;
  }, 0);
};

const getCurrentRoundNumber = () => {
  const roundNumber = Number.parseInt(process.env.CURRENT_ROUND_NUMBER, 10);
  if (!Number.isInteger(roundNumber) || roundNumber <= 0) {
    throw createHttpError(
      500,
      "CURRENT_ROUND_NUMBER is not configured correctly"
    );
  }
  return roundNumber;
};

exports.validateAndBuildFantasyTeamSelection = async ({
  f1Drivers,
  f1Teams,
}) => {
  if (!Array.isArray(f1Drivers) || f1Drivers.length !== 5) {
    throw createHttpError(400, "A fantasy team must contain exactly 5 drivers");
  }
  if (!Array.isArray(f1Teams) || f1Teams.length !== 2) {
    throw createHttpError(
      400,
      "A fantasy team must contain exactly 2 constructors"
    );
  }

  const driverIds = f1Drivers.map((driver, index) =>
    normalizeObjectId(driver?.driverId, `f1Drivers[${index}].driverId`)
  );
  const teamIds = f1Teams.map((team, index) =>
    normalizeObjectId(team?.teamId, `f1Teams[${index}].teamId`)
  );

  assertUniqueIds(driverIds, "f1Drivers");
  assertUniqueIds(teamIds, "f1Teams");

  const doublePointsCount = f1Drivers.reduce((count, driver, index) => {
    if (typeof driver?.doublePoints !== "boolean") {
      throw createHttpError(
        400,
        `f1Drivers[${index}].doublePoints must be a boolean`
      );
    }
    return driver.doublePoints ? count + 1 : count;
  }, 0);

  if (doublePointsCount !== 1) {
    throw createHttpError(
      400,
      "A fantasy team must have exactly 1 DRS driver"
    );
  }

  const [driverDocs, teamDocs] = await Promise.all([
    f1DriverModel
      .find({ _id: { $in: driverIds } })
      .select("_id surname driverCost")
      .lean(),
    f1TeamModel.find({ _id: { $in: teamIds } }).select("_id name teamCost").lean(),
  ]);

  if (driverDocs.length !== driverIds.length) {
    throw createHttpError(400, "One or more selected drivers do not exist");
  }
  if (teamDocs.length !== teamIds.length) {
    throw createHttpError(
      400,
      "One or more selected constructors do not exist"
    );
  }

  const driverDocsById = new Map(
    driverDocs.map((driverDoc) => [driverDoc._id.toString(), driverDoc])
  );
  const teamDocsById = new Map(
    teamDocs.map((teamDoc) => [teamDoc._id.toString(), teamDoc])
  );

  const canonicalDrivers = f1Drivers.map((driver, index) => {
    const driverDoc = driverDocsById.get(driverIds[index]);
    return {
      driverId: driverDoc._id,
      driverSurname: driverDoc.surname,
      doublePoints: driver.doublePoints,
    };
  });

  const canonicalTeams = f1Teams.map((team, index) => {
    const teamDoc = teamDocsById.get(teamIds[index]);
    return {
      teamId: teamDoc._id,
      teamName: teamDoc.name,
    };
  });

  const totalDriverCost = driverDocs.reduce(
    (sum, driverDoc) => sum + driverDoc.driverCost,
    0
  );
  const totalTeamCost = teamDocs.reduce(
    (sum, teamDoc) => sum + teamDoc.teamCost,
    0
  );
  const remainingBudget = roundCurrency(
    BUDGET_CAP - totalDriverCost - totalTeamCost
  );

  if (remainingBudget < 0) {
    throw createHttpError(
      400,
      `Fantasy team exceeds the ${BUDGET_CAP}M budget cap`
    );
  }

  return {
    f1Drivers: canonicalDrivers,
    f1Teams: canonicalTeams,
    remainingBudget,
  };
};

exports.calculateRemainingTransfers = ({ existingTeam, nextDrivers, nextTeams }) => {
  if (!existingTeam) {
    return {
      remainingTransfers: INITIAL_TRANSFERS,
      transfersUsed: 0,
    };
  }

  const driverTransfers = countAddedSelections(
    nextDrivers.map((driver) => driver.driverId),
    existingTeam.f1Drivers.map((driver) => driver.driverId)
  );
  const teamTransfers = countAddedSelections(
    nextTeams.map((team) => team.teamId),
    existingTeam.f1Teams.map((team) => team.teamId)
  );
  const transfersUsed = driverTransfers + teamTransfers;

  if (transfersUsed > existingTeam.remainingTransfers) {
    throw createHttpError(
      400,
      `Too many transfers requested (used ${transfersUsed}, allowed ${existingTeam.remainingTransfers})`
    );
  }

  return {
    remainingTransfers: existingTeam.remainingTransfers - transfersUsed,
    transfersUsed,
  };
};

exports.createHttpError = createHttpError;
exports.getCurrentRoundNumber = getCurrentRoundNumber;
exports.BUDGET_CAP = BUDGET_CAP;
exports.INITIAL_TRANSFERS = INITIAL_TRANSFERS;
