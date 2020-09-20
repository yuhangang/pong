import { interval, fromEvent, from, zip, Observable, Subscription, combineLatest } from 'rxjs'
import { map, scan, filter, merge, flatMap, take, concat, takeUntil } from 'rxjs/operators'

class RNG {
  // LCG using GCC's constants

  m = 0x80000000// 2**31
  a = 1103515245
  c = 12345
  maxYangle = 20
  minYangle = 10 
  state: number
  constructor(seed:number) {
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


  getRandomMotion(): ballMotion {   //create ballMotion with the calculated random angle

    const random_num = (Math.max(Math.floor(this.nextFloat() * this.maxYangle), this.minYangle))   // generate a random number between 10 and 20
    * ((this.nextFloat() < 0.5 ? -1 : 1)); // negative or positive determiner
    return new ballMotion(random_num);
  }
  getBounceMotion(previous: ballMotion): ballMotion {
    return previous;
  }
}


class ballMotion {
  cx: number;
  cy: number;
  deg: number;
  radianToDeg = (num: number) => (num * Math.PI / 180);

  constructor(deg: number) {
    this.deg = deg;
    this.calcMovement();
  }

  calcMovement() {
    this.cx = Math.cos(this.radianToDeg(this.deg));  //calculate initial x and y velocity based on angle
    this.cy = Math.tan(this.radianToDeg(this.deg));
    
  }

  bounce(ball: HTMLElement) {
    this.deg = - this.deg;

    const paddlebounce = (user: HTMLElement) => {// handle the y velocity acceleration and bounce from paddle
      //const number = 1;
      const number = 1 + (Math.abs(parseFloat(user.getAttribute('y')) + globalSettings.paddleHeight / 2  // 1 as minimum value, the acceleration value will based on y location difference between ball and paddle
      - parseFloat(ball.getAttribute('cy'))) / (globalSettings.paddleHeight * 2));//with some multiplier to normalize the value

      this.cx = - this.cx; this.cy = this.cy * number; // x velocity will be reversed towards other paddle
    };

    const topBottomBounce = () => { this.cx = this.cx; this.cy = - this.cy; };  // y velocity will be reversed towards other bound

    parseFloat(ball.getAttribute("cy")) <= globalSettings.ballSize ||     // determine the whether it's bouncing from paddle or top/bottom
      parseFloat(ball.getAttribute("cy")) >= globalSettings.canvasHeight - globalSettings.ballSize
      ? topBottomBounce() :
      parseFloat(ball.getAttribute("cx")) < globalSettings.canvasWidth / 2 ? paddlebounce(bot) : paddlebounce(user);
  }
  toNegative(){
    this.cx = -this.cx;
  }
  
}

class settings {   // constants in the game
  /*
  control and store the settings and configuration of game
  */
  readonly paddleWidth = 15;
  readonly ballColor = "cyan";
  readonly canvasWidth = 600;
  readonly canvasHeight = 600;
  readonly winScore = 7;
  paddleHeight:number = 120;
  isMuted: boolean = false;
  ballSize:number = 12;
  ballSpeed:number = 2.5;
  paddlerTopMargin = 240;

 
  muteOrUnmuted() {  // handle changes of sound control, text shawing in button (not clickable)
    this.isMuted = !this.isMuted;
    this.isMuted ? document.getElementById("mutedButton").setAttribute("VALUE", "UNMUTE (M)") : document.getElementById("mutedButton").setAttribute("VALUE", "MUTE (M)");
    
  }

  changeBallSize(){ // handle changes of ball size, text shawing in button (not clickable)
    this.ballSize= this.ballSize ==12 ?17:12;
    this.ballSize ==17 ? document.getElementById("ballSizeButton").setAttribute("VALUE", "SMALLER BALL (P)") : document.getElementById("ballSizeButton").setAttribute("VALUE", "BIGGER BALL (P)");
    
    ball.setAttribute("r",String(this.ballSize));
  }

