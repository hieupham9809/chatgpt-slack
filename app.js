#!/usr/bin/env node
const { App } = require("@slack/bolt");
require("dotenv").config();
var generate = require("./api/generate").generate;

const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	socketMode: true,
	appToken: process.env.SLACK_APP_TOKEN
});


app.command("/knowledge", async ({ command, ack, say }) => {
    try {
      await ack();
      say("Yaaay! that command works!");
    } catch (error) {
        console.log("err")
      console.error(error);
    }
});

app.message(async ({ message, say }) => {
 const { user, text } = message;
 console.log(`received message: ${text} from ${user}`);
 
    try {
      const response = await generate({ user: user, question: text });

      if (response.status !== 200) {
        throw new Error(`Request failed with status ${response.status}, error: ${response.message}`);
      }

      say(response.result);
      console.log(response.result);
    
    } catch(error) {
      // Consider implementing your own error handling logic here
      console.error(error);
     
      say(`Error: ${error.message}`); 
    }
});

(async () => {
	const port = 2000
	await app.start(process.env.PORT || port);
	console.log(`Slack Bolt app is running`);
})();

