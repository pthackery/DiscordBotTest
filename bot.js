const fs = require("fs");
var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
const config = require("./config.json");

/*
Overall TODO
1. Switch from storing in ./config.json file using fs and into database to prevent file corruption 
2. Configure this bot to deal with multiple guilds. 
3. Add on line to ensure bot doesn't reply to other bots (I've seen other people's, but I'm getting errors for some reason)
4. Perhaps move all switch cmds into separate files to call from (read this might be better. Needs investigating)
5. Setup commands for level of user (i.e. only admin can clear all meetings, but all mods can add meetings, and all members can see meeting times)
6. Set meetings by type (i.e. add programmer meetings, designer meetings)


Commands to add:
1. !cancelMeeting -> given a date, should make note of day of week and whenever !meetings is called, specify any cancelled meetings.
					 Cancelled meetings should automatically be removed after date has passed. 

*/


//Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {colorize: true});
logger.level = 'debug';
//Initialize Discord Bot
var bot = new Discord.Client({
	token: auth.token,
	autorun: true
});

bot.on('ready', function(evt){
	logger.info('Connected');
	logger.info('Logged in as: ');
	logger.info(bot.username + '- (' + bot.id + ')');
	bot.setPresence({ game: { name: "Just Creepin" } });
});


//functionConfirming nums
var clearMeetingsFunc = 0;

bot.on('message', function(user, userID, channelID, message, evt){
	//check if confirming command
	if(config.needsConfirmation == true){
		//ensure that the user who called the command is also replying
		if(config.confirmingUser == userID){
			//if user has replied yes, this will run the function. Any other response will drop the command 
			config.needsConfirmation = false;
			if(message == 'yes'  || message == 'y'){
				//see which function needs to be run now that it has been confirmed
				var funcToDo = config.functionConfirming;
				switch(funcToDo){
					case clearMeetingsFunc:
						//clear all the scheduled meetings 
						var clear = config.noMeetings;
						config.meetingTimes = clear;
						fs.writeFile("./config.json", JSON.stringify(config), (err) => console.error);
						bot.sendMessage({
							to: userID,
							message: 'meetings cleared'
						});
						break;
				}
			}
			return;
		}
	}
	
	//listen for message startung with '!'	
	else if(message.substring(0,1) == '!'){
		var args = message.substring(1).split(' ');
		var cmd = args[0];
		
		switch(cmd){
			case 'clearMeetings':
				//setup to have next message confirm or deny meetings to be cleared
				config.confirmingUser = userID;
				config.needsConfirmation = true;
				config.functionConfirming = clearMeetingsFunc;
				bot.sendMessage({
					to: channelID,
					message: 'confirm clear with yes or y'
				});
				break;
			case 'meetings':
				//give list of current meetings 
				ListMeetings(channelID);
				break;
			case 'addMeeting':
				var commandLength = cmd.length + 1;
				args = message.substring(commandLength);
				AddMeeting(args, userID);
				break;
			case 'help':
				//show all commands available
				bot.sendMessage({
					to: channelID,
					message: 'available commands:  \t\n clearMeetings -> clears all set meetings \t\n addMeeting -> add meeting \t\n meetings -> list meetings'
				});
				break;
			default:
				bot.sendMessage({
					to: userID,
					message: "Unknown command. \nType !help for list of commands"
				});
			break;
		}
		
	}
});


/*
AddMeeting():
	1. Check if message has a day of the week listed
	2. Adds message to the appropriate slot in the config file for listing
TODO:
	1. Create better filing (i.e. only store day of week and time)
		-> example: !addMeeting for Mondays at 9
			- should only store 'Mondays' and '9'
	2. Create overall more efficient function
FIXME:
	1. Fridays aren't being added, even though it says they are. All others are functioning.
		Possible reasons:
			-dumb typo somewhere
			-something with the fs saving rather than a database being used (see overall TODO list)
 */
function AddMeeting(givenString,userID){
	givenString = givenString.toLowerCase();
	if(givenString.indexOf("sunday") !== -1){
		config.meetingTimes[0] = givenString;
		bot.sendMessage({
			to: userID,
			message: "Added meeting: " + givenString
		});
	}
	else if(givenString.indexOf("monday") !== -1){
		config.meetingTimes[1] = givenString;
		bot.sendMessage({
			to: userID,
			message: "Added meeting: " + givenString
		});
	}
	else if(givenString.indexOf("tuesday") !== -1){
		config.meetingTimes[2] = givenString;
		bot.sendMessage({
			to: userID,
			message: "Added meeting: " + givenString
		});
	}
	else if(givenString.indexOf("wednesday") !== -1){
		config.meetingTimes[3] = givenString;
		bot.sendMessage({
			to: userID,
			message: "Added meeting: " + givenString
		});
	}
	else if(givenString.indexOf("thursday") !== -1){
		config.meetingTimes[4] = givenString;
		bot.sendMessage({
			to: userID,
			message: "Added meeting: " + givenString
		});
	}
	else if(givenString.indexOf("friday") !== -1){
		config.meetingTimes[5] == givenString;
		bot.sendMessage({
			to: userID,
			message: "Added meeting: " + givenString
		});
	}
	else if(givenString.indexOf("saturday") !== -1){
		config.meetingTimes[6] = givenString;
		bot.sendMessage({
			to: userID,
			message: "Added meeting: " + givenString
		});
	}
	else{
		bot.sendMessage({
			to: userID,
			message: "No day given. Be sure to give a valid day of the week."
		});
	fs.writeFile("./config.json", JSON.stringify(config), (err) => console.error);
	}
}
	
/*
ListMeetings():
	1. Iterates through meetings array
	3. Prints all days not listed as "none" in array
 */	
function ListMeetings(channelID){
	var numMeetings = config.meetingTimes.length;
	var listMeetings = [];
	for(i = 0; i < numMeetings; i++){
		var meeting = config.meetingTimes[i];
		if(meeting != "none"){
			listMeetings.push(meeting);
		}
	}
	bot.sendMessage({
		to: channelID,
		message: "General meetings on: \n" + listMeetings
	});	
}