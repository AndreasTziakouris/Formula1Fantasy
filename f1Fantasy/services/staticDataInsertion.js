const mongoose = require("mongoose");

const f1DriverModel = require("../models/f1Driver");
const f1TeamModel = require("../models/f1Team");
const f1RaceDataModel = require("../models/f1RaceData");
const {
  createHttpError,
} = require("./fantasyTeamValidation");

const normalizeString = (value, fieldName) => {
  if (typeof value !== "string" || !value.trim()) {
    throw createHttpError(400, `${fieldName} is required`);
  }
  return value.trim();
};

const normalizeBoolean = (value, fieldName) => {
  if (typeof value !== "boolean") {
    throw createHttpError(400, `${fieldName} must be a boolean`);
  }
  return value;
};

const normalizeNumber = (value, fieldName, { integer = false, min } = {}) => {
  const normalizedValue = Number(value);
  if (!Number.isFinite(normalizedValue)) {
    throw createHttpError(400, `${fieldName} must be a valid number`);
  }
  if (integer && !Number.isInteger(normalizedValue)) {
    throw createHttpError(400, `${fieldName} must be an integer`);
  }
  if (min !== undefined && normalizedValue < min) {
    throw createHttpError(400, `${fieldName} must be at least ${min}`);
  }
  return normalizedValue;
};

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

exports.getF1Drivers = async (req, res, next) => {
  try {
    const drivers = await f1DriverModel.find().sort({ surname: 1, name: 1 }).lean();
    res.status(200).json({ drivers });
  } catch (err) {
    next(err);
  }
};

exports.getF1Teams = async (req, res, next) => {
  try {
    const teams = await f1TeamModel.find().sort({ name: 1 }).lean();
    res.status(200).json({ teams });
  } catch (err) {
    next(err);
  }
};

exports.getF1Races = async (req, res, next) => {
  try {
    const races = await f1RaceDataModel.find().sort({ roundNumber: 1 }).lean();
    res.status(200).json({ races });
  } catch (err) {
    next(err);
  }
};

exports.insertf1DriverData = async (req, res, next) => {
  try {
    const name = normalizeString(req.body.name, "name");
    const surname = normalizeString(req.body.surname, "surname");
    const abbreviation = normalizeString(req.body.abbreviation, "abbreviation");
    const f1TeamId = normalizeObjectId(req.body.f1TeamId, "f1TeamId");
    const imageUrl = normalizeString(req.body.imageUrl, "imageUrl");
    const driverCost = normalizeNumber(req.body.driverCost, "driverCost", {
      min: 0,
    });
    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : undefined;

    const teamExists = await f1TeamModel.exists({ _id: f1TeamId });
    if (!teamExists) {
      throw createHttpError(400, "f1TeamId must reference an existing team");
    }

    const driver = new f1DriverModel({
      name,
      surname,
      abbreviation,
      f1TeamId,
      description,
      imageUrl,
      driverCost,
    });
    await driver.save();

    res
      .status(201)
      .json({ message: "F1 driver data saved", driverId: driver._id });
  } catch (err) {
    next(err);
  }
};

exports.insertf1TeamData = async (req, res, next) => {
  try {
    const name = normalizeString(req.body.name, "name");
    const fullName = normalizeString(req.body.fullName, "fullName");
    const imageUrl = normalizeString(req.body.imageUrl, "imageUrl");
    const teamCost = normalizeNumber(req.body.teamCost, "teamCost", { min: 0 });
    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : undefined;
    const f1TeamPrincipal = req.body.f1TeamPrincipal;

    if (!f1TeamPrincipal || typeof f1TeamPrincipal !== "object") {
      throw createHttpError(400, "f1TeamPrincipal is required");
    }

    const normalizedPrincipal = {
      name: normalizeString(f1TeamPrincipal.name, "f1TeamPrincipal.name"),
    };
    if (f1TeamPrincipal.nationality !== undefined) {
      normalizedPrincipal.nationality = normalizeString(
        f1TeamPrincipal.nationality,
        "f1TeamPrincipal.nationality"
      );
    }
    if (f1TeamPrincipal.experienceYears !== undefined) {
      normalizedPrincipal.experienceYears = normalizeNumber(
        f1TeamPrincipal.experienceYears,
        "f1TeamPrincipal.experienceYears",
        { integer: true, min: 0 }
      );
    }

    const team = new f1TeamModel({
      name,
      fullName,
      f1TeamPrincipal: normalizedPrincipal,
      description,
      imageUrl,
      teamCost,
    });
    await team.save();

    res.status(201).json({ message: "F1 team data saved", teamId: team._id });
  } catch (err) {
    next(err);
  }
};

