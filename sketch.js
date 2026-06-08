let capture;
let handPose;
let hands = [];
let options = { flipHorizontal: true }; 
let gestures = ["石頭", "剪刀", "布"];
let computerMove = "等待中...";
let lastChangeTime = 0;
let duration = 3000; // 每回合 3 秒
let gameResult = "";
let gameState = "playing"; // 遊戲狀態：playing 或 finished
let playerFinalMove = ""; // 用於鎖定結算時的手勢

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
  lastChangeTime = millis(); // 初始化計時器
}

function gotHands(results) {
  hands = results;
}

function draw() {
  background('#333333'); // 改用深色背景，讓綠色骨架更顯眼

  // 計算全螢幕滿版或比例顯示 (這裡維持原本的 50% 區塊置中，你可以自由調大)
  let vWidth = width * 0.8;
  let vHeight = (vWidth / 640) * 480; // 照比例縮放

  // 1. 畫出攝影機影像
  push();
  translate(width / 2, height / 2);
  image(capture, -vWidth / 2, -vHeight / 2, vWidth, vHeight);
  pop();

  // 3. 辨識玩家手勢並顯示結果
  let playerGesture = "偵測中...";
  if (hands.length > 0) {
    let hand = hands[0]; // 只取一隻手
    playerGesture = detectGesture(hand);
    
    // 繪製如同結構圖的綠色網狀骨架
    drawHandSkeleton(hand, vWidth, vHeight);
  }

  // 2. 計算倒數秒數與勝負邏輯
  if (gameState === "playing") {
    let timePassed = millis() - lastChangeTime;
    let countdown = Math.ceil((duration - timePassed) / 1000);

    // 時間到，電腦出拳並判定勝負
    if (timePassed > duration) {
      computerMove = random(gestures);
      playerFinalMove = playerGesture; // 紀錄出拳瞬間的手勢
      gameResult = calculateResult(playerGesture, computerMove);
      gameState = "finished";

      if (gameResult.includes("輸")) {
        isMathSolved = false;
        generateMathQuestion();
        userInputStr = "";
      } else {
        isMathSolved = true;
      }
    }

    // 顯示倒數數字
    if (countdown > 0) {
      push();
      fill(57, 255, 20, 200); 
      textStyle(BOLD);
      textSize(vHeight * 0.4); 
      text(countdown, width / 2, height / 2);
      pop();
    }
  } else if (gameState === "finished") {
    // 結束畫面：加上半透明遮罩與大字體結果
    push();
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);

    if (gameResult.includes("贏")) fill(0, 255, 0);      // 贏：綠色
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

  // 4. 頂部與底部 UI 資訊
  drawUI(playerGesture, gameResult);
}

// 判定勝負邏輯
function calculateResult(player, computer) {
  if (player === "判斷中" || player === "偵測中...") {
    return "沒看清楚，請重來！";
  }
  if (player === computer) {
    return "這局是 平手 🤝";
  }
  if ((player === "剪刀" && computer === "布") ||
      (player === "石頭" && computer === "剪刀") ||
      (player === "布" && computer === "石頭")) {
    return "恭喜！你贏了 🎉";
  }
  return "可惜... 你輸了 😵";
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

// 精準的手勢辨識
function detectGesture(hand) {
  // 比較指尖與手指第3關節的 Y 軸差距
  let f1 = hand.keypoints[8].y < hand.keypoints[5].y;   // 食指
  let f2 = hand.keypoints[12].y < hand.keypoints[9].y;  // 中指
  let f3 = hand.keypoints[16].y < hand.keypoints[13].y; // 無名指
  let f4 = hand.keypoints[20].y < hand.keypoints[17].y; // 小指

  let count = [f1, f2, f3, f4].filter(v => v).length;

  if (f1 && f2 && !f3 && !f4) return "剪刀"; 
  if (count >= 3) return "布";
  if (count <= 1) return "石頭";
  return "判斷中";
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
function drawUI(playerGesture, result) {
  push();
  if (gameState === "finished") {
    // 遊戲結束才顯示電腦出拳
    let compEmoji = "";
    if (computerMove === "石頭") compEmoji = "✊ ";
    if (computerMove === "剪刀") compEmoji = "✌️ ";
    if (computerMove === "布") compEmoji = "✋ ";

    fill(255);
    textSize(32);
    text("電腦出拳: " + compEmoji + computerMove, width / 2, height * 0.15);
  } else {
    // 倒數中顯示提示
    fill(200);
    textSize(24);
    text("看準倒數，準備出拳！", width / 2, height * 0.1);
  }

  // 下方：玩家手勢
  // 如果遊戲結束，顯示鎖定的手勢；否則顯示即時偵測的手勢
  let displayGesture = (gameState === "finished") ? playerFinalMove : playerGesture;

  fill(255, 215, 0); // 金黃色字體
  textStyle(BOLD);
  textSize(32);
  let emoji = "";
  if (displayGesture === "石頭") emoji = "✊ ";
  if (displayGesture === "剪刀") emoji = "✌️ ";
  if (displayGesture === "布") emoji = "✋ ";
  
  text("你出：" + emoji + displayGesture, width / 2, height * 0.88);
  pop();
}

// 點擊重啟遊戲
function mousePressed() {
  if (gameState === "finished" && isMathSolved) {
    gameState = "playing";
    lastChangeTime = millis();
    gameResult = "";
    computerMove = "等待中...";
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
