// 
// Import database queries
//
const CryptoJS = require("crypto-js");
const crypto = require("crypto");

let sessions = [];

// Generate a random string of the specified length
function generateRandomString(length) {
  return crypto.randomBytes(length).toString('hex');
}

// This is where we'd look up the password in the username/password store.  
// For the example, password = username
function getUserPassword(username) {
  return username;
}

function releaseSessionIds(username) {
  // Remove any session ids for the user in the data store
  //   ex: delete from SESSION_ID_TABLE where USERNAME = <user>;
}

function findSession(username) {
  let retIndex = -1;
  for (i=0; i<sessions.length; i++) {
    if (sessions[i].username === username) {
      retIndex = i;
      break;
    }
  }

  //console.log("Sessions",sessions);
  return retIndex;
}

function addSession(username,challengeStr,encryptKey) {
  // See if the user already has a session.
  let indx = findSession(username);
  if (indx < 0) {
    sessions.push({username, challengeStr, encryptKey});
  }
  else {
    sessions[indx].challengeStr = challengeStr;
    sessions[indx].encryptKey = encryptKey;
  }  
}

module.exports = function(app) {

  app.post('/api/loginRequest', function(req, res) {
    console.log("> [2] Recieved login request from client");
    let challengeStr = null;
    let encryptKey = null;
    let encChallenge = null;
    let encChallengeStr = null;
    let encKey = null;
    let encKeyStr = null;

    res.setHeader('Content-Type', 'application/json');
    let loginInfo = req.body;
    if (loginInfo.username === undefined) {
      res.status = 200;   //  Someone is passing garbage.  So say things are successful, but don't return challenge info.
    }
    else {
      // Generate random challenge string and session encryption key.
      challengeStr = generateRandomString(32);
      encryptKey = generateRandomString(64);    

      // Record the non-encrypted values, used to verify the response from the client.      
      addSession(loginInfo.username, challengeStr, encryptKey);

      // Get the user's (secret) password as the first encryption key.
      let password = getUserPassword(loginInfo.username);

      // Use the 'easy mode' Crypto encryption where you just give key and string - crypto does (all) the rest.
      encChallenge = CryptoJS.AES.encrypt(challengeStr, password);
      encChallengeStr = encChallenge.toString();

      encKey = CryptoJS.AES.encrypt(encryptKey, password);
      encKeyStr = encKey.toString();

      // blank out the users password now that we are done with it - so it isn't in memory any longer than needed.
      password = null;
      
      // For purposes of understanding what's going on, let's print this info:
      console.log("Login requested",loginInfo.username);
      console.log("  challengeStr",challengeStr);
      console.log("  encryptKey",encryptKey);
      
      // Send the encrypted information back.   The idea is that only the person with the password can successfully decrypt it.
      // Would be better to encrypt the entire return object, but that's a bit more advanced..
      let returnInfo = { "challengeStr" : encChallengeStr, "encryptKey" : encKeyStr };
      console.log("> [3] Returning login challenge to client.");
      res.end(JSON.stringify(returnInfo));      
    }
  });

  app.post('/api/login', function(req, res) {
    let sessionId = null;
    let encryptKey = null;
    let challengeStr = null;
    let returnChallengeStr = null;
    let decObject = null;
    let encObject = null;
    let encSessionId = null;

    res.setHeader('Content-Type', 'application/json');
    let loginInfo = req.body;
    console.log("> [6] Recieved login challenge response from client.");
    console.log(`  data: ${loginInfo.returnChallengeStr}`);

    if (loginInfo.username === undefined &&
        loginInfo.returnChallengeStr == undefined) {
      console.log("  ** Challenge string missing.");
      console.log(`> [7c] Returning 200 code to client. [Failed login, suspected breach attempt.]`); 
      res.status = 200;   //  Someone is passing garbage.  So say things are successful, but don't return challenge info.
    }
    else {
      sessionId = findSession(loginInfo.username);

      if (sessionId !== null) {
        encryptKey = sessions[sessionId].encryptKey;
        challengeStr = sessions[sessionId].challengeStr;

        decObject = CryptoJS.AES.decrypt(loginInfo.returnChallengeStr, encryptKey);
        returnChallengeStr = decObject.toString(CryptoJS.enc.Utf8);        
        if (returnChallengeStr === challengeStr) {

          console.log("  Challenge passed",returnChallengeStr);
          encObject = CryptoJS.AES.encrypt(sessionId.toString(), encryptKey);
          encSessionId = encObject.toString();
          //console.log("Enc session obj",encObject);
          console.log(`  Returning session id ${sessionId} encrypted (${encSessionId})`);
          console.log(`> [7a] Returning session id ${sessionId} encrypted (${encSessionId}) to client. [Successful login]`);
          console.log("");

          // Would be better to encrypt the entire return object, but that's a bit more advanced..
          res.end(JSON.stringify({ "sessionId" : encSessionId }));
        }
      }
      else {
        console.log(`> [7b] Returning 403 code to client. [Failed login]`); 
        res.status = 403;   // Someone is calling the API for a timed out / non-existant session.
      }
    }
    res.end();
  });
};
