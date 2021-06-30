require("@tensorflow/tfjs");

const fs = require("fs");
const Discord = require("discord.js")

//Defining Client and Retrieving Token
const bot = new Discord.Client();
const tokenDoc = JSON.parse(fs.readFileSync(__dirname + "/token.json"));
const token = tokenDoc.token;

bot.on("ready", ()=>
{
    console.log("Ready to censor the public!");
});

bot.on("message", (msg)=>
{
    let identified = false;

    if(identified)
    {
        
    }
})
bot.login(token);