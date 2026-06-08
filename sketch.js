let video;
let fishes = [];
let numFishes = 6;
let score = 0;
let netRadius = 50; // 撈網的半徑

function setup() {
  createCanvas(640, 480);
  
  // 初始化視訊鏡頭
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide(); // 隱藏原生 HTML 視訊標籤，我們要在 canvas 裡畫出來
  
  // 初始化金魚的位置與速度
  for (let i = 0; i < numFishes; i++) {
    fishes.push(new Fish());
  }
}

function draw() {
  // 將視訊畫面左右反轉（鏡像），這樣互動時比較符合直覺
  translate(width, 0);
  scale(-1, 1);
  
  // 繪製視訊背景
  image(video, 0, 0, width, height);
  
  // 恢復座標系統，方便畫分數與文字（文字才不會變反的）
  translate(width, 0);
  scale(-1, 1);
  
  // 建立半透明的水藍色濾鏡，讓畫面更有魚缸/池塘的感覺
  fill(0, 150, 255, 50);
  rect(0, 0, width, height);
  
  // 更新並繪製所有的金魚
  for (let i = 0; i < fishes.length; i++) {
    fishes[i].update();
    fishes[i].display();
  }
  
  // 繪製撈網（這裡以滑鼠位置代表撈網，在影像辨識中可以對應到特定顏色的手套或物體座標）
  drawNet(mouseX, mouseY);
  
  // 顯示分數與教學提示
  drawUI();
}

// 金魚類別 (Class)
class Fish {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = random(width);
    this.y = random(height - 100, height); // 讓金魚主要游在偏下方
    this.speedX = random(1, 3) * (random() > 0.5 ? 1 : -1);
    this.speedY = random(-0.5, 0.5);
    this.size = random(30, 50);
    this.fishColor = color(random(200, 255), random(100, 150), 0); // 橘紅色系的金魚
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    
    // 碰到邊界反彈
    if (this.x < 0 || this.x > width) this.speedX *= -1;
    if (this.y < 100 || this.y > height) this.speedY *= -1;
  }
  
  display() {
    push();
    translate(this.x, this.y);
    // 根據游動方向調整魚頭朝向
    if (this.speedX < 0) {
      scale(-1, 1);
    }
    
    // 畫魚尾巴
    fill(this.fishColor);
    noStroke();
    triangle(-this.size/2, 0, -this.size, -this.size/3, -this.size, this.size/3);
    
    // 畫魚身體（橢圓）
    ellipse(0, 0, this.size, this.size * 0.6);
    
    // 畫魚眼睛
    fill(255);
    ellipse(this.size/4, -this.size/6, this.size/6);
    fill(0);
    ellipse(this.size/4, -this.size/6, this.size/12);
    pop();
  }
}

// 繪製撈網並偵測是否有撈到金魚
function drawNet(nx, ny) {
  // 偵測撈網與每條金魚的距離
  for (let i = 0; i < fishes.length; i++) {
    let d = dist(nx, ny, fishes[i].x, fishes[i].y);
    
    // 如果魚在撈網範圍內，且玩家按下按鍵/滑鼠（代表撈的動作）
    if (d < netRadius && mouseIsPressed) {
      score += 10;
      fishes[i].reset(); // 撈到後重置該金魚
    }
  }
  
  // 畫出網子外框（紅色代表準備撈，白色代表一般狀態）
  noFill();
  if (mouseIsPressed) {
    stroke(255, 0, 0);
    strokeWeight(4);
  } else {
    stroke(255);
    strokeWeight(2);
  }
  
  // 撈網的圓圈與網格線
  ellipse(nx, ny, netRadius * 2);
  line(nx - netRadius, ny, nx + netRadius, ny);
  line(nx, ny - netRadius, nx, ny + netRadius);
  
  // 網子手把
  stroke(150, 100, 50);
  strokeWeight(6);
  line(nx, ny + netRadius, nx, ny + netRadius + 40);
}

// 顯示遊戲介面文字
function drawUI() {
  fill(255);
  noStroke();
  textSize(24);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);
  
  textSize(16);
  text("遊戲說明：移動網子並【按住滑鼠】來撈起金魚！", 20, 55);
}