exports.insertf1RaceResults = async (req, res, next) => {
  try {
    const roundNumber = normalizeNumber(req.body.roundNumber, "roundNumber", {
      integer: true,
      min: 1,
    });
    const circuitName = normalizeString(req.body.circuitName, "circuitName");
    const safetyCars = normalizeBoolean(req.body.safetyCars, "safetyCars");
    const f1DriversPerformance = req.body.f1DriversPerformance;
    const f1TeamPerformance = req.body.f1TeamPerformance;

    if (
      !Array.isArray(f1DriversPerformance) ||
      f1DriversPerformance.length === 0
    ) {
      throw createHttpError(
        400,
        "f1DriversPerformance must be a non-empty array"
      );
    }
    if (!Array.isArray(f1TeamPerformance) || f1TeamPerformance.length === 0) {
      throw createHttpError(
        400,
        "f1TeamPerformance must be a non-empty array"
      );
    }

    const existingRace = await f1RaceDataModel.exists({ roundNumber });
    if (existingRace) {
      throw createHttpError(
        409,
        `Race data for round ${roundNumber} already exists`
      );
    }

    const driverIds = f1DriversPerformance.map((performance, index) =>
      normalizeObjectId(
        performance?.driverId,
        `f1DriversPerformance[${index}].driverId`
      )
    );
    const teamIds = f1TeamPerformance.map((performance, index) =>
      normalizeObjectId(
        performance?.teamId,
        `f1TeamPerformance[${index}].teamId`
      )
    );

    assertUniqueIds(driverIds, "f1DriversPerformance");
    assertUniqueIds(teamIds, "f1TeamPerformance");

    const [driverDocs, teamDocs] = await Promise.all([
      f1DriverModel
        .find({ _id: { $in: driverIds } })
        .select("_id surname f1TeamId")
        .lean(),
      f1TeamModel.find({ _id: { $in: teamIds } }).select("_id name").lean(),
    ]);

    if (driverDocs.length !== driverIds.length) {
      throw createHttpError(
        400,
        "All race driver references must point to existing drivers"
      );
    }
    if (teamDocs.length !== teamIds.length) {
      throw createHttpError(
        400,
        "All race constructor references must point to existing teams"
      );
    }

    const driverDocsById = new Map(
      driverDocs.map((driverDoc) => [driverDoc._id.toString(), driverDoc])
    );
    const teamDocsById = new Map(
      teamDocs.map((teamDoc) => [teamDoc._id.toString(), teamDoc])
    );
    const driverIdsInRace = new Set(driverIds);

    const normalizedDriverPerformance = f1DriversPerformance.map(
      (performance, index) => {
        const driverDoc = driverDocsById.get(driverIds[index]);
        return {
          driverId: driverDoc._id,
          f1DriverSurname: driverDoc.surname,
          finishPosition: normalizeNumber(
            performance.finishPosition,
            `f1DriversPerformance[${index}].finishPosition`,
            { integer: true, min: 1 }
          ),
          sprintFinishPosition: normalizeNumber(
            performance.sprintFinishPosition ?? 0,
            `f1DriversPerformance[${index}].sprintFinishPosition`,
            { integer: true, min: 0 }
          ),
          qualiPosition: normalizeNumber(
            performance.qualiPosition,
            `f1DriversPerformance[${index}].qualiPosition`,
            { integer: true, min: 1 }
          ),
          fastestLap: normalizeBoolean(
            performance.fastestLap,
            `f1DriversPerformance[${index}].fastestLap`
          ),
          points: normalizeNumber(
            performance.points,
            `f1DriversPerformance[${index}].points`
          ),
          placesFromStartingPosition: normalizeNumber(
            performance.placesFromStartingPosition,
            `f1DriversPerformance[${index}].placesFromStartingPosition`,
            { integer: true }
          ),
        };
      }
    );

    const normalizedTeamPerformance = f1TeamPerformance.map(
      (performance, index) => {
        const teamId = teamIds[index];
        const teamDoc = teamDocsById.get(teamId);

        if (
          !Array.isArray(performance.drivers) ||
          performance.drivers.length === 0
        ) {
          throw createHttpError(
            400,
            `f1TeamPerformance[${index}].drivers must be a non-empty array`
          );
        }

        const teamDriverIds = performance.drivers.map((driver, driverIndex) =>
          normalizeObjectId(
            driver?.driverId,
            `f1TeamPerformance[${index}].drivers[${driverIndex}].driverId`
          )
        );
        assertUniqueIds(
          teamDriverIds,
          `f1TeamPerformance[${index}].drivers`
        );

        const normalizedDrivers = performance.drivers.map((driver, driverIndex) => {
          const driverId = teamDriverIds[driverIndex];
          const driverDoc = driverDocsById.get(driverId);

          if (!driverIdsInRace.has(driverId)) {
            throw createHttpError(
              400,
              `Team performance driver ${driverId} is missing from f1DriversPerformance`
            );
          }
          if (!driverDoc) {
            throw createHttpError(
              400,
              `f1TeamPerformance[${index}].drivers[${driverIndex}].driverId must reference an existing driver`
            );
          }
          if (driverDoc.f1TeamId.toString() !== teamId) {
            throw createHttpError(
              400,
              `Driver ${driverDoc._id.toString()} does not belong to team ${teamId}`
            );
          }

          return {
            driverId: driverDoc._id,
            pointsScored: normalizeNumber(
              driver.pointsScored,
              `f1TeamPerformance[${index}].drivers[${driverIndex}].pointsScored`
            ),
          };
        });

        return {
          teamId: teamDoc._id,
          teamName: teamDoc.name,
          drivers: normalizedDrivers,
          fastestPitStop: normalizeBoolean(
            performance.fastestPitStop,
            `f1TeamPerformance[${index}].fastestPitStop`
          ),
          overallPoints: normalizeNumber(
            performance.overallPoints,
            `f1TeamPerformance[${index}].overallPoints`
          ),
        };
      }
    );

    const race = new f1RaceDataModel({
      roundNumber,
      circuitName,
      f1DriversPerformance: normalizedDriverPerformance,
      f1TeamPerformance: normalizedTeamPerformance,
      safetyCars,
    });

    await race.save();
    res.status(201).json({ message: "Race results saved", raceId: race._id });
  } catch (err) {
    next(err);
  }
};
