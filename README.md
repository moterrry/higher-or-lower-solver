# higher lower helper

this is a tampermonkey script for the higher lower game
it highlights the correct choice with a pulsing green outline

## how to install

- install tampermonkey in your browser
- create a new script
- paste the code from higher lower solver user js
- save and play the game

## how it works

- preloads general category questions from the game database on startup
- intercepts all xmlhttprequest and fetch api requests to capture question data from other categories automatically
- cleans and normalizes screen text to match it with the captured data
- applies a glowing green pulse outline style to the correct choice button
