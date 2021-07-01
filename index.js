require("@tensorflow/tfjs");
const toxicity = require("@tensorflow-models/toxicity");

const fs = require("fs");
const Discord = require("discord.js")

//Defining Client and Retrieving Token
const bot = new Discord.Client();
const tokenDoc = JSON.parse(fs.readFileSync(__dirname + "/token.json"));
const token = tokenDoc.token;

//Identifier List
const idList = JSON.parse(fs.readFileSync(__dirname + "/identifierList.json")).identifiers;

bot.on("ready", ()=>
{
    console.log("Ready to censor the public!");
});

bot.on("message", (msg)=>
{
    //Check All Identifiers In Message
    let identified = false;
    for(const item of idList)
    {
        if(msg.content.includes(item))
        {
            identified = true;
            break;
        }
    }

    if(identified)
    {
        const threshold = 7.5;

        toxicity.load(threshold).then(model => 
        {
            const input = msg.content;

            model.classify(input).then(predictions =>
            {
                console.log(predictions);
            });
        });
    }
})
bot.login(token);