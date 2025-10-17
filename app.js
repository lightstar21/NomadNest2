const form = document.getElementById('budget-form');
const summary = document.getElementById('summary');
const entriesList = document.getElementById('entries');

let entries = JSON.parse(localStorage.getItem('budgetEntries')) || [];

function updateSummary() {
  const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const net = totalIncome - totalExpenses;
  summary.textContent = `Total Income: $${totalIncome.toFixed(2)} | Total Expenses: $${totalExpenses.toFixed(2)} | Net: $${net.toFixed(2)}`;
}

function renderEntries() {
  entriesList.innerHTML = '';
  entries.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = `${entry.category}: $${entry.amount} (${entry.type}) `;
    const del = document.createElement('button');
    del.textContent = 'X';
    del.onclick = () => {
      entries = entries.filter(e => e !== entry);
      localStorage.setItem('budgetEntries', JSON.stringify(entries));
      renderEntries();
      updateSummary();
    };
    li.appendChild(del);
    entriesList.appendChild(li);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;
  const description = document.getElementById('category').value;
  let category = description; // fallback to what you wrote

  try {
    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      mode: 'cors',
      headers: {'Access-Control-Allow-Headers': 'Authorization',
        'Authorization': 'Bearer xai-uXTt1FQgYSfSOWQLq17ffB2EEqR0pD3YLqh4nvB1V4oesLvJBFIi2Bugcf6RN4rWdNS56ykVlHIiWqZ8', // ← CHANGE THIS to your real Grok key (starts with gsk_)
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{
          role: 'user',
          content: `Categorize this expense: $${amount} ${description}. Reply with ONLY ONE WORD: gig, travel, tax, or supplies.`
        }]
      })
    });

    if (!aiResponse.ok) throw new Error(`API error: ${aiResponse.status}`);

    const data = await aiResponse.json();
    const aiGuess = data.choices[0].message.content.trim().toLowerCase();

    if (['gig', 'travel', 'tax', 'supplies'].includes(aiGuess)) {
      category = aiGuess;
    }

    console.log('Grok says:', aiGuess); // ← See this in console - should be travel or gig, not coffee
  } catch (err) {
    console.error('Grok failed:', err); // ← If you see this, fix the key
  }

  entries.push({ amount, type, category, date: new Date().toISOString() });
  localStorage.setItem('budgetEntries', JSON.stringify(entries));
  updateSummary();
  renderEntries();
  form.reset();
  document.getElementById('amount').focus();
});

updateSummary();
renderEntries();
