//create websocket obj
//pass url and port no. of the server u want to
// connect 
//every time server sends a msg to client 
//onmessage event is triggered
//to send a message to server ,send method of the websocket



//object is used
//const { connect } = require("http");
var socket
var clientId
var gameId
var symbol
const create=document.querySelector('.createbtn')
create.disabled=true
const join=document.querySelector('.joinbtn')
join.disabled=true
join.addEventListener('click',()=>{
    socket.send(JSON.stringify({
        'tag':'join',
        'clientId':clientId,
        'gameId':gameId
    }))
})
const board=document.querySelector('.board')
const cells=document.querySelectorAll('.cell')
const list=document.querySelector('ul')
const sidebar=document.querySelector('.sidebar')
const connectButton=document.querySelector('.cnctbtn')
connectButton.addEventListener('click', (event) => { // Corrected 'addEventListner' to 'addEventListener'
    socket = new WebSocket('ws://localhost:8085');
    socket.onmessage = onMessage;
    event.target.disabled = true;
});

function onMessage(msg){
    const data=JSON.parse(msg.data)//converting from json format to text and the data is data received from the server
    switch(data.tag){
        case 'connected':
            clientId=data.clientId
            const lbl=document.createElement('label')
            lbl.innerText=data.clientId
            lbl.style.textAlign='center'
            sidebar.insertBefore(lbl,connectButton)
            create.disabled=false
            join.disabled=false
            break
        case 'gameslist':
            const games=data.list
            while(list.firstChild){
                list.removeChild(list.lastChild)
            }
            games.forEach(game => {
               
                const li=document.createElement('li')
                li.innerText=game
                li.style.textAlign='center'
                list.appendChild(li)
                list.addEventListener('click',()=>{
                    gameId=game
                })
            });
            break
        case 'created':
            gameId=data.gameId
            create.disabled=true
            join.disabled=true
            //console.log(gameId)
            break
        case 'joined':
            document.querySelector('.board').style.display='grid'
            symbol=data.symbol
            if(symbol=='x'){
                board.classList.add('cross')
            }else board.classList.add('circle')
            break
        case 'updateBoard':
            //erase all the symbols on cells
            cells.forEach(cell=>{
                if(cell.classList.contains('cross'))
                    cell.classList.remove('cross')
                else if(cell.classList.contains('circle'))
                    cell.classList.remove('circle')
            })
            for(i=0;i<9;i++){
                if(data.board[i]=='x'){
                    cells[i].classList.add('cross')
                }
                else if(data.board[i]=='o'){
                    cells[i].classList.add('circle')
                }
            }
            if(data.isTurn)
                makeMove()
            break
        case 'winner':
            alert('The Winner is ' + data.winner)
            break
        case 'gameDraw':
            alert('The game is a DRAW , try harder buddy. Lets go !!')
    }
function makeMove(){
    cells.forEach(cell=>{
        if(!cell.classList.contains('cross')&& !cell.classList.contains('circle'))
            cell.addEventListener('click',cellClicked)//this will mark x or o in a cell when clicked
    })
}
function cellClicked(event){
    let icon
    
    if(symbol=='x'){
        icon='cross'
    }else icon='circle'
    event.target.classList.add(icon)
    const board=[]//to update board after a player made his move
    for(i=0;i<9;i++){
        if(cells[i].classList.contains('circle')){
            board[i]='o'
        }
        else if(cells[i].classList.contains('cross')){
            board[i]='x'
        }else board[i]=''
    }
    //to restrict player to make another move, just after he made his move
    //we remove all the event listeners associated with each cell
    cells.forEach(cell=>{
        cell.removeEventListener('click',cellClicked)
    })
    socket.send(JSON.stringify({
        'tag':'makeMove',
        'board':board,
        'clientId':clientId,
        'gameId':gameId,
        'symbol': symbol
    }))
}
}
create.addEventListener('click',()=>{
    socket.send(JSON.stringify({
        'tag':'create',
        'clientId':clientId
    }))
})