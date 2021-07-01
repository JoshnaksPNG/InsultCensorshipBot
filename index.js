require("@tensorflow/tfjs");
const toxicity = require("@tensorflow-models/toxicity");

const fs = require("fs");
const math = require("math.js");
const Discord = require("discord.js");
const { func } = require("@tensorflow/tfjs-data");

//Defining Client and Retrieving Token
const bot = new Discord.Client();
const tokenDoc = JSON.parse(fs.readFileSync(__dirname + "/token.json"));
const token = tokenDoc.token;

//Identifier List
const idList = JSON.parse(fs.readFileSync(__dirname + "/identifierList.json")).identifiers;

//Tracker List
const trackerList = JSON.parse(fs.readFileSync(__dirname + "/trackerList.json")).trackers;

//Censorship Role
const censorshipRole = {
    data: {
        name: "Censored By the State",
        color: [1, 1, 1],
        position: 1,
        permissions: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]
    }
};


//Executes when bot turns on
bot.on("ready", ()=>
{  
    console.log("Ready to censor the public!");
});


//Executes when bot detects a message
bot.on("message", (msg)=>
{
    //Check All Identifiers In Message
    let identified = false;
    for(const item of idList)
    {
        if(msg.content.toLowerCase().includes(item.toLowerCase()))
        {
            identified = true;
            break;
        }
    }

    //If the message contains an identifier, check it against the toxicity model
    if(identified)
    {
        //Relatively low confidence threshold, level of confidence that the model must reach to determine toxic behavior.
        const threshold = 0.75;

        toxicity.load(threshold).then(model => 
        {
            const input = msg.content;

            model.classify(input).then(predictions =>
            {
                //console.log(JSON.stringify(predictions, null, 4));

                //If the text is determined as a match, set score reduction
                if(predictions[predictions.length-1].results[0].match)
                {
                    let score_reduction = Math.round(Math.random() * 100);

                    //If the guild does not have the censorship role, create it
                    let censorRole = msg.guild.roles.cache.find(role => role.name.toLowerCase() == "censored by the state");
                    if(!censorRole)
                    {
                        try
                        {
                            roleOverwrite(msg.guild);
                            
                        } catch (error) {console.error(error);}
                    }

                    //Check list for author of message
                    let authorInList = false;

                    for(const user of trackerList)
                    {
                        if(user.id == msg.author.id)
                        {
                            authorInList = true;
                            user.score -= score_reduction;

                            //Add censored role if user has a score of less than 0
                            if(user.score <= 0)
                            {
                                msg.member.roles.add(censorRole);
                            }
                            break;
                        }
                    }

                    //If author is not in list, add them to the list with a new tracker
                    if(!authorInList)
                    {
                        trackerList.push(new ScoreTracker(msg.author.id, score_reduction));
                    }

                    //Update JSON file
                    fs.writeFileSync(__dirname + "/trackerList.json", JSON.stringify({trackers: trackerList}, null, 4));

                    //If message is deletable, delete message and reply, otherwise, just reply
                    if(msg.deletable)
                    {
                        msg.delete();
                        msg.reply("Your message has been found containing objectively incorrect information. I have done you the favor of removing it! (-" + score_reduction + " social points btw...)");
                    } else
                    {
                        msg.reply("For some reason, I cannot delete your message. But I shall reduce your score by " + score_reduction + " points regardless.")
                    }
                }
            });
        });
    }
});


//When the Bot joins a server, add role
bot.on("guildCreate", (guild) =>
{
    roleOverwrite(guild);
});


//Login to Client
bot.login(token);


//Class for Mute Score Tracker
class ScoreTracker 
{
    constructor (id, begin_reduction)
    {
        this.id = id;
        this.score = 1000 - begin_reduction;
    }

    reduceScore (reduction)
    {
        this.score -= reduction;
    }
}

//Function for creating the permission overwrite for the censorship role
async function roleOverwrite(gld)
{
    let cnsrRole = await gld.roles.create(censorshipRole);

    //Change Permissions for All Channels
    gld.channels.cache.forEach( async (channel) => 
    {
        await channel.createOverwrite(cnsrRole, {
        "SEND_MESSAGES": false
        });
    });
}