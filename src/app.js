const config = require('../config/config.json');

const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const webhook = require("webhook-discord");

const hook = new webhook.Webhook(config.discord.csgoHookUrl);

const client = new SteamUser();

const logOnOptions = {
    accountName: config.steam.accountName,
    password: config.steam.password,
    twoFactorCode: SteamTotp.generateAuthCode(config.steam.sharedSecret)
};

client.logOn(logOnOptions);

client.on('loggedOn', () => {
    console.log('✅ [BOT] Client Connected');
    hook.info('Info', '✅ [BOT] Client Connected');
    client.setPersona(SteamUser.EPersonaState.Online);
    client.gamesPlayed([730]);
});

client.on('friendsList', function () {
    console.log('🔍 [BOT] Searching for friend requests...');
    for (var i = 0; i < Object.keys(client.myFriends).length; i++) {
        if (client.myFriends[Object.keys(client.myFriends)[i]] == SteamUser.EFriendRelationship.RequestRecipient) {
            console.log('👥 [BOT] Added ' + Object.keys(client.myFriends)[i]);
            hook.info('Info', '👥 [BOT] Added ' + 'https://steamcommunity.com/profiles/' + Object.keys(client.myFriends)[i]);
            client.addFriend(Object.keys(client.myFriends)[i]);
            client.chatMessage(steamID, '[AUTOMATIC MESSAGE] Hello! Thank your for adding me as a friend 🤖 - This is an automatically generated message');
        }
    }
});

client.on('friendRelationship', (steamID, relationship) => {
	if (relationship == SteamUser.EFriendRelationship.RequestRecipient) 
	{
        console.log('🔍 [BOT] New friend requests...');
        console.log('👥 [BOT] Added ' + steamID);
        hook.info('Info', '👥 [BOT] Added ' + 'https://steamcommunity.com/profiles/' + steamID);
		client.addFriend(steamID);
		client.chatMessage(steamID, '[AUTOMATIC MESSAGE] Hello! Thank your for adding me as a friend 🤖 - This is an automatically generated message');
	}
});

client.on('error', function (err) {
    switch (err.eresult) {
        case 5:
            console.error('❌ [BOT] Error: invalid password');
            hook.err('Error', '❌ [BOT] Error: invalid password');
        case 84:
            console.error('❌ [BOT] Error: rate limit exceeded');
            hook.err('Info', '❌ [BOT] Error: rate limit exceeded');
        case 6:
            console.error('❌ [BOT] Error: logged in elsewhere');
            hook.err('Info', '❌ [BOT] Error: rate limit exceeded');
        default:
            console.error('❌ [BOT] Error: ' + err.eresult);
            hook.err('Info', '❌ [BOT] Error: ' + err.eresult);
    }

    process.exit();
});

client.on('steamGuard', function(domain, callback, lastCodeWrong) {
	if(lastCodeWrong) {
		console.warn('⚠️ [BOT] Last code wrong, try again!');
        hook.warn('Warning', '⚠️ [BOT] Last code wrong, try again!');
		setTimeout(function() {
		    callback(SteamTotp.generateAuthCode(config.steam.sharedSecret));
		}, 30000);
	}	
});