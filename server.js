//create http server obj and make it listen on
//some port(8080 in this case )
//pass the http server object to websocket obj
//constructor
//if the msg received from client is requested to
//upgrade to websocket protocol, accept it,create
//unique connection with the client
//send and receive msges with the client using that connection obj
var clients={}
var games={}//stores list of players

//const http=require('http').createServer().listen(8080,console.log('listening on port 8080'))
//const server=require('websocket').server
//const socket=new server({'httpServer':http})
const express = require('express');
const http = require('http');
const WebSocketServer = require('websocket').server;
const path = require('path');

const app = express();
const server = http.createServer(app);
const port=8085
// Serve static files from the 'public' directory
//app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname), {
    setHeaders: function (res, path, stat) {
      if (path.endsWith('.js')) {
        res.set('Content-Type', 'clientscript/javascript');
      }
    }
  }));
  app.use(express.static(path.join(__dirname,'style.css'), {
    setHeaders: function (res, path, stat) {
      if (path.endsWith('.css')) {
        res.set('Content-Type', 'style/css');
      }
    }
  }));
  
  
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'client.html'));
  });

// Start the HTTP server on port 8080
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

// WebSocket server setup
const socket = new WebSocketServer({ httpServer: server });
const WIN_STATES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
socket.on('request',(req)=>{
    const conn=req.accept(null, req.origin)
    const clientId=Math.round(Math.random()*10)+Math.round(Math.random()*10)+Math.round(Math.random()*10)
    clients[clientId]={'conn':conn}
    conn.send(JSON.stringify({
        'tag':'connected',
        //'key':value
        //using json format cause it is good with handling text based data
        'clientId':clientId
    }))
    sendAvailableGames()//take all the games from the var games, then filters and send the games with single player who is waiting
    conn.on('message',onMessage)
})
function sendAvailableGames(){
    //games=[1,3,4] 
    const gamesList=[]
    for(const game in games){
        if(games[game].players.length<2){
            gamesList.push(game)
        }
    }

    for(const client in clients)
        clients[client].conn.send(JSON.stringify({
            'tag':'gameslist',
            'list':gamesList

        }))
}
function onMessage(msg){
    const data=JSON.parse(msg.utf8Data)
    switch(data.tag){
        case 'create':
            const gameId=Math.round(Math.random()*100)+Math.round(Math.random()*100)+Math.round(Math.random()*100)
            const board=['','','','','','','','','']
            var player={
                'clientId':data.clientId,
                'symbol':'x',
                'isTurn':true
            }
            const players=Array(player)
            games[gameId]={
                'board':board,
                'players':players
            }
            clients[data.clientId].conn.send(JSON.stringify({
                'tag':'created',
                'gameId':gameId
            }))
            sendAvailableGames();
            break
        case 'join':
             player={
                'clientId':data.clientId,
                'symbol':'o',
                'isTurn':false
            }
            games[data.gameId].players.push(player)
            sendAvailableGames()
            games[data.gameId].players.forEach(player => {
                clients[player.clientId].conn.send(JSON.stringify({
                    'tag':'joined',
                    'gameId': data.gameId,
                    'symbol':player.symbol
                }))
            });
            updateBoard(data.gameId)
            break
        case 'makeMove':
                //console.log(games[data.gameId].board)
                //console.log(data.board)
                 // Add this line to check if the game is ongoing
                games[data.gameId].board=data.board
                
                const isWinner=winState(data.gameId)
                const isDraw=drawState(data.gameId)
                if(isWinner){
                    games[data.gameId].status = 'ended';
                    games[data.gameId].players.forEach(player=>{
                        clients[player.clientId].conn.send(JSON.stringify({
                            'tag':'winner',
                            'winner':data.symbol
                        }))
                    })
                }
                
                else if(isDraw){
                    // Mark the game as ended here
                    games[data.gameId].players.forEach(player=>{
                        clients[player.clientId].conn.send(JSON.stringify({
                            'tag':'gameDraw'
                            
                        }))
                    })
                }
                else{
                    games[data.gameId].players.forEach(player=>{
                        player.isTurn=!player.isTurn
                    })
                    updateBoard(data.gameId)
                }
                break
    }
}
function winState(gameId){
    return WIN_STATES.some(row=>{
        return ( row.every(cell=>{
            return games[gameId].board[cell]=='x'}) || row.every(cell=>{
                return games[gameId].board[cell]=='o'}))
    })//here we used 'some' cause it will return true if atleast one of the case is true
}
function drawState(gameId) {
    // Check if all cells are filled
    return games[gameId].board.every(cell => cell === 'x' || cell === 'o');
}


function updateBoard(gameId){
    games[gameId].players.forEach(player=>{
        clients[player.clientId].conn.send(JSON.stringify({
            'tag':'updateBoard',
            'isTurn':player.isTurn,
            'board':games[gameId].board

        }))
    })

}