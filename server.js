const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./var/backend.sqlite3');
const uniqueFilename = require('unique-filename')
const moment = require('moment');
const fs = require('fs');
var glob = require('glob');
var readline = require('readline');
db.run('PRAGMA foreign_keys = ON;');

// File Upload to var/uploads/
var path = require('path')
UPLOAD_FOLDER = path.join('var', 'uploads')

function generate_file() {
  // res.Sessions["created"].replace(/:|\s/g,"-")
  // var randomTmpfile = uniqueFilename("") + ".txt"
  return String(moment().format('YYYY-MM-DD-hh-mm-ss')) + ".txt"
}

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());

app.get('/api/patients/', (req, res) => {
  db.all('SELECT username FROM patients', (err, rows) => {
    console.log('All allUsernames is:', rows);
    res.json(rows);
  });
});

app.get('/api/patients/:userid', (req, res) => {
  const nameToLookup = req.params.userid;
  db.all(
    'SELECT * FROM patients WHERE username=$username',
    {
      $username: nameToLookup
    }, (err, rows) => {
      console.log(rows);
      if (rows.length > 0) {
        res.send(rows[0]);
      } else {
        res.send({});
      }
    }
  );
});

var cb0 = function (req, res, next) {
  db.all(
    'SELECT * FROM sessions WHERE 0 + strftime(\'%s\',created, \'localtime\', \'utc\') >= 0 + strftime(\'%s\', \'now\', \'localtime\', \'start of day\', \'utc\') AND owner=$owner;',
    {
      $owner: req.params.userid
    }, (err, rows) => {
      console.log('Select datediff is:', rows);
      res.Sessions = rows.length > 0 ? rows[0] : {};
      next();
  });
}

const util = require('util');
const promiseGlob = util.promisify(glob);

var cb1 = function (req, res, next) {
  force = []
  squeeze = []
  data = []
  db.all(
    'SELECT * FROM sessions WHERE owner=$owner;', {
      $owner: req.params.userid
    }, (err, rows) => {
      console.log('Select w/o time is:', rows);
      for (row of rows) {
        force.push({
          date: row.created,
          value: row.forceDuringSqueeze})
        squeeze.push({
          date: row.created,
          value: row.squeezeCount})
      }
      output = {
        force: force,
        squeeze: squeeze
      }
      console.log(moment().format())
      promiseGlob(path.join(UPLOAD_FOLDER, req.params.userid, "*")).then(
        files => {
          contents = []
          for (file of files) {
            var content = fs.readFileSync(file, 'utf8').toString().split("\n");
            content.pop();
            contents = contents.concat(content)
          }
          return contents
        }).then((lines) => {
          data = []
          for (line of lines) {
            var line = line.split(',')
            data.push({
              date: line[0],
              value: line[1]
            })
          }
          return data
        }).then(data => {
          output['data'] = data
          res.Sessions = output;
          next();
        })
  });
}

app.get('/api/sessions/', (req, res) => {
  db.all(
    'SELECT * FROM sessions;', (err, rows) => {
      console.log('Select sessions is:', rows);
      res.json(rows)
  });
});

app.get('/api/sessionsData/:userid', [cb1], (req, res) => {
  res.json(res.Sessions)
});

app.get('/api/sessions/:userid', [cb0], (req, res) => {
  res.json(res.Sessions)
});

app.post('/api/newSession/:userid', [cb0], function (req, res, next) {
  var filename
  var owner
  if ("sessionid" in res.Sessions) {
    filename = res.Sessions["filename"] ? res.Sessions["filename"] : generate_file()
    owner = res.Sessions["owner"]
    squeezeCount = res.Sessions["squeezeCount"] + req.body.squeezeCount
    sessionDuration = res.Sessions["sessionDuration"] + req.body.sessionDuration
    forcePerSqueeze = (res.Sessions["forcePerSqueeze"]*res.Sessions["squeezeCount"] + req.body.forcePerSqueeze*req.body.squeezeCount) / squeezeCount
    forceDuringSqueeze = (res.Sessions["forceDuringSqueeze"]*res.Sessions["sessionDuration"] + req.body.forceDuringSqueeze*req.body.sessionDuration) / sessionDuration
    db.run(
      'UPDATE sessions set squeezeCount = $squeezeCount, sessionDuration = $sessionDuration, forcePerSqueeze = $forcePerSqueeze, forceDuringSqueeze = $forceDuringSqueeze, filename = $filename WHERE sessionid = $sessionid;',
      {
        $squeezeCount: squeezeCount,
        $sessionDuration: sessionDuration,
        $forcePerSqueeze: forcePerSqueeze,
        $forceDuringSqueeze: forceDuringSqueeze,
        $filename: filename,
        $sessionid: res.Sessions["sessionid"],
      },
      (err) => {
        if (err) {
          console.log(err);
          res.send({message: 'error in app.post(/api/newSession)/'});
        } else {
          res.send({message: 'successfully run app.post(/api/newSession/)'});
        }
      }
    );
  }
  else {
    owner = req.params.userid
    filename = generate_file()
    db.run(
      'INSERT INTO sessions (squeezeCount, sessionDuration, forcePerSqueeze, forceDuringSqueeze, filename, owner) VALUES ($squeezeCount, $sessionDuration, $forcePerSqueeze, $forceDuringSqueeze, $filename, $owner);',
      {
        $squeezeCount: req.body.squeezeCount,
        $sessionDuration: req.body.sessionDuration,
        $forcePerSqueeze: req.body.forcePerSqueeze,
        $forceDuringSqueeze: req.body.forceDuringSqueeze,
        $filename: filename,
        $owner: req.params.userid
      },
      (err) => {
        if (err) {
          res.send({message: 'error in app.post(/api/newSession)/'});
        } else {
          res.send({message: 'successfully run app.post(/api/newSession/)'});
        }
      }
    );
  }
  var dir = path.join(UPLOAD_FOLDER, owner)
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  var file = fs.createWriteStream(path.join(dir, filename), {'flags': 'a'});
  file.on('error', function(err) { /* error handling */ });
  req.body.data.forEach(function(x) { file.write(moment().format() + "," + x + '\n') });
  file.end();
});

const port = 5000;

app.listen(process.env.PORT || port, () => `Server running on port ${port}`);
