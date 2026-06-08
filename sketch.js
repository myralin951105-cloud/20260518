let capture;
let handPose;
let hands = [];
let options = { flipHorizontal: true }; 
let fishes = [];
let score = 0;
let targetScore = 5; // 目標分數，低於此分數算輸
let netSize = 100;   // 魚網大小

let lastChangeTime = 0;
let duration = 10000; // 遊戲時間 10 秒
let gameResult = "";
let gameState = "playing"; // 遊戲狀態：playing 或 finished

let mathQuestion = "";
let mathAnswer = 0;
let userInputStr = "";
let isMathSolved = true; // 是否已解開數學題

function preload() {
  handPose = ml5.handPose(options);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO, { flipped: true });
  capture.size(640, 480); 
  capture.hide();

  handPose.detectStart(capture, gotHands);
  textAlign(CENTER, CENTER);
  resetGame();
}

function resetGame() {
  score = 0;
  fishes = Array.from({ length: 10 }, () => new Fish());
  lastChangeTime = millis();
}

function gotHands(results) {
  hands = results;
}

function draw() {
  background('#0077be'); // 水藍色背景

  let vWidth = width * 0.8;
  let vHeight = (vWidth / 640) * 480;

  push();
  tint(255, 150); // 讓攝影機畫面半透明，更有水下感
  translate(width / 2, height / 2);
  image(capture, -vWidth / 2, -vHeight / 2, vWidth, vHeight);
  pop();

  if (gameState === "playing") {
    // 更新並繪製魚
    for (let fish of fishes) {
      fish.update();
      fish.display();
    }

    // 處理手部魚網
    if (hands.length > 0) {
      let hand = hands[0];
      let indexTip = hand.keypoints[8]; // 使用食指尖端
      let netX = map(indexTip.x, 0, capture.width, width / 2 - vWidth / 2, width / 2 + vWidth / 2);
      let netY = map(indexTip.y, 0, capture.height, height / 2 - vHeight / 2, height / 2 + vHeight / 2);

      // 繪製魚網
      drawNet(netX, netY);

      // 檢查是否撈到魚
      for (let i = fishes.length - 1; i >= 0; i--) {
        if (fishes[i].checkCaught(netX, netY, netSize / 2)) {
          fishes.splice(i, 1);
          score++;
          fishes.push(new Fish()); // 捕到後立刻生出一條新的
        }
      }
      drawHandSkeleton(hand, vWidth, vHeight);
    }

    let timePassed = millis() - lastChangeTime;
    let timeLeft = Math.max(0, Math.ceil((duration - timePassed) / 1000));

    if (timePassed > duration) {
      gameResult = (score >= targetScore) ? "太棒了！你是撈魚達人 🎉" : "可惜... 沒撈到足夠的魚 😵";
      gameState = "finished";

      if (gameResult.includes("輸")) {
        isMathSolved = false;
        generateMathQuestion();
        userInputStr = "";
      }
    }

    if (timeLeft > 0) {
      push();
      fill(255, 255, 255, 200); 
      textStyle(BOLD);
      textSize(vHeight * 0.4); 
      text(timeLeft, width / 2, height / 2);
      pop();
    }
  } else if (gameState === "finished") {
    // 結束畫面：加上半透明遮罩與大字體結果
    push();
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);

    if (gameResult.includes("達人")) fill(0, 255, 0);      // 贏：綠色
    else if (gameResult.includes("輸")) fill(255, 0, 0); // 輸：紅色
    else fill(255, 255, 0);                             // 平手：黃色
    
    textStyle(BOLD);
    textSize(80);
    text(gameResult, width / 2, height / 2 - 50);
    
    if (gameResult.includes("輸") && !isMathSolved) {
      // 數學挑戰介面
      fill(255);
      textSize(32);
      text("請回答數學題以解鎖重玩：", width / 2, height / 2 + 40);
      fill(255, 255, 0);
      textSize(48);
      text(mathQuestion + " " + (userInputStr || "?"), width / 2, height / 2 + 100);
      textSize(20);
      fill(200);
      text("(請輸入數字後按 Enter)", width / 2, height / 2 + 160);
    } else {
      fill(255);
      textSize(30);
      text("點擊畫面 再來一局", width / 2, height / 2 + 100);
    }
    pop();
  }

  drawUI();
}

