const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const User = new Schema ({
    steamID64: { type: Number },
    wins: { type: Number },
    commendation: {
        friendly: { type: Number },
        teaching: { type: Number },
        leader: { type: Number }
    },
    player_level: { type: Number },
    vac_banned: { type: Boolean },
    rank: { type: String }
});

module.exports = Mongoose.model('User', User)