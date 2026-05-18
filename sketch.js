let capture;
let handPose;
let hands = [];
let options = { flipHorizontal: true }; 
let gestures = ["石頭", "剪刀", "布"];
let computerMove = "等待中...";
let gameResult = "";
let gameState = "playing"; // 遊戲狀態：playing 或 finished

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
}

function gotHands(results) {
  hands = results;
}

function draw() {
  background('666666'); // 改用深色背景，讓綠色骨架更顯眼

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

  if (gameState === "finished") {
    // 結束畫面：加上半透明遮罩與大字體結果
    push();
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);

    if (gameResult.includes("贏")) fill(0, 255, 0);      // 贏：綠色
    else if (gameResult.includes("輸")) fill(255, 0, 0); // 輸：紅色
    else fill(255, 255, 0);                             // 平手：黃色
    
    textStyle(BOLD);
    textSize(80);
    text(gameResult, width / 2, height / 2);
    
    fill(255);
    textSize(30);
    text("點擊畫面 再來一局", width / 2, height / 2 + 100);
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
    // 上方：電腦狀態
    fill(255);
    textSize(28);
    text("電腦出拳: " + computerMove, width / 2, height * 0.1);

    // 中間上方：顯示結果
    fill(255, 255, 255);
    textSize(40);
    text(result, width / 2, height * 0.18);
  } else {
    fill(255);
    textSize(28);
    text("✋ 準備好後，點擊畫面出拳！", width / 2, height * 0.1);
  }

  // 下方：玩家手勢
  fill(255, 215, 0); // 金黃色字體
  textStyle(BOLD);
  textSize(32);
  let emoji = "";
  if (playerGesture === "石頭") emoji = "✊ ";
  if (playerGesture === "剪刀") emoji = "✌️ ";
  if (playerGesture === "布") emoji = "✋ ";
  
  text("你出：" + emoji + playerGesture, width / 2, height * 0.88);
  pop();
}

// 點擊重啟遊戲
function mousePressed() {
  if (gameState === "playing") {
    // 點擊時根據當下偵測到的手勢進行判定
    let playerGesture = "偵測中...";
    if (hands.length > 0) {
      playerGesture = detectGesture(hands[0]);
    }
    computerMove = random(gestures);
    gameResult = calculateResult(playerGesture, computerMove);
    gameState = "finished";
  } else if (gameState === "finished") {
    // 結束狀態下點擊則回到準備狀態
    gameState = "playing";
    gameResult = "";
    computerMove = "等待中...";
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
