const PORT = 8000;
const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio');
const app = express()

const http = require('http').Server(app)
const io = require('socket.io')(http, {
  cors: {
    origin: '*'
  }
})

io.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('newBet', (newBet) => {
    console.log('New bet received:', newBet);

    // Broadcast the new bet data to all connected clients
    io.emit('betAdded', newBet);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

let plusOddsArray = []
let minusOddsArray = []

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => {
  res.json('Welcome to my Sports Betting API')
})

app.get('/ufc/mybookie', (req,res) => {
  axios.get('https://www.mybookie.ag/sportsbook/ufc/')
  .then((response) => {
    plusOddsArray = []
    minusOddsArray = []
    timeArray = []
    const html = response.data
    const $ = cheerio.load(html)

    $('div[class="row pt-3 text-white"]', html).each(function (i,element) {
      let visitorName = $(this).children('.col-5').children('.game-line__visitor-team').children('p').text()
      let oddsDiv = $(this).children('.col-7').children('div')[0]
      let oddsButton = $(oddsDiv).children('button')[1]
      let visitorOdds = $(oddsButton).children('span').text()

      let homeName = $(this).children('.col-5').children('.game-line__home-team').children('p').text()
      let homeOddsDiv = $(this).children('.col-7').children('div')[1]
      let homeOddsButton = $(homeOddsDiv).children('button')[1]
      let homeOdds = $(homeOddsButton).children('span').text()

      if(visitorOdds.startsWith('+')) {
        plusOddsArray.push({ name: visitorName, odds: visitorOdds })
        minusOddsArray.push({ name: homeName, odds: homeOdds})
      } else {
        plusOddsArray.push({ name: homeName, odds: homeOdds})
        minusOddsArray.push({ name: visitorName, odds: visitorOdds})
      }
    })
    io.emit('odds', [plusOddsArray, minusOddsArray])
    res.json([plusOddsArray, minusOddsArray])
  }).catch((err) => console.log(err))
})

http.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))