  changePaddleSize(){ // handle changes of paddle size, text shawing in button (not clickable)
    this.paddleHeight = this.paddleHeight ==120 ?90:120;
    this.paddlerTopMargin = this.paddlerTopMargin==240 ?255:240;
    this.paddleHeight ==90 ? document.getElementById("ballSizeButton").setAttribute("VALUE", "BIGGER PADDLE (I)") : document.getElementById("ballSizeButton").setAttribute("VALUE", "SMALLER PADDLE (I)");
    

    bot.setAttribute("height",String(this.paddleHeight));
    user.setAttribute("height",String(this.paddleHeight));
    gameState.isGameRunning?null:user.setAttribute("y", String(globalSettings.paddlerTopMargin)); // center the players' paddle if game is running
    gameState.isGameRunning?null:bot.setAttribute("y", String(globalSettings.paddlerTopMargin));
  }

  changeBallSpeed(){
    this.ballSpeed = this.ballSpeed == 2.5? 4 : 2.5;
    this.ballSpeed == 4 ? document.getElementById("ballSpeedButton").setAttribute("VALUE", "SLOWER BALL (O)") : document.getElementById("ballSpeedButton").setAttribute("VALUE", "FASTER BALL (O)");
  }
}

class sound {  // the data structure to store sound player
  sound = document.createElement("audio");
  constructor(src: string) {

    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
   
    this.sound.style.display = "none";
    document.getElementById('canvas').appendChild(this.sound);
  }


  async play(){
    this.sound.play();
    
  }

}




class hintTextSettings {
  /*
  Conytolling the text showing in bottom of the canvas
  */
  
  initialGameState() {
    const hintText = document.getElementById("hint");              //give hint to user about how to start or restart a game
    hintText.innerText = "Click space button to start the game";

  }

  empty() {
    const hintText = document.getElementById("hint");   //empty the text
    hintText.innerText = "\n";
  }

  userLose() {
    const hintText = document.getElementById("hint");
    hintText.innerText = "You lost the Game....";
    setTimeout(() => { this.initialGameState(); }, 3000);   
  }
  userWin() {
    const hintText = document.getElementById("hint");    //showing message about the winning player
    hintText.innerText = "You win the Game!";
    setTimeout(() => { this.initialGameState(); }, 3000);
  }
}


class State {
  /*
  The main state machine, controll and store the state in games
  */

  userScore: number = 0;
  botScore: number = 0;
  
  isGameRunning: boolean = false;
 
  bounceSound: sound;
  scoreSound: sound;
  botScoreElement = document.getElementById("botScore");
  userScoreElement = document.getElementById("userScore");
  

  readonly playerLose = () => { hintTextProcess.userLose(); this.reset(); return false }; 
  readonly playerWin = () => { hintTextProcess.userWin(); this.reset(); return false };

  constructor() {
    this.bounceSound = new sound("bounce.mp3");  // initialize the sound players
    this.scoreSound = new sound("score.mp3");
    
  }
  
  start(){    // showing start of game, to prohibit user from change game mode or repeatly start a new game
    this.isGameRunning = true;
  }

  addUserScore(): boolean {    //handle changes in user score, and change the value of scoreboard
    this.userScore++;
    this.userScoreElement.innerText = String(this.userScore);
    this.reCenterBall();
    ball_motion.toNegative(); // if user win the ball will move towards user in the start of next round
    return this.userScore < globalSettings.winScore ? true : this.playerWin();
  }

  addBotScore(): boolean {                 //handle changes in user score, and change the value of scoreboard
    this.botScore++;
    this.botScoreElement.innerText = String(this.botScore);
    this.reCenterBall();
    return this.botScore < globalSettings.winScore ? true : this.playerLose();

  }

  reset() {  //when game end reset the state for next game
    this.userScore = 0; this.botScore = 0; 
    this.isGameRunning = false;
    setTimeout(() => {
      this.botScoreElement.innerText = String(this.botScore);     // creating delay to showing the score of finished game 
      this.userScoreElement.innerText = String(this.userScore);
    }
      , 5000);
    
  }
 

