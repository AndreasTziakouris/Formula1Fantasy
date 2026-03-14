const fantasyTeamModel = require("../models/f1FantasyTeam");
const fantasyLeagueModel = require("../models/f1FantasyLeague");
const raceDataModel = require("../models/f1RaceData");
const fantasyTeamEntriesModel = require("../models/f1FantasyTeamEntries");
const {
  createHttpError,
  getCurrentRoundNumber,
} = require("./fantasyTeamValidation");

const parseRoundNumber = (value) => {
  const roundNumber = Number.parseInt(value, 10);
  if (!Number.isInteger(roundNumber) || roundNumber <= 0) {
    throw createHttpError(400, "roundNumber must be a positive integer");
  }
  return roundNumber;
};

const getRaceDataForRound = async (roundNumber) => {
  const raceData = await raceDataModel.findOne({ roundNumber });
  if (!raceData) {
    throw createHttpError(404, `Race data for round ${roundNumber} not found`);
  }
  return raceData;
};

exports.simulateTeamPoints = async (team) => {
  // Right now this is not called. If used later, it replays all rounds up to
  // the team's creation point by reusing the same idempotent calculation path.
  for (let i = 1; i <= getCurrentRoundNumber(); i++) {
    await exports.calculateRoundPoints(team, i);
  }
};

exports.calculateRoundPoints = async (team, roundNumber, existingRaceData) => {
  const raceData = existingRaceData || (await getRaceDataForRound(roundNumber));

  if (roundNumber < team.createdAtGP) {
    return { applied: false, pointsScored: 0 };
  }

  const alreadyExists = team.raceHistory.some((raceRecord) => {
    return raceRecord.roundNumber === roundNumber;
  });

  if (alreadyExists) {
    return { applied: false, pointsScored: 0 };
  }

  let pointsScored = 0;

  for (const driver of team.f1Drivers) {
    const performance = raceData.f1DriversPerformance.find((record) => {
      return record.driverId.toString() === driver.driverId.toString();
    });
    if (!performance) {
      throw createHttpError(
        500,
        `Missing race performance for driver ${driver.driverId.toString()}`
      );
    }

    let driverPoints = performance.points;
    if (driver.doublePoints) {
      driverPoints *= 2;
    }
    pointsScored += driverPoints;
  }

  for (const f1team of team.f1Teams) {
    const performance = raceData.f1TeamPerformance.find((record) => {
      return record.teamId.toString() === f1team.teamId.toString();
    });
    if (!performance) {
      throw createHttpError(
        500,
        `Missing race performance for constructor ${f1team.teamId.toString()}`
      );
    }
    pointsScored += performance.overallPoints;
  }

  team.raceHistory.push({
    raceId: raceData._id,
    roundNumber: raceData.roundNumber,
    pointsEarned: pointsScored,
  });
  team.totalPoints += pointsScored;
  await team.save();

  return { applied: true, pointsScored };
};

const updateAllFantasyTeamsForRoundNumber = async (roundNumber) => {
  const raceData = await getRaceDataForRound(roundNumber);
  const allTeams = await fantasyTeamModel.find();
  let updatedCount = 0;
  let skippedCount = 0;

  for (const team of allTeams) {
    const result = await exports.calculateRoundPoints(team, roundNumber, raceData);
    if (result.applied) {
      updatedCount += 1;
    } else {
      skippedCount += 1;
    }
  }

  return {
    roundNumber,
    updatedCount,
    skippedCount,
  };
};

const updateAllLeagueEntriesForRoundNumber = async (roundNumber) => {
  await getRaceDataForRound(roundNumber);

  const affectedLeagues = await fantasyLeagueModel.find({
    "rules.roundsIncluded.roundNumber": roundNumber,
  });
  const leagueIds = affectedLeagues.map((league) => league._id);
  const entries = await fantasyTeamEntriesModel
    .find({ leagueId: { $in: leagueIds } })
    .populate("fantasyTeamId", "createdAtGP raceHistory");

  let updatedCount = 0;
  let alreadyAppliedCount = 0;
  let skippedCount = 0;

  for (const entry of entries) {
    const appliedRounds = entry.appliedRounds || [];
    if (appliedRounds.some((appliedRound) => Number(appliedRound) === roundNumber)) {
      alreadyAppliedCount += 1;
      continue;
    }

    const roundRecord = entry.fantasyTeamId?.raceHistory.find((record) => {
      return record.roundNumber === roundNumber;
    });
    if (!roundRecord) {
      skippedCount += 1;
      continue;
    }

    entry.totalPoints += roundRecord.pointsEarned;
    entry.appliedRounds = [...appliedRounds, roundNumber];
    await entry.save();
    updatedCount += 1;
  }

  await exports.updateAllLeagueEntriesRanking(roundNumber);

  return {
    roundNumber,
    affectedLeagueCount: leagueIds.length,
    updatedCount,
    alreadyAppliedCount,
    skippedCount,
  };
};

exports.processRoundNumber = async (roundNumber) => {
  const teamSummary = await updateAllFantasyTeamsForRoundNumber(roundNumber);
  const entrySummary = await updateAllLeagueEntriesForRoundNumber(roundNumber);

  return {
    roundNumber,
    fantasyTeams: teamSummary,
    leagueEntries: entrySummary,
  };
};

exports.updateAllFantasyTeamForRound = async (req, res, next) => {
  try {
    const roundNumber = parseRoundNumber(req.body.roundNumber);
    const summary = await updateAllFantasyTeamsForRoundNumber(roundNumber);
    res
      .status(200)
      .json({ message: "Teams updated succesfully", summary: summary });
  } catch (err) {
    next(err);
  }
};

exports.updateAllLeagueEntriesForRound = async (req, res, next) => {
  try {
    const roundNumber = parseRoundNumber(req.body.roundNumber);
    const summary = await updateAllLeagueEntriesForRoundNumber(roundNumber);
    res.status(200).json({
      message: "Team entries updated succesfully",
      summary: summary,
    });
  } catch (err) {
    next(err);
  }
};

exports.processRound = async (req, res, next) => {
  try {
    const roundNumber = parseRoundNumber(req.body.roundNumber);
    const summary = await exports.processRoundNumber(roundNumber);
    res
      .status(200)
      .json({ message: "Round processed succesfully", summary: summary });
  } catch (err) {
    next(err);
  }
};

exports.updateAllLeagueEntriesRanking = async (roundNumber) => {
  const affectedLeagueIds = await fantasyLeagueModel
    .find({
      "rules.roundsIncluded.roundNumber": roundNumber,
    })
    .select("_id");

  for (const leagueId of affectedLeagueIds) {
    const entries = await fantasyTeamEntriesModel
      .find({ leagueId: leagueId._id })
      .sort({ totalPoints: -1 })
      .select("_id");

    const ops = entries.map((entry, idx) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: { $set: { rankingInLeague: idx + 1 } },
      },
    }));

    if (ops.length) {
      await fantasyTeamEntriesModel.bulkWrite(ops);
    }
  }
};
