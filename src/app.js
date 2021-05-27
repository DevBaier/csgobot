const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const client = new SteamUser();
const config = require('../config/config.json');

const logOnOptions = {
    accountName: config.steam.accountName,
    password: config.steam.password,
    twoFactorCode: SteamTotp.generateAuthCode(config.steam.sharedSecret)
};

client.logOn(logOnOptions);

client.on('loggedOn', () => {
    console.log('✅ [BOT] Client Connected');
    client.setPersona(SteamUser.EPersonaState.Online);
    client.gamesPlayed([730])
});

client.on('steamGuard', function(domain, callback, lastCodeWrong) {
	if(lastCodeWrong) {
		console.log('[BOT] Last code wrong, try again!');
		setTimeout(function() {
		    callback(SteamTotp.generateAuthCode(config.steam.sharedSecret));
		}, 30000);
	}	
});