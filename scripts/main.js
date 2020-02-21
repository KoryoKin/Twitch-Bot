const tmi = require("tmi.js");
const fs = require("fs");
const fetch = require("node-fetch");

var channelConfig = require("./../data/ChannelConfig.json");
var channelInfo = require("./../data/ChannelInfo.json");
var logConfig = require("./../data/LogConfig.json");
var leagueConfig = require("./../data/LeagueConfig.json");

var client = new tmi.client(logConfig);

client.connect().then((data) => {
    start();
    update();
}).catch((err) => {
    throw err;
});

var start = () => {

}
var update = () => {
    client.on("subscription", (channel, user, method, message, userstate) => {
        client.action(channel, `${user["display-name"]}, Just subscribed. Thank you! <3`);
        client.action(channel, `${user["display-name"]}: ${message}`);
    });
    client.on("resub", (channel, user, months, message, userstate, method) => {
        client.action(channel, `${user["display-name"]}, Just resubscribed for ${months} months. Thank you! <3`);
        client.action(channel, `${user["display-name"]}: ${message}`);
    });
    client.on("hosted", (channel, username, viewers, autohost) => {
        if(viewers >= 10) {
            client.action(channel, `${username}, just hosted with ${viewers} viewers. Thank you! <3`);
        }
    });
    
    client.on("chat", (channel, user, message, self) => {
        if(!self){
            readInput(channel, user, message);

            messageCounter(channel, message, () => {
                client.say(channel, `${message} [${JSON.stringify(channelInfo[channel].Messages[message])}]`);
            });
        }
    })
}

var readInput = (channel, user, input) => {
    if(input.startsWith("!")){
        var userInput = input.slice(1, input.length);

        if(Object.keys(channelConfig[channel].inputOutput).includes(userInput)) {
            switch(userInput) {
                case "help":    
                    var allCommands = Object.keys(channelConfig[channel].inputOutput);
                    var output = "";
        
                    for(var i = 0; i < allCommands.length; i++){
                        output += JSON.stringify(allCommands[i]);
        
                        if(i != allCommands.length - 1) {
                            output += ", ";
                        }
                    }

                    output += ".";
                    client.whisper(user["display-name"], `Comandos: ${output}`);
                    break;
                case "elo":
                    for (var i = 0; i < leagueConfig[channel].Summoners.length; i++) {
                        var idURL = `https://br1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${leagueConfig[channel].Summoners[i]}?api_key=${leagueConfig.APIKey}`;

                        getJSON(idURL, (idData) => {
                            var rankURL = `https://br1.api.riotgames.com/lol/league/v4/entries/by-summoner/${idData.id}?api_key=${leagueConfig.APIKey}`;

                            getJSON(rankURL, (rankData) => {
                                if(JSON.stringify(rankData) != "[]") {
                                    rankData.forEach(queue => {
                                        if(queue.queueType == "RANKED_SOLO_5x5"){
                                            client.say(channel, `${queue.summonerName}: ${queue.tier} ${queue.rank} (${queue.leaguePoints} LP)`);
                                        }
                                    });
                                }
                            });
                        });
                    }
                    break;
                default:
                    client.say(channel, channelConfig[channel].inputOutput[userInput]);
                    break;
            }
        }
    }
}

var messageCounter = (channel, message, callback) => {
    if(Object.keys(channelInfo[channel].Messages).includes(message)) {
        channelInfo[channel].Messages[message]++;
        fs.writeFile("./data/ChannelInfo.json", JSON.stringify(channelInfo), (err) => {
            if(!err)
                callback();
            else throw err;
        });
    }
}

var getJSON = (url, callback) => {
    fetch(url).then(async (response) => {
        callback(await response.json());
    }).catch((err) => {
        throw err;
    });
}