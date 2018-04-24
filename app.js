var builder = require('botbuilder');
var restify = require('restify');

//Setup restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function(){
    console.log("%s Listening to %s", server.name,server.url);
});

//connector is used to connect the framework to console or chat tool etc
//below is an example of console connector
// var connector = new builder.ConsoleConnector().listen();

//below is an example of chat connector
var connector = new builder.ChatConnector();
server.post('/api/messages', connector.listen());


// var bot = new builder.UniversalBot(connector, function(session){
//     session.send("Hi! I'm a movie ticket booking bot.");
// });
var bot = new builder.UniversalBot(connector);
var luisAppId = "6805209f-c0c7-41f8-9289-15e8a06ccdfb";
var lusiAPIKey = "4ef2093d038748ac90cb12c45b8c2c5c";
var luisAPIHostName = "westus.api.cognitive.microsoft.com";
const luisModelUrl = 'https://'+luisAPIHostName+'/luis/v2.0/apps/'+luisAppId+'?subscription-key='+lusiAPIKey;

var recognizer = new builder.LuisRecognizer(luisModelUrl);
var intents = new builder.IntentDialog({
    recognizers : [recognizer]
});
bot.dialog('/',intents);
intents.matches('Greet', (session, args, next) => {
    session.send("Hello there! I'm Eve, the movie ticket booking bot. How can I help you today?");
});

var movies = [
    "Avengers",
    "Lord of the Rings",
    "Incredibles",
    "Civil War",
    "Interstellar"
]

intents.matches('ShowNowPlaying', (session, args, next) => {
    session.send("Sure! Here is the list of Movies currently playing:\n\n"+ movies.join("\n\n"));
});

// intents.matches(null, (session, args, next) => {
//     session.send("Sorry! I didn't get that :( Could you please repeat?");
// });

intents.matches('BookTickets', [(session, args, next) => {
    console.log(JSON.stringify(args));
    var moviesEntity = args.entities.filter(e => e.type == 'Movies');
    var noOfTicketsEntity = args.entities.filter(e => e.type =='builtin.number');
    if(moviesEntity.length > 0){
        session.userData.movie = moviesEntity[0].resolution.values[0];
    }else{
        delete session.userData.movie;
    }
    if(noOfTicketsEntity.length > 0){
        session.userData.noOfTickets = noOfTicketsEntity[0].resolution.value;
    }else{
        delete session.userData.noOfTickets;
    }
    if(!session.userData.movie){
            session.beginDialog('askMovie');
    }else{
        next();
    }

}, (session, args, next) => {
    if(!session.userData.noOfTickets){
        session.beginDialog('askNoOfTickets');
}else{
    next();
}
}, (session, args, next) => {
    session.send("Sure, I have booked you "+ session.userData.noOfTickets+ " tickets for "+ session.userData.movie+".Enjoy!");
}]);

bot.dialog('askMovie',[(session, args, next) => {
    builder.Prompts.choice(session, "What movie would you like to watch?",movies);
}, (session, results) => {
    console.log(results.response);
    session.userData.movie = results.response.entity;
    session.endDialogWithResult(results);
}]);

bot.dialog('askNoOfTickets',[(session, args, next) => {
    builder.Prompts.number(session, "How many ticket/s do you like to book?");
}, (session, results) => {
    session.userData.noOfTickets = results.response;
    session.endDialogWithResult(results);
}]);