var express = require("express"); // Express web server framework
var request = require("request");
var axios = require("axios").default;
var cors = require("cors");
var rp = require("request-promise");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");
var open = require("open");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
//const fs = require('fs')
//const log = require('simple-node-logger').createSimpleLogger('project.log');
//const winston = require('winston');

//var logger = require('./path of/log.js');

//var logger = require('./logger')(module);

// node app.js > hmmm.txt

var logger = require("tracer").colorConsole();
//var access = fs.createWriteStream('./hmmm.txt');
//process.stdout.write = process.stderr.write = access.write.bind(access);

/*const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: {},
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'combined.log'
    }),
  ],
});*/

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
/*if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}*/

const password = encodeURIComponent(process.env.password)
logger.info(password)
const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://mazeofith:" +
  password +
  "@radionewify.g7mq1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
var db = null;
client.connect(err => {
  logger.info(err);
  db = client.db("playlistdata").collection("playlistdata");
  //logger.info(db)
  //logger.info("collection")
});

var client_id =  process.env.client_id
var client_secret = process.env.client_secret
var redirect_uri = "https://development-radionewify.glitch.me/";

var generateRandomString = function(length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var schedule = require("node-schedule");
var j = schedule.scheduleJob("30 */2 * * *", function() {
  logger.info("schedule!");
  try {
    db.find({
      userid: {
        $exists: true
      }
    }).toArray(function(err, doc) {
      logger.info(err);
      var currentdocs = [];
      var dociter = 0;
      for (var i = 0; i < doc.length; i++) {
        if (doc[i].dicttocheck) {
          currentdocs.push(doc[i]);
        }
        logger.info(doc[i].userid);
      }
      //logger.info(currentdocs)
      var authOptions = {
        url: "https://accounts.spotify.com/api/token",
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: doc[0].refresh_token
        }),
        headers: JSON.stringify({
          Authorization:
            "Basic " +
            new Buffer.from(client_id + ":" + client_secret).toString("base64"),
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded"
        })
      };

      function getRecent(currentdoc) {
        dociter += 1;
        try {
          var authOptions = {
            url: "https://accounts.spotify.com/api/token",
            form: {
              grant_type: "refresh_token",
              refresh_token: currentdoc.refresh_token
            },
            headers: {
              Authorization:
                "Basic " +
                new Buffer.from(client_id + ":" + client_secret).toString(
                  "base64"
                )
            },
            json: true
          };
          //logger.info(currentdoc.refresh_token);
          //logger.info(currentdoc.access_token);
          request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {
              var access_token = body.access_token;
              //logger.info(access_token);
              var options = {
                url: "https://api.spotify.com/v1/me",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + access_token
                },
                json: true
              };
              options.url =
                "https://api.spotify.com/v1/me/player/recently-played?limit=50";
              var dicttocheck = currentdoc.dicttocheck;
              request.get(options, function(error, response, body) {
                for (var j = 0; j < body.items.length; j++) {
                  dicttocheck[body.items[j].track.name] = [
                    body.items[j].track.artists[0].name
                  ];
                  //logger.info(body.items[j].track.uri)
                  //logger.info(body.items[j].track.name)
                  //logger.info(body.items[j].track.artists[0].name)
                  if (j == body.items.length - 1) {
                    db.updateOne(
                      {
                        userid: currentdoc.userid
                      },
                      {
                        $set: {
                          dicttocheck: dicttocheck
                        }
                      },
                      {},
                      function() {
                        try {
                          logger.info(
                            Object.keys(currentdoc.dicttocheck).length
                          );
                        } catch (error) {
                          logger.info("no dicttocheck");
                        }
                        if (dociter < currentdocs.length) {
                          getRecent(currentdocs[dociter]);
                        }
                      }
                    );
                  }
                }
              });
              logger.info("Found user:", currentdoc.userid);
            } else {
              logger.info(error);
              getRecent(currentdocs[dociter]);
            }
          });
        } catch (error) {
          logger.info(error);
          logger.info("currentuser was shit");
          if (dociter < currentdocs.length) {
            getRecent(currentdocs[dociter]);
          }
        }
      }
      getRecent(currentdocs[dociter]);
    });
  } catch (error) {
    logger.info(error);
  }
});

const NodeCache = require("node-cache");
const myCache = new NodeCache();

var stateKey = "spotify_auth_state";

var app = express();

app
  .use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser());

app.use(
  fileUpload({
    createParentPath: true
  })
);
app.use(
  bodyParser.json({
    limit: "50mb"
  })
);
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 1000000
  })
);

const http = require("http");

const server = http.createServer(app);

server.listen(3000, () => {
  logger.info("listening on 3000");
});

var parameterdict = {};

/*var passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;

passport.use(
  new SpotifyStrategy({
      clientID: client_id,
      clientSecret: client_secret,
      callbackURL: redirect_uri
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
      User.findOrCreate({
        spotifyId: profile.id
      }, function(err, user) {
        return done(err, user);
      });
    }
  )
);

app.get('/auth/spotify', passport.authenticate('spotify'));

app.get(
  '/auth/spotify/callback',
  passport.authenticate('spotify', {
    failureRedirect: '/login',
    scope: ["user-read-private", "user-top-read", "playlist-modify-public", "user-modify-playback-state", "playlist-read-collaborative", "user-library-read", "user-read-recently-played", "playlist-read-private", "user-read-currently-playing"]
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);*/

