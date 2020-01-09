let loggedin = false;
let mySessionId = null;
let password = null;
let username = null;
let encryptKey = null;

//
// The logout function should really hit a 'logout' API to tell the server to release
//  the session id.
//
function performLogout() {
    loggedin = false;
    mySessionId = null;
}

// 
// The login function will (ajax) call the API using a 'PUT' (not GET, as it causes changes) with
//  the username / password in the body.   In the real world the app should at least be running using ssl
//  so that the username & password is encrypted. 
//
function startLogin(username,password) {
    console.log("> [1] Posting login request to server");
    $.post(  "http://localhost:3000/api/loginRequest",
                {username},
                loginRequestCallback)
                .fail(function(jqXHR, textStatus, errorThrown) 
                {
                    console.log("status",textStatus);
                    console.log("error",errorThrown);
                    console.log("jqXHR",jqXHR);
                });
}

//
// Gets the data back from the login request   
// Some things to consider: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2011/august/javascript-cryptography-considered-harmful/
//
// Crypto (js) module comes from: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js
//
function loginRequestCallback(data, status, jqXHR) { 
    let decObject = null;
    let challengeStr = null;
    encryptKey = null;
    let encObject = null;
    let returnChallengeStr = null;

    console.log("> [4] Recieved login challege from server.");

    if (data.challengeStr !== undefined &&
        data.encryptKey !== undefined) {

        decObject = CryptoJS.AES.decrypt(data.challengeStr, password);
        challengeStr = decObject.toString(CryptoJS.enc.Utf8);

        decObject = CryptoJS.AES.decrypt(data.encryptKey, password);
        encryptKey = decObject.toString(CryptoJS.enc.Utf8);       // We *could* continue to use the user's password to encrypt/decrypt
                                                                  // things.  However that's usually a short string which makes the
                                                                  // encryption easier to break, also a separate key would change
                                                                  // each time - unlike the password.                                

        password = null;   // The encryption key is now used, can blank out the password so it can't be 'scraped' somehow.
                           // Note this just makes it so the password itself can't be stolen.  Injection attacks can still 
                           // use the encryptionKey / mySessionId to spoof..

        //
        // For understanding purposes, we are printing this out:
        //
        console.log("decrypted challengeStr",challengeStr);
        console.log("encryptKey (human readable)",decObject.toString(CryptoJS.enc.Utf8));

        // Now encrypt the (decrypted) challenge string using the (decrypted) session encryption key and return to the server.
        //  If the password is the same at server and client - the server will be able to decrypt and verify the challenge string.
        //  If the password doesn't match the server's decryption will not match.
        //
        encObject = CryptoJS.AES.encrypt(challengeStr, encryptKey);
        returnChallengeStr = encObject.toString();
        console.log("re-ecrypted challengeStr",returnChallengeStr);

        // Call the API that handles challenge responses.
        console.log("> [5] Posting login challenge response to server.");
        $.post(  "http://localhost:3000/api/login",
            {username, returnChallengeStr},
            loginCallback)
        .fail(function(jqXHR, textStatus, errorThrown) 
        {
            console.log("status",textStatus);
            console.log("error",errorThrown);
            console.log("jqXHR",jqXHR);
        });
    }
    else {
        $("#log-status-text").text("Not logged in; invalid username/password.");
    }
}

function loginCallback(data, status, jqXHR) {
    console.log(`> [8] Recieved server response to client login challenge response`);
   
    if (data.sessionId !== undefined) {
        loggedin = true;

        console.log(`Encrypted message (${data.sessionId})`);
        console.log(`Encryption key (${encryptKey})`);        

        let decObject = CryptoJS.AES.decrypt(data.sessionId, encryptKey);
        mySessionId = decObject.toString(CryptoJS.enc.Utf8);
        console.log("Decrypted Session id",mySessionId);

        $("#log-status-text").text("Logged in, session id: " + mySessionId);
    }
    else {
        $("#log-status-text").text("Not logged in; invalid username/password.");
    }
}

function toggleLogin() {
    console.log("Toggle login");
    if (loggedin) {
        performLogout();
    }
    else {       
        $("#login-modal-div").css("visibility","visible");
    }
}

function tryLogin(event) {
    event.preventDefault();
    username = $("#login-username-formtxt").val();
    password = $("#login-password-formtxt").val();
    // Clear the password field in the client
    $("#login-password-formtxt").val("");
    startLogin(username,password);
    $("#login-modal-div").css("visibility","hidden");
}

$("#log-toggle-button").on("click",toggleLogin);
$("#login-form").on("submit",tryLogin);