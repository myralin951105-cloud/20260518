let capture;
let handPose;
let hands = [];
let options = { flipHorizontal: true }; // 因為我們要左右顛倒，模型輸入也設為翻轉
let gestures = ["石頭", "剪刀", "布"];
let computerMove = "等待中...";
let lastChangeTime = 0;

function preload() {
  // 載入 handPose 模型
  handPose = ml5.handPose(options);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO, { flipped: true });
  capture.size(640, 480); // 攝影機擷取標準解析度，效能較好
  capture.hide();

  // 開始偵測手勢
  handPose.detectStart(capture, gotHands);
  
  textAlign(CENTER, CENTER);
  textSize(32);
}

function gotHands(results) {
  hands = results;
}

function draw() {
  background('#cccccc');

  // 計算顯示尺寸 (螢幕寬高 50%)
  let vWidth = width * 0.5;
  let vHeight = height * 0.5;

  // 1. 畫出攝影機影像 (左右顛倒)
  push();
  translate(width / 2, height / 2);
  // 注意：capture 本身已經在 setup 設定 flipped: true，所以這裡直接畫即可
  image(capture, -vWidth / 2, -vHeight / 2, vWidth, vHeight);
  pop();

  // 2. 電腦邏輯：每 3 秒變換一次出拳
  if (millis() - lastChangeTime > 3000) {
    computerMove = random(gestures);
    lastChangeTime = millis();
  }

  // 3. 辨識玩家手勢並顯示結果
  let playerGestures = [];
  
  if (hands.length > 0) {
    for (let i = 0; i < hands.length; i++) {
      let hand = hands[i];
      let gesture = detectGesture(hand);
      playerGestures.push(hand.label + ": " + gesture);
      
      // 在畫面上標示手指位置 (需座標轉換)
      drawHandPoints(hand, vWidth, vHeight);
    }
  }

  // 4. 顯示文字 UI
  fill(0);
  text("玩家手勢: " + (playerGestures.length > 0 ? playerGestures.join(" | ") : "偵測中..."), width / 2, height * 0.8);
  
  fill(255, 0, 0);
  text("電腦出拳: " + computerMove, width / 2, height * 0.15);
  
  fill(50);
  textSize(20);
  text("倒數更換: " + Math.ceil((3000 - (millis() - lastChangeTime)) / 1000) + "s", width / 2, height * 0.22);
  textSize(32);
}

// 簡易手勢辨識邏輯
function detectGesture(hand) {
  // ml5 handPose 關節點：8(食指尖), 12(中指尖), 16(無名指尖), 20(小指尖)
  // 判斷尖端是否高於關節點 (y 座標較小)
  let f1 = hand.index_finger_tip.y < hand.index_finger_pip.y;
  let f2 = hand.middle_finger_tip.y < hand.middle_finger_pip.y;
  let f3 = hand.ring_finger_tip.y < hand.ring_finger_pip.y;
  let f4 = hand.pinky_finger_tip.y < hand.pinky_finger_pip.y;

  let count = [f1, f2, f3, f4].filter(v => v).length;

  if (count <= 1) return "石頭";
  if (count >= 4) return "布";
  if (f1 && f2 && !f3) return "剪刀";
  return "判斷中";
}

function drawHandPoints(hand, vw, vh) {
  push();
  translate(width / 2 - vw / 2, height / 2 - vh / 2);
  fill(0, 255, 0);
  noStroke();
  // 將攝影機座標 (640x480) 映射到畫布上的顯示大小
  for (let keypoint of hand.keypoints) {
    let x = map(keypoint.x, 0, capture.width, 0, vw);
    let y = map(keypoint.y, 0, capture.height, 0, vh);
    circle(x, y, 8);
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
