const mongoose = require("mongoose");
const fantasyTeamsModel = require("../models/f1FantasyTeam.js");
const f1DriverModel = require("../models/f1Driver.js");
const f1TeamModel = require("../models/f1Team.js");
const {
  calculateRemainingTransfers,
  createHttpError,
  getCurrentRoundNumber,
  validateAndBuildFantasyTeamSelection,
} = require("../services/fantasyTeamValidation.js");

const populateFantasyTeams = async (userId, teamId) => {
  const filter = teamId ? { userId: userId, _id: teamId } : { userId: userId };
  const detailedFantasyTeams = await fantasyTeamsModel
    .find(filter)
    .populate({
      path: "f1Drivers.driverId",
    })
    .populate({
      path: "f1Teams.teamId",
    })
    .populate({
      path: "raceHistory.raceId",
      select: "circuitName",
    })
    .lean();
  return detailedFantasyTeams;
};

exports.getAllFantasyTeams = async (req, res, next) => {
  try {
    const userId = req.userId;
    const fantasyTeams = await populateFantasyTeams(userId, null);
    if (fantasyTeams.length === 0) {
      return res.status(200).json({ message: "No teams found", teams: [] });
    }
    res
      .status(200)
      .json({ message: "Teams fetching succesfull", teams: fantasyTeams });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.getFantasyTeam = async (req, res, next) => {
  try {
    const userId = req.userId;
    const fantasyTeamId = req.params.fantasyTeamId;
    const fantasyTeam = await populateFantasyTeams(userId, fantasyTeamId);
    if (!fantasyTeam[0]) {
      return res.status(404).json({ message: "Fantasy team not found" }); //should never happen
    }
    res.status(200).json({ message: "Fantasy Team Found!", team: fantasyTeam });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.updateFantasyTeam = async (req, res, next) => {
  try {
    const userId = req.userId;
    const fantasyTeamId = req.body.fantasyTeamId;
    const fantasyTeamName = req.body.fantasyTeamName?.trim();

    if (!fantasyTeamName) {
      throw createHttpError(400, "Fantasy team name is required");
    }

    let existingTeam = null;
    if (fantasyTeamId) {
      if (!mongoose.Types.ObjectId.isValid(fantasyTeamId)) {
        throw createHttpError(400, "Fantasy team id is invalid");
      }
      existingTeam = await fantasyTeamsModel.findById(fantasyTeamId);
      if (!existingTeam) {
        throw createHttpError(404, "Fantasy team not found");
      }
      if (existingTeam.userId.toString() !== userId) {
        throw createHttpError(403, "You cannot edit another user's team");
      }
    }

    const normalizedTeam = await validateAndBuildFantasyTeamSelection({
      f1Drivers: req.body.f1Drivers,
      f1Teams: req.body.f1Teams,
    });
    const { remainingTransfers } = calculateRemainingTransfers({
      existingTeam,
      nextDrivers: normalizedTeam.f1Drivers,
      nextTeams: normalizedTeam.f1Teams,
    });

    let savedTeam;
    if (existingTeam) {
      existingTeam.fantasyTeamName = fantasyTeamName;
      existingTeam.f1Drivers = normalizedTeam.f1Drivers;
      existingTeam.f1Teams = normalizedTeam.f1Teams;
      existingTeam.remainingBudget = normalizedTeam.remainingBudget;
      existingTeam.remainingTransfers = remainingTransfers;
      savedTeam = await existingTeam.save();
    } else {
      savedTeam = await fantasyTeamsModel.create({
        _id: new mongoose.Types.ObjectId(),
        userId,
        fantasyTeamName,
        createdAtGP: getCurrentRoundNumber(),
        f1Drivers: normalizedTeam.f1Drivers,
        f1Teams: normalizedTeam.f1Teams,
        raceHistory: [],
        totalPoints: 0,
        remainingBudget: normalizedTeam.remainingBudget,
        remainingTransfers,
      });
    }

    res.status(existingTeam ? 200 : 201).json(savedTeam);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.getF1Drivers = async (req, res, next) => {
  try {
    const f1Drivers = await f1DriverModel.find(); //could use .select here to get only needed fields
    res.status(200).json(f1Drivers);
  } catch (err) {
    next(err);
  }
};

exports.getF1Teams = async (req, res, next) => {
  try {
    const f1Teams = await f1TeamModel.find(); //could use .select here to get only needed fields
    res.status(200).json(f1Teams);
  } catch (err) {
    next(err);
  }
};