  reCenterBall() {
    globalSettings.isMuted ? null:this.scoreSound.play(); // playing when player get mark

    ball.setAttribute("cx", String(globalSettings.canvasWidth / 2));  // center the ball
    ball.setAttribute("cy", String(globalSettings.canvasHeight / 2));
    user.setAttribute("y", String(globalSettings.paddlerTopMargin)); // center the players' paddle
    bot.setAttribute("y", String(globalSettings.paddlerTopMargin));
    ball_motion = new RNG(parseInt(new Date().toString())).getRandomMotion();   //generate a new random motion for next round
  }

  handleReachBound(ball: HTMLElement): boolean {

    const bounceEffect = () => {               
      globalSettings.isMuted ? null:this.bounceSound.play(); 

    ball.setAttribute('fill', "white");
    setTimeout(function () {
      //this.bounceSound.stop(); 
      ball.setAttribute('fill', "cyan");
    }, 100);
      return true;  // a function for playing bouncing sound
    };

  

    const handleRight = ()=>{return isGetByPlayer(user) ? bounceEffect() : this.addBotScore();};
    const handleLeft= ()=>{return isGetByPlayer(bot) ? bounceEffect() : this.addUserScore();};

    return (parseFloat(ball.getAttribute('cx')) >= globalSettings.canvasWidth - globalSettings.paddleWidth - globalSettings.paddleWidth) ?//handle the player at right side
       handleRight()
   :(parseFloat(ball.getAttribute('cx')) <= globalSettings.paddleWidth + globalSettings.ballSize) ? //handle the player at left size
      handleLeft() : bounceEffect();

}
}


function isGetByPlayer(player: HTMLElement):boolean{ //determine whether the player able to bounce the ball 

  return (parseFloat(ball.getAttribute('cy')) >= parseFloat(player.getAttribute('y')) &&  //compare the location of paddle with ball
    parseFloat(ball.getAttribute('cy')) - parseFloat(ball.getAttribute('r')) / 2
    <= parseFloat(player.getAttribute('y')) + parseFloat(player.getAttribute('height')) + parseFloat(ball.getAttribute('r')) / 4);
}


function move( ball_motion: ballMotion): boolean {
  /*
  perform moving of the ball in the game, calling by gameRound()
  */
  const bound = globalSettings.canvasWidth - globalSettings.ballSize / 2;
  ball.setAttribute('cx', String(                            // move x horizontally
    Math.min(Math.max(globalSettings.ballSpeed * ball_motion.cx + Number(ball.getAttribute('cx')), globalSettings.paddleWidth + globalSettings.ballSize),
      bound)));
  ball.setAttribute('cy', String(                             // move y horizonatally
    Math.min(globalSettings.ballSpeed  * ball_motion.cy + Number(ball.getAttribute('cy')),
      bound)));
  
   bot.setAttribute('y', String(                                   // move y
     Math.min(Math.max(globalSettings.ballSpeed * ball_motion.cy + Number(ball.getAttribute('cy')) - globalSettings.paddleHeight / 2,globalSettings.ballSize*3),
      globalSettings.canvasHeight - globalSettings.paddleHeight-globalSettings.ballSize*3)));
  return true;
}

function isReachBound(bound: number): boolean {            // function to determine the whether the ball dhould be moving or not
  return (parseFloat(ball.getAttribute('cx')) > globalSettings.paddleWidth + globalSettings.ballSize &&
    parseFloat(ball.getAttribute('cx')) < bound - globalSettings.paddleWidth &&
    parseFloat(ball.getAttribute('cy')) > globalSettings.ballSize &&
    parseFloat(ball.getAttribute('cy')) < globalSettings.canvasWidth - globalSettings.ballSize);
}


async function gameStart() {
  /*
  this function will execute once for every games, invoke the observable stream to run the gameplay
  */
  gameState.start();
  hintTextProcess.empty();
  ball_motion= new RNG(parseInt(new Date().toString())).getRandomMotion();

  

  const bound = globalSettings.canvasWidth - globalSettings.paddleWidth;

  const input = interval(10).pipe().subscribe(   // main observable stream of gameplay
    () => {
      (isReachBound(bound)) ?
       null : gameState.handleReachBound(ball)  
       ? ball_motion.bounce(ball) : input.unsubscribe();   // calling the functions in state machines, terminate the game if output is false
      move(ball_motion);  //move the ball
    });


}












function createBall() { // the ball element
  const svg = document.getElementById("canvas");


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



class Player{ // data structure to store player data initialize observable stream to control the user's paddle
  commands: Array<keyboardCommand>;
  obs:Subscription;
  idNo:number;
  id:string;
  constructor(idNo:number){
    this.idNo = idNo;
    this.id = "player"+String(idNo);
  const svg = document.getElementById("canvas")!;
  const rect = document.createElementNS(svg.namespaceURI, 'rect');
  
  Object.entries({
    id: "player"+String(idNo),
    x: idNo ==1 ?0:585, y: globalSettings.paddlerTopMargin,
    width: 15, height: 120,
    fill: '#FFFFFF',
  }).forEach(([key, val]) => rect.setAttribute(key, String(val))); // create the html element for player to canvas in constructor
  svg.appendChild(rect);

  this.commands = [
    { char:'ArrowUp', y: -10,target:this.id },  // the commande to be used in observable
    { char:"ArrowDown", y: 10,target:this.id }
  ];
  idNo == 2? this.createObservable():null;
}

 createObservable(){  // initialize observable stream to control player's paddle
  const svg = document.getElementById("canvas")!;
  const rect = document.getElementById("player"+String(this.idNo));
  const commandlist = this.commands.map((command: keyboardCommand) => fromEvent<KeyboardEvent>(document, "keydown").pipe(filter((event: KeyboardEvent) => event.key === command.char), map(() => command)));
  const movePaddle = (command: keyboardCommand) => { rect.setAttribute('y', String(Math.max(0, Math.min(parseFloat(rect.getAttribute('y')) + command.y, svg.getBoundingClientRect().height - rect.getBoundingClientRect().height)))) }
  this.obs = commandlist[0].pipe(merge(commandlist[1])).subscribe((command: keyboardCommand) => movePaddle(command));
 }
 
 removeObservable(){
   this.obs.unsubscribe();
 }
}


interface keyboardCommand {
    char: string;
    y: number;
    target:string;
  }

interface keyboardSettings{
  code:string;
  f:Function;
}
//initialize the states machine and controller
let gameState: State;
const globalSettings = new settings();
const hintTextProcess = new hintTextSettings();
let ball_motion: ballMotion;
let user1:Player;
let user2 :Player;
let user:HTMLElement;
let bot:HTMLElement;
let ball:HTMLElement;





function core() {
  /*
  the core function to control the setting and running the game
  */
  const keylist = [ // a list of keyboard actions
    {code:"KeyM",f:()=>{globalSettings.muteOrUnmuted()}},
  {code:"KeyI",f:()=>{globalSettings.changePaddleSize()}},
  {code:"KeyO",f:()=>{globalSettings.changeBallSpeed()}},
  {code:"KeyP",f:()=>{globalSettings.changeBallSize()}},
  {code:"Space",f:()=>{ gameState.isGameRunning? null:gameStart()}},
]; 
const obsnew = keylist.map(    //mapping actions to the observables
  (command: keyboardSettings) => fromEvent<KeyboardEvent>(document, "keydown").pipe(
    filter((event: KeyboardEvent) => event.code === command.code),
     map(() => command)));

  obsnew[0].pipe(merge(obsnew[1],obsnew[2],obsnew[3],obsnew[4])).subscribe((command:keyboardSettings)=>(command.f()));  //merge and subscribe the observable


}




function pong() {
  
  user1 = new Player(1);
  user2 = new Player(2);
  createBall();
  user = document.getElementById("player2");
  bot = document.getElementById("player1");
  ball = document.getElementById('ball');
  gameState = new State();
  


  
  core();

}

// the following simply runs your pong function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = () => {
    pong();
  }



