
const foods = [
    { id: 1, name: '🥦 บรอกโคลี', type: 'veggie', points: 10 },
    { id: 2, name: '🥕 แครอท', type: 'veggie', points: 10 },
    { id: 3, name: '🍎 แอปเปิล', type: 'veggie', points: 10 },
    { id: 4, name: '🍗 อกไก่', type: 'protein', points: 15 },
    { id: 5, name: '🐟 ปลาแซลมอน', type: 'protein', points: 15 },
    { id: 6, name: '🥚 ไข่ต้ม', type: 'protein', points: 15 },
    { id: 7, name: '🍚 ข้าวกล้อง', type: 'carb', points: 15 },
    { id: 8, name: '🍞 ขนมปังโฮลวีต', type: 'carb', points: 15 },
    { id: 9, name: '🥔 มันฝรั่ง', type: 'carb', points: 15 },
    { id: 10, name: '🍩 โดนัท', type: 'junk', points: -20 },
    { id: 11, name: '🍟 เฟรนช์ฟรายส์', type: 'junk', points: -20 },
    { id: 12, name: '🥬 ผักโขม', type: 'veggie', points: 10 },
    { id: 13, name: '🌽 ข้าวโพด', type: 'carb', points: 10 },
    { id: 14, name: '🍤 กุ้งต้ม', type: 'protein', points: 15 },
    { id: 15, name: '🍕 พิซซ่า', type: 'junk', points: -20 }
];

let totalScore = 0;
let timeLeft = 30;
let timerInterval;
let gameActive = true;

// --- ระบบเสียง (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    
    if (type === 'correct') {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'wrong') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    }
}

// --- ฟังก์ชันหลัก ---
function initGame() {
    gameActive = true;
    timeLeft = 30;
    totalScore = 0;
    document.getElementById('total-score').innerText = totalScore;
    document.getElementById('timer').innerText = timeLeft;
    document.getElementById('feedback').innerText = "";
    document.querySelectorAll('.items-container').forEach(c => c.innerHTML = '');
    
    clearInterval(timerInterval);
    startTimer();
    renderFood();
}

function renderFood() {
    const foodBin = document.getElementById('food-source');
    foodBin.innerHTML = '<h2>วัตถุดิบ</h2>';
    
    // สุ่มอาหาร 8 อย่างมาแสดงจากรายการทั้งหมด
    const shuffled = [...foods].sort(() => 0.5 - Math.random()).slice(0, 8);
    
    shuffled.forEach(food => {
        const foodEl = document.createElement('div');
        foodEl.className = 'food-item';
        foodEl.id = 'food-' + Math.random().toString(36).substr(2, 9);
        foodEl.draggable = true;
        foodEl.innerText = food.name;
        foodEl.dataset.type = food.type;
        foodEl.dataset.points = food.points;
        
        foodEl.addEventListener('dragstart', handleDragStart);
        foodBin.appendChild(foodEl);
    });
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
        if (timeLeft <= 0) endGame("⏰ หมดเวลา! ได้คะแนนไปทั้งหมด " + totalScore + " แต้ม");
    }, 1000);
}

function handleDragStart(e) {
    if (!gameActive) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
        id: e.target.id,
        type: e.target.dataset.type,
        points: e.target.dataset.points,
        name: e.target.innerText
    }));
}

function handleDrop(e) {
    e.preventDefault();
    if (!gameActive) return;

    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const zoneType = e.currentTarget.dataset.type;
    const itemsContainer = e.currentTarget.querySelector('.items-container');

    // 1. ตรวจสอบว่าวางถูกที่ไหม
    if (data.type === zoneType) {
        totalScore += parseInt(data.points);
        addVisualItem(itemsContainer, data.name, 'correct');
        playSound('correct');
    } else {
        // วางผิดโซนหรืออาหารขยะ หักคะแนนเล็กน้อย
        totalScore -= 5;
        addVisualItem(itemsContainer, data.name, 'wrong');
        playSound('wrong');
    }

    // 2. ลบอาหารที่ถูกเลือกออกจากฝั่งซ้าย
    const draggedEl = document.getElementById(data.id);
    if (draggedEl) draggedEl.remove();

    // 3. ตรวจสอบว่าถ้าอาหารหมด ให้เติมของใหม่
    const remaining = document.querySelectorAll('.food-item');
    if (remaining.length === 0 && gameActive) {
        renderFood();
    }

    document.getElementById('total-score').innerText = totalScore;
    
    // ชนะที่ 100 คะแนน
    if (totalScore >= 100) {
        endGame("🎉 ยินดีด้วย! คุณจัดจานอาหารสุขภาพได้สำเร็จ!");
    }
}

function endGame(msg) {
    gameActive = false;
    clearInterval(timerInterval);
    document.getElementById('feedback').innerText = msg;
    document.getElementById('feedback').style.color = totalScore >= 100 ? "green" : "#e67e22";
}

function addVisualItem(container, name, className) {
    const item = document.createElement('span');
    item.innerText = name.split(' ')[0];
    item.className = `mini-item ${className}`;
    container.appendChild(item);
}

// ตั้งค่าโซนรับอาหาร
document.querySelectorAll('.zone').forEach(zone => {
    zone.addEventListener('dragover', e => e.preventDefault());
    zone.addEventListener('drop', handleDrop);
});

initGame();
function resetGame() {
    // ปลุกระบบเสียงเผื่อกรณีที่เบราว์เซอร์สั่งหยุดไว้
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    initGame(); 
}