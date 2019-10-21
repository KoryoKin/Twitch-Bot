const tmi = require("tmi.js");
const fs = require("fs");

const vc = require("./../data/ViewerConfig.json")
const vi = require("./../data/ViewerInfo.json");
const cc = require("./../data/ChannelConfig.json");
const ci = require("./../data/ChannelInfo.json");
const li = require("./../data/LogConfig.json");

var client = new tmi.client(li);

client.connect().then(async data => {
    await update();
}).catch(err => {
    throw err;
});

async function update(){
    client.on("subscription", (channel, user, method, message, userstate) => {
        client.action(channel, user["display-name"] + ", just subscribed. Thanks You! <3")
    });
    client.on("resub", (channel, user, months, message, userstate, method) => {
        client.action(channel, user["display-name"] + ", just re-subscribed for " + months + " months. Thanks You! <3")
    });
    client.on("hosted", (channel, username, viewers, autohost) => {
        if(viewers >= 10){
            client.action(channel, user["display-name"] + ", ganked with " + viewers + " viewers. Thanks You! <3")
        }
    });
    
    client.on("chat", (channel, user, message, self) => {
        if(!self){
            readInput(channel, user, message);
            userExperience(channel, user);
            messageCounter(channel, message);
        }
    })
}

function readInput(channel, user, input){
    if(input.startsWith("!")){
        var userInput = input.slice(1, input.length);

        if(Object.keys(cc[channel].InputOutput).includes(userInput))
        {
            client.say(channel, cc[channel].InputOutput[userInput]);
        }
        else if(userInput == "help")
        {
            var allCommands = Object.keys(cc[channel].InputOutput);
            var output = "";

            for(var i = 0; i < allCommands.length; i++){
                output += JSON.stringify(allCommands[i]);

                if(i != allCommands.length - 1)
                    output += ", ";
            }
            output += ".";
            client.whisper(user["display-name"], "Commands: " + output);
        }
        else
        {
            client.whisper(user["display-name"], "'" + userInput + "' is not a command.");
        }
    }
}

function userExperience(channel, user){
    if(!Object.keys(vi.Channels[channel]).includes(user["display-name"])){
        vi.Channels[channel][user["display-name"]] = {"Experience": 0, "Level" : 1};
    }

    vi.Channels[channel][user["display-name"]].Experience += vc.Index.Message;
    if(vi.Channels[channel][user["display-name"]].Experience >= vc.BaseExperience * vc.Multiplier * vi.Channels[channel][user["display-name"]].Level){
        vi.Channels[channel][user["display-name"]].Experience -= vc.BaseExperience * vc.Multiplier * vi.Channels[channel][user["display-name"]].Level;
        vi.Channels[channel][user["display-name"]].Level++;

        client.whisper(user["display-name"], "Congratulations, you are now level " + vi.Channels[channel][user["display-name"]].Level + "!");
    }

    fs.writeFile("./scripts/ViewerInfo.json", JSON.stringify(vi), (err) => {
        if(err) throw err;
    });
}

function messageCounter(channel, input){
    if(Object.keys(ci[channel].Messages).includes(input))
    {
        ci[channel].Messages[input]++;
        fs.writeFile("./scripts/ChannelInfo.json", JSON.stringify(ci), (err) => {
            if(err) throw err;
        });

        client.say(channel, input + " has been used [" + JSON.stringify(ci[channel].Messages[input]) + "] times.");
    }
}