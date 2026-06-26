const DB_URL = 'https://script.google.com/macros/s/AKfycbxJOFx17UvGldGJL8CKUMUQVtw-XJSKZlGXVqpzTykHxe8RA3Li832rJAKc5250iz14eg/exec';
const TG_TOKEN = '8768061971:AAFOGV0ZcFqVSXgEnbM1SAX6d8Y_0qe1jU0';
const TG_CHAT = '7129036848';

const questions = [
  { 
    id: 'know_cbt', 
    type: 'single', 
    q: 'Have you used Sure Success CBT?', 
    sub: 'AI-powered exam practice tailored for DOU courses.', 
    options: [{t: 'Yes, I love it! 🔥'}, {t: 'Heard about it but haven’t tried'}, {t: 'No, what is that?'}] 
  },
  { 
    id: 'know_mart', 
    type: 'single', 
    q: 'Did you know about UniMemart?', 
    sub: 'DOU’s official marketplace for buying/selling and finding rooms.', 
    options: [{t: 'Yes, I use it regularly'}, {t: 'I’ve heard of it'}, {t: 'First time hearing about it'}] 
  },
  { 
    id: 'dept', 
    type: 'special', 
    q: 'Which Department are you in?', 
    sub: 'This helps us prioritize course materials in the CBT app.', 
    options: [
      {t: 'Computer Science'}, 
      {t: 'Cyber Security'}, 
      {t: 'Data Science'}, 
      {t: 'Information Technology'}, 
      {t: 'Software Engineering'}, 
      {t: 'Other (please specify below)'}
    ] 
  },
  { 
    id: 'next_tool', 
    type: 'single', 
    q: 'What should we build next?', 
    sub: 'Pick the tool that would help you most.', 
    options: [{t: 'Digital Attendance System'}, {t: 'GPA & Result Tracker'}, {t: 'Digital Student ID Card'}, {t: 'Smart Hostel Finder'}] 
  },
  { 
    id: 'matric', 
    type: 'text', 
    q: 'Matric Number (Optional)', 
    sub: 'Helps us verify and give priority to active students.', 
    placeholder: 'e.g. 250000-001' 
  },
  { 
    id: 'feedback', 
    type: 'text', 
    q: 'Any other ideas or feedback?', 
    sub: 'Tell us how we can make these apps better for you.', 
    placeholder: 'Feature requests, bugs, UI suggestions...' 
  }
];

let step = 0;
let answers = {};
let submitted = false;

// Fetch Live Poll Response Count
async function getCount() {
  try {
    const r = await fetch(DB_URL);
    const d = await r.json();
    document.getElementById('liveCount').innerText = `${d.total || '300+'} students have voted`;
  } catch(e) {
    document.getElementById('liveCount').innerText = 'Join the DOU movement';
  }
}

// Transition from Welcome Screen to Survey Loop
function startSurvey() {
  document.getElementById('landing').classList.remove('active');
  document.getElementById('survey').classList.add('active');
  renderQuestion();
}

// Dynamically Render Form Elements
function renderQuestion() {
  const q = questions[step];
  const area = document.getElementById('qArea');
  
  // Progress Bar updates
  document.getElementById('pFill').style.width = `${((step + 1) / questions.length) * 100}%`;
  document.getElementById('stepTxt').innerText = `${step + 1}/${questions.length}`;
  
  // Back button setup
  document.getElementById('bBtn').style.visibility = step === 0 ? 'hidden' : 'visible';
  
  const isLast = step === questions.length - 1;
  document.getElementById('nBtn').innerText = isLast ? 'Submit Feedback' : 'Next';
  document.getElementById('nBtn').disabled = false;

  let html = `<h1 class="q-title">${q.q}</h1><p class="q-sub">${q.sub}</p>`;
  
  if (q.type === 'single' || q.type === 'special') {
    html += `<div class="options-list">`;
    q.options.forEach(o => {
      const selected = answers[q.id] === o.t ? 'selected' : '';
      const escapedVal = o.t.replace(/'/g, "\\'");
      html += `<button class="option-btn ${selected}" onclick="selectOption('${q.id}', '${escapedVal}')">${o.t}</button>`;
    });
    
    if (q.type === 'special' && answers[q.id] === 'Other (please specify below)') {
      const priorValue = answers['other_dept'] || '';
      html += `<input type="text" id="otherInput" class="text-input" placeholder="Type your department..." value="${priorValue}" oninput="answers['other_dept']=this.value" style="margin-top:12px;">`;
    }
    html += `</div>`;
  } else {
    html += `<textarea id="textArea" class="text-input" style="min-height:160px" placeholder="${q.placeholder}" oninput="answers['${q.id}'] = this.value">${answers[q.id] || ''}</textarea>`;
  }
  
  area.innerHTML = html;
}

// Handle multiple choice clicking logic
function selectOption(id, val) {
  answers[id] = val;
  renderQuestion();
  
  // Auto progressive flow if they didn't hit manual 'Other' field
  if (val !== 'Other (please specify below)' && step < questions.length - 1) {
    setTimeout(() => nextStep(), 380);
  }
}

function nextStep() {
  if (step === 2 && answers['other_dept']) {
    answers['dept'] = answers['other_dept'];
  }
  if (step < questions.length - 1) {
    step++;
    renderQuestion();
  } else {
    submitSurvey();
  }
}

function prevStep() {
  if (step > 0) {
    step--;
    renderQuestion();
  }
}

// Form transmission outbox engine
async function submitSurvey() {
  if (submitted) return;
  submitted = true;
  
  document.getElementById('survey').classList.remove('active');
  document.getElementById('thanks').classList.add('active');
  launchConfetti();

  // Send payload to App Script Engine
  fetch(DB_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(answers) });

  // Send custom notification payload directly to Telegram Admin Core
  const msg = `🚀 <b>NEW DOU VOTE</b>\n\nCBT: ${answers.know_cbt || 'N/A'}\nMart: ${answers.know_mart || 'N/A'}\nDept: ${answers.dept || 'N/A'}\nNext: ${answers.next_tool || 'N/A'}\nMatric: ${answers.matric || '—'}\nFeedback: ${answers.feedback ? answers.feedback.substring(0,100) : 'None'}`;
  
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT, text: msg, parse_mode: 'HTML' })
  });
}

function shareResults() {
  if (navigator.share) {
    navigator.share({ title: 'DOU Studio', text: 'I just voted on the future of DOU student tools!', url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied! Share with friends.');
  }
}

// Micro Confetti UI Engine
function launchConfetti() {
  const colors = ['#8B2FC9', '#F59E0B', '#22C55E'];
  for (let i = 0; i < 80; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.top = '-10px';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.borderRadius = '2px';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.zIndex = '300';
      document.body.appendChild(confetti);
      
      const duration = Math.random() * 3000 + 2500;
      confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 800 - 400}deg)`, opacity: 0 }
      ], { duration: duration, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' });
      
      setTimeout(() => confetti.remove(), duration);
    }, i * 12);
  }
}

// Lifecycle Init hooks
window.onload = () => {
  getCount();
};