app.get("/login", function(req, res) {
  state = generateRandomString(16);
  res.cookie(stateKey, state);
  //logger.info("cookie: ", res.cookie(stateKey, state))
  var i = req.url.indexOf("?");
  parameters = req.query; //.substr(i + 1);
  parameterurl = req.url.substr(i + 1);
  parameters["parameterurl"] = parameterurl;
  //logger.info(parameters)
  logger.info(parameterurl);
  currentusercsv = req.query.currentusercsv;
  parameterdict[currentusercsv] = parameters;
  //logger.info(parameterdict)
  if (parameterurl.includes("generatesong")) {
    redirect_uri = "https://development-radionewify.glitch.me/?generatesong";
  } else if (parameterurl.includes("generateartist")) {
    redirect_uri = "https://development-radionewify.glitch.me/?generateartist";
    artist = true;
  } else if (parameterurl.includes("generateplaylist")) {
    redirect_uri =
      "https://development-radionewify.glitch.me/?generateplaylist";
    artist = true;
  } else if (parameterurl.includes("generategenre")) {
    redirect_uri = "https://development-radionewify.glitch.me/?generategenre";
  } else if (parameterurl.includes("generatepersonal")) {
    redirect_uri =
      "https://development-radionewify.glitch.me/?generatepersonal";
  } else if (parameterurl.includes("generate6months")) {
    redirect_uri = "https://development-radionewify.glitch.me/?generate6months";
  } else if (parameterurl.includes("generatealltime")) {
    redirect_uri = "https://development-radionewify.glitch.me/?generatealltime";
  } 
  logger.info(redirect_uri);
  var scope =
    "user-read-private user-top-read playlist-modify-public user-modify-playback-state playlist-read-collaborative user-library-read user-read-recently-played playlist-read-private user-read-currently-playing";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      })
  );
});

