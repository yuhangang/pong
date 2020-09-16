import { interval, fromEvent, from, zip, Observable, Subscription } from 'rxjs'
import { map, scan, filter, merge, flatMap, take, concat, takeUntil } from 'rxjs/operators'
class RNG {
  // LCG using GCC's constants

  m = 0x80000000// 2**31
  a = 1103515245
  c = 12345
  yangle = 30
  state: number
  constructor(seed) {
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }


  nextInt() {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
  }
  nextFloat() {
    // returns in range [0,1]
    return this.nextInt() / (this.m - 1);
  }


  getRandomMotion(): ballMotion {
    
    const random_num = Math.floor(this.nextFloat() * (this.yangle + this.yangle + 1)) - this.yangle;
    return new ballMotion(random_num);
    //velocity:1/Math.cos(radianToDeg(random_num));
  }
  getBounceMotion(previous:ballMotion): ballMotion{
    return previous;
  }
}


class ballMotion {
  cx: number;
  cy: number;
  deg: number;
  radianToDeg = (num: number) => (num * Math.PI / 180);

  constructor(deg:number){
    this.deg = deg;
    this.calcMovement();
    
  }
  calcMovement(){
    this.cx = Math.cos(this.radianToDeg(this.deg));
    this.cy = Math.tan(this.radianToDeg(this.deg));
  }
  bounce(ball:HTMLElement){
    this.deg = - this.deg;
    this.cx = - this.cx;
    this.cy =  this.cy;
  }
  //velocity:number;
}

class settings {
  readonly peddlerWidth = 15;
  readonly peddlerHeight = 120;
  readonly ballRadius = 15;
  readonly ballColor = "cyan";
  readonly canvasWidth = 600;
  readonly canvasHeight = 600;
  readonly winScore = 5;
}



class hintTextSettings{
  initialGameState(){
    const hintText = document.getElementById("hint");
    hintText.innerText = "Click space button to start the game";
    
  }

  empty(){
    const hintText = document.getElementById("hint");
    hintText.innerText = "\n";
  }

  userLose(){
    const hintText = document.getElementById("hint");
    hintText.innerText = "You lost the Game....";
    setTimeout(()=>{this.initialGameState();},3000);
  }
  userWin(){
    const hintText = document.getElementById("hint");
    hintText.innerText = "You win the Game!";
    setTimeout(()=>{this.initialGameState();},3000);
  }
}

class State {
  userScore: number = 0;
  botScore: number = 0;
  isGameStarted: boolean = false;
  isGamePaused: boolean = false;
  isGameFinished: boolean = false;

  addUserScore() {
    this.userScore++;
    document.getElementById("userScore").innerText = String(parseInt(document.getElementById("botScore").innerText) + 1);
    this.reCenterBall();
  }

  addBotScore() {
    this.botScore++; 
    document.getElementById("botScore").innerText = String(parseInt(document.getElementById("botScore").innerText) + 1);
    this.reCenterBall();
  }

  reset() {
    this.userScore = 0; this.botScore = 0;
  }
  reCenterBall() {
    document.getElementById("ball").setAttribute("cx", String(globalSettings.canvasWidth / 2));
    document.getElementById("ball").setAttribute("cy", String(globalSettings.canvasHeight / 2));
  }
}

const gameState = new State();
const globalSettings = new settings();
const hintTextProcess = new hintTextSettings();




function move(ball:HTMLElement,ball_motion:ballMotion):boolean{
  const bot =document.getElementById("bot");
  const bound = globalSettings.canvasWidth - globalSettings.ballRadius/2;
  const bot_min = 60;
  ball.setAttribute('cx', String(
    Math.min(Math.max(3 * ball_motion.cx + Number(ball.getAttribute('cx')),globalSettings.peddlerWidth + globalSettings.ballRadius ),
      bound)));
  ball.setAttribute('cy', String(
    Math.min(3 * ball_motion.cy + Number(ball.getAttribute('cy')),
      bound)));
  bot.setAttribute('y', String(
        Math.min(Math.max(3 * ball_motion.cy + Number(ball.getAttribute('cy'))-globalSettings.peddlerHeight/2,globalSettings.peddlerHeight/2),
          bound - globalSettings.peddlerHeight/2)));
  return true;
}

function isReachBound(ball:HTMLElement,bound:number):boolean {
  return (parseFloat(ball.getAttribute('cx')) > globalSettings.peddlerWidth + globalSettings.ballRadius &&
  parseFloat(ball.getAttribute('cx')) < bound - globalSettings.peddlerWidth && 
  parseFloat(ball.getAttribute('cy')) > 0 &&
  parseFloat(ball.getAttribute('cy')) < bound);
}

function handleReachBound(ball:HTMLElement,input:Subscription):boolean{

  if (parseFloat(ball.getAttribute('cx')) >= globalSettings.canvasWidth  - globalSettings.peddlerWidth - globalSettings.peddlerWidth) {
    const player =document.getElementById("user");
    const handleChange = ()=>{  hintTextProcess.userLose(); gameState.addBotScore();return false;};
  //isGetByPlayer(player) ? bounce(player) : handleChange();
  return isGetByPlayer(player)? true:handleChange();
}
else if(parseFloat(ball.getAttribute('cx')) <= globalSettings.peddlerWidth+globalSettings.ballRadius){
  const player =document.getElementById("bot");
  const handleChange = ()=>{ hintTextProcess.userWin(); gameState.addUserScore();return false;};
  return isGetByPlayer(player) ? true: handleChange();
}
return true;

}





