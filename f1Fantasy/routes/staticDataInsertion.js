const express = require("express");
const isAuth = require("../middleware/is-auth.js");
const isAdmin = require("../middleware/is-admin.js");
const staticDataInsertionService = require("../services/staticDataInsertion.js");

const router = express.Router();

router.get("/f1-drivers", isAuth, isAdmin, staticDataInsertionService.getF1Drivers);

router.get("/f1-teams", isAuth, isAdmin, staticDataInsertionService.getF1Teams);

router.get("/f1-races", isAuth, isAdmin, staticDataInsertionService.getF1Races);

router.post(
  "/insert-f1-driver-data",
  isAuth,
  isAdmin,
  staticDataInsertionService.insertf1DriverData
);

router.post(
  "/insert-f1-team-data",
  isAuth,
  isAdmin,
  staticDataInsertionService.insertf1TeamData
);
router.post(
  "/insert-f1-race-data",
  isAuth,
  isAdmin,
  staticDataInsertionService.insertf1RaceResults
);

module.exports = router;
