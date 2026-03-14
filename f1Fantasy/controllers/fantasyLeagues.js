const mongoose = require("mongoose");
const fantasyLeagueModel = require("../models/f1FantasyLeague");
const fantasyTeamEntriesModel = require("../models/f1FantasyTeamEntries");
const fantasyTeamModel = require("../models/f1FantasyTeam");
const {
  createHttpError,
  getCurrentRoundNumber,
} = require("../services/fantasyTeamValidation.js");

exports.getAllLeagues = async (req, res, next) => {
  try {
    const userId = req.userId;
    const leagues = await fantasyLeagueModel
      .find()
      .select(
        "leagueType leagueName leagueImageURL rules.roundsIncluded entryAmount"
      );
    const simplifiedFantasyLeagues = await Promise.all(
      leagues.map(async (league) => {
        const userJoined = await fantasyTeamEntriesModel.exists({
          userId: userId,
          leagueId: league._id,
        });
        return {
          leagueType: league.leagueType, //could also have used spread operator (...) because we are using .select
          leagueName: league.leagueName,
          leagueImageURL: league.leagueImageURL,
          roundsIncluded: league.rules.roundsIncluded,
          entryAmount: league.entryAmount,
          leagueId: league._id,
          joined: !!userJoined,
        };
      })
    );
    res.status(200).json({ simplifiedFantasyLeagues });
  } catch (err) {
    next(err);
  }
};

exports.getLeague = async (req, res, next) => {
  try {
    const leagueId = req.params.leagueId;
    const userId = req.userId;
    const league = await fantasyLeagueModel.findById(leagueId);
    if (!league) {
      return res.status(404).json({
        message: "league doesnt exist",
      });
    }
    const userJoined = await fantasyTeamEntriesModel.exists({
      userId: userId,
      leagueId: league._id,
    });
    const enrichedLeague = {
      ...league.toObject(),
      userJoined: !!userJoined,
    };
    const entries = await fantasyTeamEntriesModel
      .find({ leagueId: leagueId })
      .sort({ totalPoints: -1 }) // descending
      .populate("fantasyTeamId", "fantasyTeamName") //replaces teamId with name
      .populate("userId", "name"); //replaces userId with some details
    if (entries.length === 0) {
      return res.status(200).json({
        message: "no entries yet",
        league: enrichedLeague,
        leaderboard: [],
      });
    }
    const leaderboard = entries.map((entry, index) => ({
      userName: entry.userId.name,
      teamName: entry.fantasyTeamId.fantasyTeamName,
      totalPoints: entry.totalPoints,
      rankingNumber: index + 1,
    }));
    res.status(200).json({
      league: enrichedLeague,
      leaderboard: leaderboard,
    });
  } catch (err) {
    next(err);
  }
};

exports.getJoinedLeagues = async (req, res, next) => {
  try {
    const userId = req.userId;
    const joinedLeagues = await fantasyTeamEntriesModel
      .find({ userId: userId })
      .populate(
        "leagueId",
        "leagueType leagueName leagueImageURL rules.roundsIncluded entryAmount"
      );
    if (joinedLeagues.length == 0) {
      return res.status(200).json({
        message: "Couldn't find any joined leagues",
        joinedLeagues: [],
      });
    }
    const simplifiedJoinedLeagues = joinedLeagues.map((league) => ({
      //league is an entry here actually
      leagueType: league.leagueId.leagueType,
      leagueName: league.leagueId.leagueName,
      leagueImageURL: league.leagueId.leagueImageURL,
      roundsIncluded: league.leagueId.rules.roundsIncluded,
      entryAmount: league.leagueId.entryAmount,
      leagueId: league.leagueId._id,
      userJoined: true,
    }));
    res.status(200).json({
      simplifiedJoinedLeagues,
    });
  } catch (err) {
    next(err);
  }
};

exports.joinLeague = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { leagueId, fantasyTeamId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(leagueId)) {
      throw createHttpError(400, "League id is invalid");
    }
    if (!mongoose.Types.ObjectId.isValid(fantasyTeamId)) {
      throw createHttpError(400, "Fantasy team id is invalid");
    }

    const league = await fantasyLeagueModel
      .findById(leagueId)
      .select("entryAmount rules.maxTeams");
    if (!league) {
      throw createHttpError(404, "League does not exist");
    }

    const fantasyTeam = await fantasyTeamModel.findById(fantasyTeamId).select(
      "_id userId"
    );
    if (!fantasyTeam) {
      throw createHttpError(404, "Fantasy team does not exist");
    }
    if (fantasyTeam.userId.toString() !== userId) {
      throw createHttpError(
        403,
        "You can only join a league with one of your own teams"
      );
    }

    const alreadyJoined = await fantasyTeamEntriesModel.exists({
      userId,
      fantasyTeamId,
      leagueId,
    });
    if (alreadyJoined) {
      return res.status(400).json({ message: "Already joined with this team" });
    }

    const currentEntryAmount = await fantasyTeamEntriesModel.countDocuments({
      leagueId,
    });
    if (currentEntryAmount >= league.rules.maxTeams) {
      throw createHttpError(400, "League is full");
    }

    await fantasyTeamEntriesModel.create({
      userId: userId,
      fantasyTeamId: fantasyTeamId,
      leagueId: leagueId,
      rankingInLeague: currentEntryAmount + 1,
      createdAtGP: getCurrentRoundNumber(),
    });
    await fantasyLeagueModel.findByIdAndUpdate(leagueId, {
      $set: { entryAmount: currentEntryAmount + 1 },
    });
    res.status(201).json({ message: "Joined league succesfully" });
  } catch (err) {
    next(err);
  }
};