app.get("/callback", function(req, res) {
  logger.info(req.query);
  async function main() {
    try {
      function defineVariables() {
        logger.info("parameterdict: ", parameterdict);
        var parametercurrentdict = JSON.parse(
          JSON.stringify(parameterdict[req.query.currentusercsv])
        );
        logger.info("parametercurrentdict: ", parametercurrentdict);
        var seedgenres = parametercurrentdict.seed_genres || null;
        var currentusercsv = parametercurrentdict.currentusercsv;
        var appbrowser = parametercurrentdict.appbrowser;
        var autoplay = parametercurrentdict.autoplay;
        var typeofpersonal = parametercurrentdict.typeofpersonal;
        logger.info(
          "seedgenres: ",
          seedgenres,
          "currentusercsv: ",
          currentusercsv,
          "appbrowser: ",
          appbrowser,
          "autoplay: ",
          autoplay,
          "typeofpersonal: ",
          typeofpersonal
        );
        return [
          parametercurrentdict,
          seedgenres,
          currentusercsv,
          appbrowser,
          autoplay,
          typeofpersonal
        ];
      }
      var [
        parametercurrentdict,
        seedgenres,
        currentusercsv,
        appbrowser,
        autoplay,
        typeofpersonal
      ] = defineVariables();
      //logger.info("hi", parametercurrentdict, seedgenres, currentusercsv, appbrowser, autoplay, typeofpersonal)
      var founduser = false;
      var createdplaylists = [];

      var parameters = parametercurrentdict.parameterurl;
      logger.info(parameters);

      function defineType() {
        var artist, personal, playlist;
        if (parameters.includes("artist")) {
          artist = true;
        } else if (parameters.includes("personal")) {
          personal = true;
        } else if (parameters.includes("playlist")) {
          playlist = true;
        }
        return [artist, personal, playlist];
      }

      function rewriteParameters() {
        var toreplace = [
          /&currentusercsv=\d+/,
          "&appbrowser=app",
          "&appbrowser=browser",
          "&autoplay=autoplayon",
          "&autoplay=autoplayoff",
          "&typeofpersonal=month",
          "&typeofpersonal=6months",
          "&typeofpersonal=alltime",
          "&generatesong=0",
          "&generateplaylist=0",
          "&generateartist=0",
          "&generatepersonal=0",
          "&generategenre=0"
        ];
        for (var i = 0; i < toreplace.length; i++) {
          parameters = parameters.replace(toreplace[i], "");
        }
        logger.info(parameters);
        return parameters;
      }
      var [artist, personal, playlist] = defineType();

      parameters = rewriteParameters();

      logger.info(
        "artist: ",
        artist,
        "personal:",
        personal,
        "playlist:",
        playlist
      );
      console.time("callback");

      async function getUserID() {
        var code = req.query.code || null;
        var state = req.query.state || null;
        var storedState = req.cookies ? req.cookies[stateKey] : null;
        logger.info(code, state, storedState);
        if (state === null || state !== storedState) {
          res.redirect(
            "/#" +
              querystring.stringify({
                error: "state_mismatch"
              })
          );
        } else {
          res.clearCookie(stateKey);
          var authOptions = {
            url: "https://accounts.spotify.com/api/token",
            form: {
              code: code,
              redirect_uri: redirect_uri,
              grant_type: "authorization_code"
            },
            headers: {
              Authorization:
                "Basic " +
                new Buffer.from(client_id + ":" + client_secret).toString(
                  "base64"
                )
            },
            json: true
          };

          return new Promise(function(resolve, reject) {
            request.post(authOptions, function(error, response, body) {
              var access_token = body.access_token;
              var refresh_token = body.refresh_token;
              var options = {
                url: "https://api.spotify.com/v1/me",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + access_token
                },
                json: true
              };

              request.get(options, function(error, response, body) {
                var userid = body.id;
                var country = body.country;
                logger.info("userid: ", userid);
                resolve([
                  userid,
                  country,
                  access_token,
                  refresh_token,
                  options
                ]);
              });
            });
          });
        }
      }
      //logger.info("options: ", options)
      var [
        userid,
        country,
        access_token,
        refresh_token,
        options
      ] = await getUserID();
      //logger.info("hey!", userid, country, access_token, refresh_token)

      async function createInitialPlaylist() {
        var authOptions1 = {
          url: "https://api.spotify.com/v1/users/" + userid + "/playlists",
          body: JSON.stringify({
            name: "Radionewify",
            public: true
          }),
          dataType: "json",
          headers: {
            Authorization: "Bearer " + access_token,
            "Content-Type": "application/json"
          }
        };
        return new Promise(function(resolve, reject) {
          request.post(authOptions1, function(error, response, body) {
            try {
              var playlistid = JSON.parse(body).id;
              var toopen = JSON.parse(body).external_urls.spotify;
              logger.info(toopen);
              resolve([playlistid, toopen]);
            } catch (error) {
              logger.info(error);
              resolve([null, null]);
            }
          });
        });
      }

      var [playlistid, toopen] = await createInitialPlaylist();
      logger.info("playlistid: ", playlistid, "toopen: ", toopen);

      async function tryToFindUser() {
        return new Promise(function(resolve, reject) {
          var somethingtoawaithmm = db.findOne(
            {
              userid: userid
            },
            function(err, doc) {
              try {
                logger.info("Found user:", doc.userid);
                var founduser = true;
                dicttocheck = doc.dicttocheck;
                var createdplaylists = [];
                try {
                  createdplaylists = doc.createdplaylists;
                  logger.info(createdplaylists);
                } catch (error) {
                  logger.info("no createdplaylists");
                }
                logger.info("dicttocheck: ", Object.keys(dicttocheck).length);
              } catch (error) {
                //logger.info(error);
                logger.info("Couldn't find user");
                var createdplaylists = [];
              }
              resolve([founduser, createdplaylists]);
            }
          );
        });
      }

      function personalFunc() {
        if (typeofpersonal == "month") {
          options.url =
            "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5";
        } else if (typeofpersonal == "6months") {
          options.url =
            "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=5";
        } else if (typeofpersonal == "alltime") {
          options.url =
            "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5";
        }

        return new Promise(function(resolve, reject) {
          request.get(options, function(error, response, body) {
            var personalids = "";
            personaldescription = "Based on ";
            for (var i = 0; i < body.items.length; i++) {
              personalids += body.items[i].id + ",";
              if (i == body.items.length - 2) {
                personaldescription +=
                  '"' +
                  body.items[i].name +
                  '"' +
                  " by " +
                  body.items[i].artists[0].name +
                  ", and ";
              } else if (i == body.items.length - 1) {
                personaldescription +=
                  '"' +
                  body.items[i].name +
                  '"' +
                  " by " +
                  body.items[i].artists[0].name +
                  ". ";
              } else {
                personaldescription +=
                  '"' +
                  body.items[i].name +
                  '"' +
                  " by " +
                  body.items[i].artists[0].name +
                  ", ";
              }
            }
            personalids.substring(0, personalids.length - 1);
            logger.info("personalids: ", personalids);
            resolve(personalids);
          });
        });
      }

      async function getCurrent() {
        return new Promise(function(resolve, reject) {
          options.url =
            "https://api.spotify.com/v1/me/player/currently-playing";
          request.get(options, function(error, response, body) {
            try {
              logger.info(body.item.uri);
              var currentlyplayingtrackname = body.item.name;
              var currentid = body.item.id;
              //logger.info("artist: ", artist);
              //logger.info(body.item.album);
              var artistid = body.item.album.artists[0].id;
              var currentlyplayingartistname = body.item.album.artists[0].name;
              if (currentlyplayingartistname == "Various Artists") {
                try {
                  logger.info("Various Artists");
                  artistid = body.item.artists[0].id;
                  currentlyplayingartistname = body.item.artists[0].name;
                  if (currentlyplayingartistname == "Various Artists") {
                    try {
                      logger.info("Various Artists");
                      artistid = body.item.artists[1].id;
                      currentlyplayingartistname = body.item.artists[1].name;
                    } catch (error) {
                      logger.info("hmm various");
                      logger.info(error);
                    }
                  }
                } catch (error) {
                  logger.info("no additional artists");
                  logger.info(error);
                }
              }
              logger.info(currentlyplayingartistname);
              //var albumid = body.item.album.id;
              //var currentlyplayingalbumname = body.item.album.name;
              resolve([
                currentid,
                currentlyplayingtrackname,
                artistid,
                currentlyplayingartistname
              ]);
            } catch (error) {
              options.url =
                "https://api.spotify.com/v1/me/player/recently-played?limit=1";
              request.get(options, function(error, response, body) {
                try {
                  var currentlyplayingtrackname = body.items[0].track.name;
                  var currentid = body.items[0].track.id;
                  var artistid = body.items[0].track.album.artists[0].id;
                  var currentlyplayingartistname =
                    body.items[0].track.album.artists[0].name;
                  if (currentlyplayingartistname == "Various Artists") {
                    try {
                      logger.info("Various Artists");
                      artistid = body.items[0].artists[0].id;
                      currentlyplayingartistname =
                        body.items[0].artists[0].name;
                      if (currentlyplayingartistname == "Various Artists") {
                        try {
                          logger.info("Various Artists");
                          artistid = body.items[0].artists[1].id;
                          currentlyplayingartistname =
                            body.items[0].artists[1].name;
                        } catch (error) {
                          logger.info("hmm various");
                          logger.info(error);
                        }
                      }
                    } catch (error) {
                      logger.info("no additional artists");
                      logger.info(error);
                    }
                  }
                  resolve([
                    currentid,
                    currentlyplayingtrackname,
                    artistid,
                    currentlyplayingartistname
                  ]);
                } catch (error) {
                  logger.info("recent error");
                  resolve();
                }
              });
            }
          });
        });
      }

      async function playlistRecommendations() {
        var playlistids = [];
        var playplaylistid;
        var playlistname;

        function addToPlaylistIds(body) {
          for (var i = 0; i < 5; i++) {
            try {
              var j = Math.floor(Math.random() * body.items.length);
              if (
                !body.items[j].is_local &&
                body.items[j].track.name &&
                body.items[j].track.artists[0] &&
                body.items[j].track.available_markets &&
                body.items[j].track.name !== "null" &&
                body.items[j].track.name.slice(0, 1) !== "$"
              ) {
                if (i == 5) {
                  playlistids.push(
                    body.items[j].track.uri.replace("spotify:track:", "") + ","
                  );
                } else {
                  playlistids.push(
                    body.items[j].track.uri.replace("spotify:track:", "")
                  );
                }
              }
            } catch (error) {
              logger.info("small playlist recommendation error");
            }
          }
          logger.info(playlistids);
          return playlistids;
        }

        async function determineName(playlisthref) {
          return new Promise(function(resolve, reject) {
            var playplaylistid = playlisthref.replace(
              "https://api.spotify.com/v1/playlists/",
              ""
            );
            logger.info(playlisthref);
            options.url = playlisthref + "/tracks";
            request.get(options, function(error, response, body) {
              logger.info(error);
              //logger.info(body)
              var playlistids = addToPlaylistIds(body);
              options.url =
                "https://api.spotify.com/v1/playlists/" + playplaylistid;
              logger.info(playplaylistid);

              if (playlistids.length > 0) {
                request.get(options, function(error, response, body) {
                  logger.info(error);
                  //logger.info(body)
                  var playlistname = body.name;
                  if (playlistname.includes("Radionewify")) {
                    personaldescription += "Inception. ";
                  }
                  resolve([playlistids, playlistname]);
                });
              } else {
                resolve([playlistids, null]);
              }
            });
          });
        }

        return new Promise(function(resolve, reject) {
          try {
            options.url =
              "https://api.spotify.com/v1/me/player/currently-playing";
            request.get(options, async function(error, response, body) {
              try {
                var playlisthref = body.context.href;
                if (playlisthref.includes("playlist")) {
                  [playlistids, playlistname] = await determineName(
                    playlisthref
                  );
                }
                if (playlistids.length > 0) {
                  resolve([playlistids, playlistname]);
                } else {
                  options.url =
                    "https://api.spotify.com/v1/me/player/recently-played?limit=50";
                  request.get(options, async function(error, response, body) {
                    logger.info("in recently played playlist");
                    for (var i = 0; i < body.items.length; i++) {
                      try {
                        var playlisthref = body.items[i].context.href;
                        if (playlisthref.includes("playlist")) {
                          [playlistids, playlistname] = await determineName(
                            playlisthref
                          );
                        }
                      } catch (error) {
                        logger.info(error);
                      }
                      if (playlistids.length > 0) {
                        i = 100;
                        resolve([playlistids, playlistname]);
                      }
                    }
                    if (playlistids.length <= 0) {
                      res.send("playlisterror");
                      unfollow();
                    }
                  });
                }
              } catch (error) {
                logger.info(error);
                res.send("playlisterror");
                personaldescription +=
                  "Error: Your most recent track wasn't played from a playlist. ";
                resolve([playlistids, playlistname]);
              }
            });
          } catch (error) {
            res.send("playlisterror");
            logger.info(error);
          }
        });
      }

      var personaldescription = "";
      if (personal) {
        personalids = await personalFunc();
        logger.info(personalids);
      } else if (playlist) {
        [playlistids, playlistname] = await playlistRecommendations();
        logger.info(playlistids);
      } else {
        [
          currentid,
          currentlyplayingtrackname,
          artistid,
          currentlyplayingartistname
        ] = await getCurrent();
      }
      logger.info("personaldescription: ", personaldescription);

      function getRecommendations() {
        if (parameters.includes("seed_genres")) {
          options.url =
            "https://api.spotify.com/v1/recommendations?limit=100&market=" +
            country +
            "&" +
            parameters;
        } else if (playlist) {
          options.url =
            "https://api.spotify.com/v1/recommendations?limit=100&market=" +
            country +
            "&" +
            parameters +
            "&seed_tracks=" +
            playlistids;
        } else if (personal) {
          options.url =
            "https://api.spotify.com/v1/recommendations?limit=100&market=" +
            country +
            "&" +
            parameters +
            "&seed_tracks=" +
            personalids;
        } else if (!artist) {
          options.url =
            "https://api.spotify.com/v1/recommendations?limit=100&market=" +
            country +
            "&" +
            parameters +
            "&seed_tracks=" +
            currentid;
        } else if (artist) {
          parameters = parameters.replace(
            "max_popularity=60",
            "max_popularity=70"
          );
          options.url =
            "https://api.spotify.com/v1/recommendations?limit=100&market=" +
            country +
            "&" +
            parameters +
            "&seed_artists=" +
            artistid;
        }
        return options.url;
      }
      options.url = getRecommendations();
      logger.info("options.url: ", options.url);

      async function getURITracks() {
        console.time("recommendations");
        return new Promise(function(resolve, reject) {
          request.get(options, function(error, response, body) {
            console.timeEnd("recommendations");
            var uritracks = [];
            var uritracknameartist = {};
            try {
              for (var i = 0; i < body.tracks.length; i++) {
                uritracks.push(body.tracks[i].uri);
                uritracknameartist[body.tracks[i].uri] = [
                  body.tracks[i].name,
                  body.tracks[i].artists[0].name
                ];
              }
              resolve([uritracks, uritracknameartist]);
            } catch (error) {
              resolve([uritracks, uritracknameartist]);
            }
          });
        });
      }

      var [uritracks, uritracknameartist] = await getURITracks();

      function getRecentPopular() {
        return new Promise(function(resolve, reject) {
          options.url =
            "https://api.spotify.com/v1/me/player/recently-played?limit=50";
          request.get(options, function(error, response, body) {
            logger.info(error);
            for (var i = 0; i < body.items.length; i++) {
              if (
                body.items[i].track.name !== "null" &&
                body.items[i].track.name.slice(0, 1) !== "$" &&
                body.items[i].track.name
              ) {
                dicttocheck[body.items[i].track.name] =
                  body.items[i].track.artists[0].name;
              }
            }
            options.url =
              "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50";
            request.get(options, function(error, response, body) {
              logger.info(error);
              for (var i = 0; i < body.items.length; i++) {
                if (
                  body.items[i].name !== "null" &&
                  body.items[i].name.slice(0, 1) !== "$" &&
                  body.items[i].name
                ) {
                  dicttocheck[body.items[i].name] =
                    body.items[i].artists[0].name;
                }
              }
              options.url =
                "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50";
              request.get(options, function(error, response, body) {
                for (var i = 0; i < body.items.length; i++) {
                  if (
                    body.items[i].name !== "null" &&
                    body.items[i].name.slice(0, 1) !== "$" &&
                    body.items[i].name
                  ) {
                    dicttocheck[body.items[i].name] =
                      body.items[i].artists[0].name;
                  }
                }
                options.url =
                  "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50";
                request.get(options, function(error, response, body) {
                  for (var i = 0; i < body.items.length; i++) {
                    if (
                      body.items[i].name !== "null" &&
                      body.items[i].name.slice(0, 1) !== "$" &&
                      body.items[i].name
                    ) {
                      dicttocheck[body.items[i].name] =
                        body.items[i].artists[0].name;
                    }
                  }
                  setTimeout(function() {
                    resolve();
                  }, 1000);
                });
              });
            });
          });
        });
      }

      function createNewUser() {
        logger.info("userid: ", userid);

        logger.info("next");
        if (
          personaldescription.includes(
            "Error: Your most recent track wasn't played from a playlist."
          )
        ) {
          logger.info("Ignore creation bc playlist error");
        } else {
          personaldescription +=
            "All your playlist tracks haven't been extracted yet (can take a couple of minutes). If you want the radio with those tracks removed, just generate it again.";

          return new Promise(function(resolve, reject) {
            logger.info("currentusercsv before insert: ", currentusercsv);
            var usertrackstoinsert = {
              userid: userid,
              dicttocheck: dicttocheck,
              access_token: access_token,
              refresh_token: refresh_token,
              currentusercsv: currentusercsv,
              createdplaylists: []
            };

            db.insertOne(usertrackstoinsert, function(err, doc) {
              resolve();
            });
          });
        }
      }

      function determineAuthname() {
        var authname;

        function capitalizeFirstLetter(string) {
          return (string.charAt(0).toUpperCase() + string.slice(1)).replace(
            "-",
            " "
          );
        }
        if (parameters.includes("seed_genres")) {
          authname = capitalizeFirstLetter(seedgenres);
        } else if (personal) {
          if (typeofpersonal == "6months") {
            authname = "Personal 6 Months";
          } else if (typeofpersonal == "alltime") {
            authname = "Personal All Time";
          } else if (typeofpersonal == "month") {
            authname = "Personal " + capitalizeFirstLetter(typeofpersonal);
          }
        } else if (playlist) {
          authname = playlistname;
        } else if (!artist) {
          authname = currentlyplayingtrackname;
          personaldescription += "Artist: " + currentlyplayingartistname + ". ";
        } else if (artist) {
          authname = currentlyplayingartistname;
        }
        //authname += " " + Math.random().toString(36).substr(2, 5); //Math.floor(Math.random()*1000)
        //authname = "girwefewwerberberbewefggrekjngrkj"
        var basenames = [];
        if (createdplaylists) {
          for (var i = 0; i < createdplaylists.length; i++) {
            if (createdplaylists[i].slice(-2, -1).match(/^-?\d+$/)) {
              if (basenames.includes(createdplaylists[i].slice(0, -4))) {
                basenames[basenames.indexOf(createdplaylists[i].slice(0, -4))] =
                  "previous copy";
              }
              basenames.push(createdplaylists[i].slice(0, -4));
            } else {
              basenames.push(createdplaylists[i]);
            }
          }
        }
        logger.info(basenames);
        if (basenames.includes(authname)) {
          var authnumber = parseInt(
            createdplaylists[basenames.indexOf(authname)].slice(-2, -1)
          );
          if (authnumber) {
            authname += " (" + (authnumber + 1) + ")";
          } else {
            authname += " (" + 2 + ")";
          }
        }
        logger.info("authname: ", authname);
        return authname;
      }

      var dicttocheck = {};
      var [founduser, createdplaylists] = await tryToFindUser();
      var authname = determineAuthname();
      //logger.info(founduser, Object.keys(dicttocheck).length)
      if (!founduser) {
        await getRecentPopular();
        logger.info(
          "dicttocheck initial length: ",
          Object.keys(dicttocheck).length
        );
        await createNewUser();
      }

      async function changePlaylistName() {
        var authOptions1 = {
          url: "https://api.spotify.com/v1/playlists/" + playlistid,
          body: JSON.stringify({
            name: authname + " | Radionewify",
            public: true
          }),
          dataType: "json",
          headers: {
            Authorization: "Bearer " + access_token,
            "Content-Type": "application/json"
          }
        };
        if (personaldescription) {
          var authOptions1 = {
            url: "https://api.spotify.com/v1/playlists/" + playlistid,
            body: JSON.stringify({
              name: authname + " | Radionewify",
              description: personaldescription,
              public: true
            }),
            dataType: "json",
            headers: {
              Authorization: "Bearer " + access_token,
              "Content-Type": "application/json"
            }
          };
        }
        //logger.info(authOptions1)
        return new Promise(function(resolve, reject) {
          request.put(authOptions1, function(error, response, body) {
            logger.info("changing playlist name!");
            logger.info(body);
            resolve();
          });
        });
      }

      function sortUriTracks() {
        try {
          uritracks = uritracks.filter(function(a) {
            if (
              !(
                dicttocheck[uritracknameartist[a][0]] &&
                dicttocheck[uritracknameartist[a][0]] ==
                  uritracknameartist[a][1]
              )
            ) {
              //logger.info(a)
              return a;
            } else {
              logger.info(uritracknameartist[a]);
            }
          });
          logger.info("uritracks after normal sort length: ", uritracks.length);
        } catch (error) {
          logger.info(error);
        }
      }
      sortUriTracks();

      async function sortUriLiked() {
        idtracks = "";
        likedlength = 50;
        logger.info("inliked");
        if (uritracks.length < 50) {
          likedlength = uritracks.length;
        }
        logger.info("likedlength: ", likedlength);
        for (var i = 0; i < likedlength; i++) {
          if (i == likedlength - 1) {
            idtracks += uritracks[i].replace("spotify:track:", "");
          } else {
            idtracks += uritracks[i].replace("spotify:track:", "") + ",";
          }
        }
        options.url = "https://api.spotify.com/v1/me/tracks/contains?ids=".concat(
          idtracks
        );
        logger.info("liked options: ", options.url);
        return new Promise(function(resolve, reject) {
          request.get(options, function(error, response, body) {
            //logger.info(error)
            //logger.info(body)
            var uriiter = 0;
            uritracks = uritracks.filter(function(a) {
              if (!body[uriiter]) {
                //logger.info(uriiter, a, body[uriiter])
                uriiter += 1;
                return a;
              } else {
                logger.info(uriiter, "found a liked track: ", a);
                uriiter += 1;
              }
            });
            if (uritracks.length > 50) {
              idtracks = "";
              likedlength = 100;
              if (uritracks.length < 100) {
                likedlength = uritracks.length;
              }
              logger.info("likedlength 2: ", likedlength);
              for (var i = 50; i < likedlength; i++) {
                if (i == likedlength - 1) {
                  idtracks += uritracks[i].replace("spotify:track:", "");
                } else {
                  idtracks += uritracks[i].replace("spotify:track:", "") + ",";
                }
              }
              options.url = "https://api.spotify.com/v1/me/tracks/contains?ids=".concat(
                idtracks
              );
              logger.info("options 2: ", options.url);
              request.get(options, function(error, response, body) {
                //logger.info(error)
                //logger.info(body)
                var uriiter = 0;
                uritracks = uritracks.filter(function(a) {
                  if (uriiter > 49) {
                    if (!body[uriiter - 50]) {
                      //logger.info(uriiter, a, body[uriiter - 50])
                      uriiter += 1;
                      return a;
                    } else {
                      uriiter += 1;
                      logger.info(uriiter, "found a liked track: ", a);
                    }
                  } else {
                    uriiter += 1;
                    return a;
                  }
                });
                resolve();
              });
            } else {
              resolve();
            }
          });
        });
      }

      await sortUriLiked();

      async function ifLessThan50() {
        // get uritracks
        return new Promise(function(resolve, reject) {
          logger.info(uritracks.length);
          options.url =
            "https://api.spotify.com/v1/recommendations?limit=100&market=" +
            country +
            "&" +
            parameters +
            "&seed_tracks=" +
            uritracks[0].replace("spotify:track:", "");
          logger.info(options.url);
          request.get(options, function(error, response, body) {
            try {
              //logger.info(body)
              for (var i = 0; i < body.tracks.length; i++) {
                uritracks.push(body.tracks[i].uri);
                uritracknameartist[body.tracks[i].uri] = [
                  body.tracks[i].name,
                  body.tracks[i].artists[0].name
                ];
              }
              sortUriTracks();
              logger.info(uritracks.length);
              try {
                uritracks = uritracks.filter(function(item, pos) {
                  return uritracks.indexOf(item) == pos;
                });
                logger.info("after unique:", uritracks.length);
                uritracks = uritracks.slice(0, 100);
                setTimeout(function() {
                  resolve();
                }, 2500); //2000*/
              } catch (error) {
                resolve();
                logger.info("error again");
              }
            } catch (error) {
              logger.info(error);
              resolve();
            }
          });
        });
      }

      async function populatePlaylist() {
        options.url =
          "https://api.spotify.com/v1/playlists/" +
          playlistid +
          "/tracks?uris=" +
          uritracks;
        logger.info(uritracks.length);
        return new Promise(function(resolve, reject) {
          request.post(options, function(error, response, body) {
            var toedit = "nothing";
            try {
              console.timeEnd("callback");
            } catch (error) {
              logger.info("no callback");
            }
            open("https://open.spotify.com/playlist/" + playlistid);
            /*var options = {
              method: 'GET',
              url: "http://api.scraperapi.com?api_key=bb44097292137568bf5b686c1e8d73dc&url=".concat("https://open.spotify.com/playlist/" + playlistid)
            };

            axios.request(options).then(function(response) {
              logger.info("successful scraperapi");
            }).catch(function(error) {
              logger.info("error");
            });*/
            options.url = "https://api.spotify.com/v1/playlists/" + playlistid;
            request.get(options, function(error, response, body) {});

            if (
              parameters.includes("genres") ||
              artist ||
              personal ||
              lessthan
            ) {
              logger.info("longwait");
              setTimeout(function() {
                resolve();
              }, 0); //5000
            } else {
              setTimeout(function() {
                resolve();
              }, 0); //3000
            }
          });
        });
      }

      function unfollow() {
        options.url =
          "https://api.spotify.com/v1/playlists/" + playlistid + "/followers";
        logger.info("in unfollow");
        return new Promise(function(resolve, reject) {
          request.delete(options, function(error, response, body) {
            logger.info("unfollow: ", error);
            logger.info("unfollow: ", body);
            setTimeout(function() {
              resolve();
            }, 1000); //7000
          });
        });
      }

      function deleteTrack() {
        setTimeout(function() {
          return new Promise(function(resolve, reject) {
            //logger.info(options)
            var deleteoptions = JSON.parse(JSON.stringify(options));
            deleteoptions.url =
              "https://api.spotify.com/v1/playlists/" + playlistid + "/tracks";
            deleteoptions.body = {
              tracks: [
                {
                  uri: uritracks.slice(-1)[0],
                  positions: [uritracks.length - 1]
                }
              ]
            };
            //logger.info(options)
            logger.info(uritracks.slice(-1)[0]);
            return new Promise(function(resolve, reject) {
              request.delete(deleteoptions, function(error, response, body) {
                logger.info(error);
                logger.info(body);
                resolve();
              });
            });
          });
        }, 1500);
      }

      /*function deleteTrack2() {
        setTimeout(function() {
          options.url =
            "https://api.spotify.com/v1/playlists/" + playlistid + "/tracks";
          options.body = {
            tracks: [
              {
                uri: uritracks.slice(-2)[0],
                positions: [uritracks.length - 3]
              }
            ]
          };
          logger.info(uritracks.slice(-2)[0]);
          return new Promise(function(resolve, reject) {
            request.delete(options, function(error, response, body) {
              logger.info(error);
              logger.info(body);
              resolve();
            });
          });
        }, 3000);
      }*/

      var lessthan = false;
      if (uritracks.length < 50) {
        await ifLessThan50();
        var lessthan = true;
        await sortUriLiked(); //this could "slow" it down (?)
      }

      await changePlaylistName();
      await populatePlaylist();
      await autoPlay();
      await sendLink();
      db.updateOne(
        {
          userid: userid
        },
        {
          $push: {
            createdplaylists: authname
          }
        },
        {},
        function() {
          logger.info("userid: ", userid);
          logger.info("temporary done");
        }
      );
      logger.info(options);
      await deleteTrack();
      /*setTimeout(async function() {
              await follow();
        await unfollow();
             await unfollow();
                setTimeout(async function() {
      await follow();
      }, 5000);
      }, 5000);*/
      setTimeout(async function() {
        follow();
      }, 5000);

      async function autoPlay() {
        /*options.url = "https://api.spotify.com/v1/playlists" + playlistid + "/followers"
        request.put(options, function(error, response, body) {*/
        return new Promise(function(resolve, reject) {
          if (autoplay == "autoplayon") {
            options.url =
              "https://api.spotify.com/v1/me/player/shuffle?state=false";
            request.put(options, function(error, response, body) {
              var authOptions2 = {
                url: "https://api.spotify.com/v1/me/player/play",
                body: JSON.stringify({
                  context_uri: "spotify:playlist:" + playlistid
                }),
                dataType: "json",
                headers: {
                  Authorization: "Bearer " + access_token,
                  "Content-Type": "application/json"
                }
              };
              request.put(authOptions2, function(error, response, body) {
                resolve();
              });
            });
          } else {
            resolve();
          }
        });
      }

      async function sendLink() {
        return new Promise(function(resolve, reject) {
          if (appbrowser == "browser") {
            res.send({toopen: toopen, userid: userid});
          } else {
            logger.info("spotify:user:" + userid + ":playlist:" + playlistid);
            res.send({toopen: "spotify:user:" + userid + ":playlist:" + playlistid,userid: userid} );
          }
          setTimeout(function() {
            resolve();
          }, 0); //7000
        });
      }

      function follow() {
        logger.info("in follow");
        options.url =
          "https://api.spotify.com/v1/playlists/" + playlistid + "/followers";
        return new Promise(function(resolve, reject) {
          request.put(options, function(error, response, body) {
            logger.info("follow: ", error);
            logger.info(body);
            resolve();
          });
        });
      }

      function getAllRest(next = false) {
        if (!next) {
          getallrestiter += 1;
        }
        totalrestiter += 1;
        logger.info(options.url);

        //getallrestiter += 1
        //logger.info(options.url);

        request.get(options, function(error, response, body) {
          //logger.info(error);
          //logger.info(body);
          //logger.info("in request")
          function update() {
            db.updateOne(
              {
                userid: userid
              },
              {
                $set: {
                  dicttocheck: dicttocheck
                }
              },
              {},
              function() {
                logger.info("userid: ", userid);
                logger.info("temporary done");
              }
            );
          }
          try {
            for (var i = 0; i < body.items.length; i++) {
              try {
                if (
                  !body.items[i].is_local &&
                  body.items[i].track.name &&
                  body.items[i].track.artists[0] &&
                  body.items[i].track.available_markets &&
                  body.items[i].track.name !== "null" &&
                  body.items[i].track.name.slice(0, 1) !== "$"
                ) {
                  dicttocheck[body.items[i].track.name] =
                    body.items[i].track.artists[0].name;
                  //logger.info(body.items[i].track.name, body.items[i].track.artists[0].name)
                }
              } catch (error) {
                //logger.info(error)
                logger.info("small playlist error");
              }
            }
            if (body.next && totalrestiter < 2000) {
              options.url = body.next;
              if (totalrestiter % 100 == 0) {
                update();
              }
              getAllRest((next = true));
            } else if (
              getallrestiter < playlisttrackstoextract.length &&
              totalrestiter < 2000
            ) {
              options.url = playlisttrackstoextract[getallrestiter];
              logger.info("done");
              logger.info(getallrestiter);
              logger.info(playlisttrackstoextract.length);
              if (totalrestiter % 100 == 0) {
                update();
              }
              getAllRest((next = false));
            } else {
              update();
            }
          } catch (error) {
            logger.info(error);
            logger.info("real playlist error");
            options.url = playlisttrackstoextract[getallrestiter];
            logger.info("done");
            if (getallrestiter < playlisttrackstoextract.length) {
              getAllRest();
            }
          }
        });
      }

      function getListOfPlaylists() {
        logger.info("getlist");
        logger.info(options);
        request.get(options, function(error, response, body) {
          //logger.info(error);
          //logger.info(body);
          for (var i = 0; i < body.items.length; i++) {
            playlisttrackstoextract.push(body.items[i].tracks.href);
          }
          if (body.next) {
            options.url = body.next;
            getListOfPlaylists();
          } else {
            logger.info(playlisttrackstoextract.length);
            playlisttrackstoextract = playlisttrackstoextract.slice(
              1,
              playlisttrackstoextract.length
            );
            options.url = playlisttrackstoextract[getallrestiter];
            getAllRest();
          }
        });
      }

      logger.info("founduser to not extract: ", founduser);
      if (!founduser) {
        var getallrestiter = 0;
        var totalrestiter = 0;

        var playlisttrackstoextract = [];

        setTimeout(function() {
          options.url = "https://api.spotify.com/v1/me/playlists?limit=50";

          getListOfPlaylists();
        }, 7000); //7000
      }
    } catch (error) {
      logger.info(error);
    }
  }
  main();
});

