# SheetTM

A bot specifically built for updating Trackmania-related information to a Google Sheet in Discord.
If you wish to use the bot, you will have to provide your own sheet, user data and Discord server information. All the relevant information for this should be stored in a file called `config.json`.
<br><br>
Any dependencies can be installed through `npm install`. The Docker configuration is set up to start everything required for the bot to work with `docker-compose up`. You can also start the backend and the bot locally with `node index.js` and `node discord.js`, though it's generally not recommended.
<br><br>
If you add or edit any commands, you must run `node deploy-commands.js`. For further command-related questions, refer to the [discord.js documentation](https://github.com/TeemuLaine).
