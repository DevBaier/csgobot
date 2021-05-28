const config = require('config');
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const GlobalOffensive = require('globaloffensive');
const Webhook = require('webhook-discord');
const Mongoose = require('mongoose');

const steamConfig = config.get('steam');
const discordConfig = config.get('discord');
const mongoConfig = config.get('mongo');

const hook = new Webhook.Webhook(discordConfig.csgoHookUrl);

const client = new SteamUser();
const csgo = new GlobalOffensive(client);

const User = require('./models/users');

const logOnOptions = {
    accountName: steamConfig.accountName,
    password: steamConfig.password,
    twoFactorCode: SteamTotp.generateAuthCode(steamConfig.sharedSecret)
};

Mongoose.connect(mongoConfig.mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})

Mongoose.connection.once('open',function(){
    console.log('Database connected Successfully');
}).on('error',function(err){
    console.log('Error', err);
})

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
            client.chatMessage(Object.keys(client.myFriends)[i], '[AUTOMATIC MESSAGE] Hello! Thank your for adding me as a friend 🤖 - This is an automatically generated message');
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

        var account_id = steamID;  
        csgo.requestPlayersProfile(account_id, function(data) {
            User.findOneAndUpdate({steamID64: account_id},
                {
                    wins: data.ranking.wins,
                    player_level: data.player_level,
                    vac_banned: data.vac_banned,
                    commendation: {
                        friendly: data.commendation.cmd_friendly,
                        teaching: data.commendation.cmd_teaching,
                        leader: data.commendation.cmd_leader
                    },
                    rank: getRank(data.ranking.rank_id)
                },
                {
                    new: true, // Always returning updated work experiences.
                    upsert: true, // By setting this true, it will create if it doesn't exist
                    projection: { _id: 0, __v: 0 }, // without return _id and __v
                },
                (error, data) => {
                    if(error) {
                        console.log(error)
                    }
                    else{
                        // mconsole.log(data)
                    }
                }
            )
        });
	}
});

client.on('error', function (err) {
    switch (err.eresult) {
        case 5:
            console.error('❌ [BOT] Error: invalid password');
            hook.err('Error', '❌ [BOT] Error: invalid password');
        case 84:
            console.error('❌ [BOT] Error: rate limit exceeded');
            hook.err('Error', '❌ [BOT] Error: rate limit exceeded');
        case 6:
            console.error('❌ [BOT] Error: logged in elsewhere');
            hook.err('Error', '❌ [BOT] Error: rate limit exceeded');
        default:
            console.error('❌ [BOT] Error: ' + err.eresult);
            hook.err('Error', '❌ [BOT] Error: ' + err.eresult);
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

csgo.on("connectedToGC", function() {
    console.log('✅ [BOT] Client Connected to GC');
});

csgo.on('disconnectedFromGC', (reason) => {
    if (reason == GlobalOffensive.GCConnectionStatus.GC_GOING_DOWN) {
        console.log('GC going down');    
    }
});

// TODO: Change for something beautifuller
function getRank(rankid) {
    if (rankid == 0) {
        return 'Unranked'
    }
    else if(rankid == 1) {
        return 'Silver I'
    }
    else if(rankid == 2) {
        return 'Silver II'
    }
    else if(rankid == 3) {
        return 'Silver III'
    }
    else if(rankid == 4) {
        return 'Silver IV'
    }
    else if(rankid == 5) {
        return 'Silver Elite'
    }
    else if(rankid == 6) {
        return 'Silver Elite Master'
    }
    else if(rankid == 7) {
        return 'Gold Nova I'
    }
    else if(rankid == 8) {
        return 'Gold Nova II'
    }
    else if(rankid == 9) {
        return 'Gold Nova III'
    }
    else if(rankid == 10) {
        return 'Gold Nova Master'
    }
    else if(rankid == 11) {
        return 'Master Guardian I'
    }
    else if(rankid == 12) {
        return 'Master Guardian II'
    }
    else if(rankid == 13) {
        return 'Master Guardian Elite'
    }
    else if(rankid == 14) {
        return 'Distinguished Master Guardian'
    }
    else if(rankid == 15) {
        return 'Legendary Eagle'
    }
    else if(rankid == 16) {
        return 'Legendary Eagle Master'
    }
    else if(rankid == 17) {
        return 'Supreme Master First Class'
    }
    else if(rankid == 18) {
        return 'Global Elite'
    }
    
}

process.on('SIGINT', function() {
    client.setPersona(SteamUser.EPersonaState.Offline);
    client.gamesPlayed([]);
    process.exit();
});