const express = require("express");
const Favorite = require("../models/favorite");

const Campsite = require("../models/campsite");
const authenticate = require("../authenticate");

const favoriteRouter = express.Router();

const cors = require("./cors");

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
    res.sendStatus(200)
  )
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id })
      .populate("user")
      .populate("campsites")
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
      })
      .catch((err) => next(err));
  })
  .post(cors.cors, authenticate.verifyUser, (req, res, next) => {
    console.log(req.body);

    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          req.body.forEach((campsite) => {
            if (!favorite.campsites.includes(campsite._id)) {
              favorite.campsites.push(campsite._id);
            }
          });
          favorite.save();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        } else {
          const campsiteIds = [];
          req.body.forEach((campsite) => {
            campsiteIds.push(campsite._id);
          });
          Favorite.create({
            user: req.user.id,
            campsites: campsiteIds,
          })
            .then((favorite) => {
              favorite.save();
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        }
      })
      .catch((err) => next(err));
  })
  .put(cors.cors, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/plain");
    res.end("PUT request not supported for /favorites");
  })
  .delete(cors.cors, authenticate.verifyUser, (req, res, next) => {
    console.log(req.user);
    Favorite.findOneAndDelete({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        } else {
          res.setHeader("Content-Type", "text/plain");
          res.end("There is no favorite");
        }
      })
      .catch((err) => next(err));
  });

favoriteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/plain");
    res.end(
      `GET request not supported for /favorites/${req.params.campsiteId}`
    );
  })
  .post(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Campsite.find({ _id: req.params.campsiteId })
      .then((campsite) => {
        if (campsite) {
          let campsiteExists = false;

          Favorite.findOne({ user: req.user.id })
            .then((favorite) => {
              if (favorite) {
                favorite.campsites.forEach((campsite) => {
                  if (campsite.equals(req.params.campsiteId)) {
                    campsiteExists = true;
                  }
                });
                if (campsiteExists) {
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "text/plain");
                  res.end("That campsite is already in the list of favorites!");
                } else {
                  favorite.campsites.push(req.params.campsiteId);
                  favorite.save();
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.json(favorite);
                }
              } else {
                Favorite.create({
                  user: req.user.id,
                  campsites: [req.params.campsiteId],
                })
                  .then((favorite) => {
                    favorite.save();
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                  })
                  .catch((err) => next(err));
              }
            })
            .catch((err) => next(err));
        } else {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.end("The campsite Id provided is not valid");
        }
      })
      .catch((err) => next(err));
  })
  .put(cors.cors, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/plain");
    res.end(
      `PUT request not supported for /favorites/${req.params.campsiteId}`
    );
  })
  .delete(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user.id }).then((favorite) => {
      if (favorite) {
        const newCampsitessArray = favorite.campsites.filter(
          (campsite) => campsite.toString() !== req.params.campsiteId
        );
        favorite.campsites = newCampsitessArray;
        favorite.save();
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorite);
      } else {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.end("No favorites to delete");
      }
    });
  });

module.exports = favoriteRouter;
