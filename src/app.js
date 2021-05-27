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

client.on('error', function (err) {
    switch (err.eresult) {
        case 5:
            console.error('❌ [BOT] Error: invalid password');
            hook.error('Error', '❌ [BOT] Error: invalid password');
        case 84:
            console.error('❌ [BOT] Error: rate limit exceeded');
            hook.error('Info', '❌ [BOT] Error: rate limit exceeded');
        case 6:
            console.error('❌ [BOT] Error: logged in elsewhere');
            hook.error('Info', '❌ [BOT] Error: rate limit exceeded');
        default:
            console.error('❌ [BOT] Error: ' + err.eresult);
            hook.error('Info', '❌ [BOT] Error: ' + err.eresult);
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