function mainGame() {
  let ball_motion:ballMotion = new RNG(parseInt(new Date().toString())).getRandomMotion();
  
  hintTextProcess.empty();

  const svg = document.getElementById("canvas");
  const bounding: DOMRect = svg.getBoundingClientRect();
  const ball = document.getElementById("ball");
  const bound = globalSettings.canvasWidth  - globalSettings.peddlerWidth;

  const input = interval(15).pipe().subscribe(
    () => {
    
     const isGameContinue:boolean = false;

    (isReachBound(ball, bound)) ? null: handleReachBound(ball,input)? ball_motion.bounce(ball):input.unsubscribe();
    move(ball,ball_motion); 
    

    });

}

//function isGetByUser() {
//  const ball = document.getElementById("ball");
//  const user = document.getElementById("user");
//  return (parseFloat(ball.getAttribute('cy')) >= parseFloat(user.getAttribute('y')) &&
//    parseFloat(ball.getAttribute('cy')) - parseFloat(ball.getAttribute('r')) / 2
//    <= parseFloat(user.getAttribute('y')) + parseFloat(user.getAttribute('height')) + parseFloat(ball.getAttribute('r')) / 2);
//}
//
//function isGetByBot() {
//  const ball = document.getElementById("ball");
//  const bot = document.getElementById("bot");
//  return (parseFloat(ball.getAttribute('cy')) >= parseFloat(bot.getAttribute('y')) &&
//    parseFloat(ball.getAttribute('cy')) - parseFloat(ball.getAttribute('r')) / 2
//    <= parseFloat(bot.getAttribute('y')) + parseFloat(bot.getAttribute('height')) + parseFloat(ball.getAttribute('r')) / 2);
//}

function isGetByPlayer(player:HTMLElement) {
  const ball = document.getElementById("ball");
     
  return (parseFloat(ball.getAttribute('cy')) >= parseFloat(player.getAttribute('y')) &&
    parseFloat(ball.getAttribute('cy')) - parseFloat(ball.getAttribute('r')) / 2
    <= parseFloat(player.getAttribute('y')) + parseFloat(player.getAttribute('height')) + parseFloat(ball.getAttribute('r')) / 2);
}

function bounceeffect() {
  const ball = document.getElementById("ball");
  if (parseFloat(ball.getAttribute('cx')) > 310) {
    ball.setAttribute('fill', "white");
    setTimeout(function () {
      ball.setAttribute('fill', "cyan");
    }, 1000);
  }
}




function core() {

  document.addEventListener("keydown", function (event) { if (event.code == "Space") mainGame(); });
  bounceeffect();
}

function createBotPeddler() {
  const svg = document.getElementById("canvas");
  const peddler = document.createElementNS(svg.namespaceURI, 'rect');
  Object.entries({
    x: 0, y: 240,
    width: 15, height: 120,
    id: "bot",
    fill: '#FFFFFF',
  }).forEach(([key, val]) => peddler.setAttribute(key, String(val)))
  svg.appendChild(peddler);

  //const middleline = document.createElementNS(svg.namespaceURI, 'rect');
  //Object.entries({
  //  x: 298, y: 0,
  //  width: 5, height: 600,
  //  fill: '#FFFFFF',
  //  id:"middleline"
  //}).forEach(([key, val]) => middleline.setAttribute(key, String(val)))
  //svg.appendChild(middleline);
  const ball = document.createElementNS(svg.namespaceURI, 'circle');
  Object.entries({
    cx: 300, cy: 300,
    r: 15,
    fill: 'cyan',
    id: "ball"
  }).forEach(([key, val]) => ball.setAttribute(key, String(val)));
  svg.appendChild(ball);

  var newText = document.createElementNS(svg.namespaceURI, "text");

  Object.entries({
    x: 10, y: 10,
    innerText: "new",
    fontColor: "#FFFFFF",
    fill: '#FFFFFF',
    id: "middleline"
  }).forEach(([key, val]) => newText.setAttribute(key, String(val)))

  svg.appendChild(newText);
}



function createUser() {
  interface keyboardCommand {
    char: string;
    //x: number;
    y: number;
  }

  // get the svg canvas element
  const svg = document.getElementById("canvas")!;
  const rect = document.createElementNS(svg.namespaceURI, 'rect');
  Object.entries({
    id: "user",
    x: 585, y: 240,
    width: 15, height: 120,
    fill: '#FFFFFF',
  }).forEach(([key, val]) => rect.setAttribute(key, String(val)))
  svg.appendChild(rect);


  const commands: Array<keyboardCommand> = [
    { char: 'ArrowUp', y: -10},
    { char: "ArrowDown", y: 10  }
  ];

  const commandlist = commands.map((command: keyboardCommand) => fromEvent<KeyboardEvent>(document, "keydown").pipe(filter((event: KeyboardEvent) => event.key === command.char), map(() => command)));
  const move = (command: keyboardCommand) => { rect.setAttribute('y', String(Math.max(0, Math.min(parseFloat(rect.getAttribute('y')) + command.y, svg.getBoundingClientRect().height - rect.getBoundingClientRect().height)))) }
  commandlist[0].pipe(merge(commandlist[1])).subscribe((command: keyboardCommand) => move(command));
}

function pong() {


  createUser();
  createBotPeddler();
  core();

}

// the following simply runs your pong function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = () => {
    pong();
  }