app.post("/csv", function(req, res) {
  var lastdicttocheck = req.body.lastdicttocheck; // this was changed !!
  var userid = req.body.userid; // this was changed !!
  logger.info(Object.keys(lastdicttocheck).slice(0, 10));
  logger.info("userid in csv: ", userid);
  try {
    db.findOne(
      {
        userid: userid
      },
      function(err, doc) {
        try {
          logger.info("Found user:", doc.userid);
          var dicttocheck = doc.dicttocheck;
          for (var key in lastdicttocheck) {
            //logger.info("seems to be working")
            if (key !== "null" && key.slice(0, 1) !== "$" && key) {
              dicttocheck[key] = lastdicttocheck[key];
              //logger.info("seems to be working")
            }
            //logger.info("dicttocheck length: ", doc.dicttocheck.length)
          }
          db.updateOne(
            {
              userid: userid
            },
            {
              $set: {
                dicttocheck: dicttocheck
              }
            },
            {},
            function() {
              res.sendStatus(200);
            }
          );
        } catch (error) {
          logger.info(error)
          logger.info("csv account probably doesn't exist");
        }
      }
    );
  } catch (error) {
    logger.info(error);
    logger.info("catched");
  }
  //logger.info(JSON.parse(req.body))
  logger.info("csv");
});

//logger.info("Listening on 3000");
/*const port = process.env.PORT || 3000;
app.listen(port, () => {});*/