// 產生隨機數學題
function generateMathQuestion() {
  let a = floor(random(1, 21));
  let b = floor(random(1, 21));
  let isAddition = random() > 0.5;
  if (isAddition) {
    mathQuestion = `${a} + ${b} =`;
    mathAnswer = a + b;
  } else {
    if (a < b) { let temp = a; a = b; b = temp; } // 確保結果為正
    mathQuestion = `${a} - ${b} =`;
    mathAnswer = a - b;
  }
}

// 魚類別
class Fish {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.speedX = random(-3, 3);
    this.speedY = random(-2, 2);
    this.size = random(30, 60);
    this.color = color(255, random(100), 0);
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > width) this.speedX *= -1;
    if (this.y < 0 || this.y > height) this.speedY *= -1;
  }
  display() {
    push();
    fill(this.color);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size / 2);
    // 簡單的魚尾巴
    let tailDir = this.speedX > 0 ? -1 : 1;
    triangle(this.x + (tailDir * this.size / 2), this.y, 
             this.x + (tailDir * this.size * 0.8), this.y - 10, 
             this.x + (tailDir * this.size * 0.8), this.y + 10);
    pop();
  }
  checkCaught(nx, ny, nr) {
    let d = dist(this.x, this.y, nx, ny);
    return d < nr;
  }
}

function drawNet(x, y) {
  push();
  // 網柄
  stroke(200, 150, 100);
  strokeWeight(8);
  line(x, y, x + 50, y + 80);
  
  // 網框
  stroke(255, 0, 0);
  strokeWeight(4);
  fill(255, 255, 255, 100);
  ellipse(x, y, netSize, netSize);
  
  // 網紋
  stroke(255, 255, 255, 150);
  strokeWeight(1);
  for(let i=-4; i<=4; i++) {
    line(x+i*10, y-netSize/2, x+i*10, y+netSize/2);
    line(x-netSize/2, y+i*10, x+netSize/2, y+i*10);
  }
  pop();
}

// 繪製網狀手部骨架 (完美還原 MediaPipe 綠色線條效果)
function drawHandSkeleton(hand, vw, vh) {
  push();
  // 將座標系移到攝影機畫面的左上角
  translate(width / 2 - vw / 2, height / 2 - vh / 2);
  
  stroke(57, 255, 20); // 螢光綠線條
  strokeWeight(3);
  noFill();
  
  // 完整還原手掌與五指的網狀連接路徑
  let paths = [
    [0, 1, 2, 3, 4],       // 大拇指
    [0, 5, 6, 7, 8],       // 食指
    [9, 10, 11, 12],       // 中指 (從掌心延伸)
    [13, 14, 15, 16],      // 無名指
    [0, 17, 18, 19, 20],   // 小指
    [5, 9, 13, 17],        // 指根橫向網狀連線
    [0, 9], [0, 13]        // 掌心內部延伸連線
  ];

  for (let path of paths) {
    beginShape();
    for (let idx of path) {
      let kp = hand.keypoints[idx];
      let x = map(kp.x, 0, capture.width, 0, vw);
      let y = map(kp.y, 0, capture.height, 0, vh);
      vertex(x, y);
    }
    endShape();
  }

  // 繪製圓點關節
  fill(0, 200, 255); // 關節點用淺藍或淺綠微調
  noStroke();
  for (let keypoint of hand.keypoints) {
    let x = map(keypoint.x, 0, capture.width, 0, vw);
    let y = map(keypoint.y, 0, capture.height, 0, vh);
    circle(x, y, 7);
  }
  pop();
}

// 畫出上下的文字 UI
function drawUI() {
  push();
  fill(255);
  textStyle(BOLD);
  textSize(32);
  text("目前分數：" + score, 150, 50);
  text("目標分數：" + targetScore, 150, 90);

  if (gameState === "playing") {
    fill(255, 255, 0);
    textSize(24);
    text("移動手掌，用紅色魚網捕捉金魚！", width / 2, height * 0.9);
  }
  pop();
}

// 點擊重啟遊戲
function mousePressed() {
  if (gameState === "finished" && isMathSolved) {
    gameState = "playing";
    resetGame();
    gameResult = "";
  }
}

function keyPressed() {
  if (gameState === "finished" && !isMathSolved) {
    if (keyCode === BACKSPACE) {
      userInputStr = userInputStr.slice(0, -1);
    } else if (keyCode === ENTER || keyCode === RETURN) {
      if (parseInt(userInputStr) === mathAnswer) {
        isMathSolved = true;
      } else {
        userInputStr = ""; // 答錯就清空
      }
    } else if (key >= '0' && key <= '9') {
      userInputStr += key;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
