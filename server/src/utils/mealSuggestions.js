// Smart meal suggestions — goal-aware, time-aware, macro-aware
// Each meal: { name, emoji, cal, protein, carbs, fat, tags, goalTags }
// goalTags: 'lose' | 'maintain' | 'gain'

const MEALS = [
  // ── Breakfast ────────────────────────────────────────────────────────────
  { name: 'Oats with banana & milk',      emoji:'🥣', cal:310, protein:11, carbs:57, fat:5,  tags:['breakfast'],           goal:['maintain','gain'] },
  { name: 'Masala oats (1 bowl)',          emoji:'🥣', cal:200, protein:7,  carbs:35, fat:4,  tags:['breakfast'],           goal:['lose','maintain'] },
  { name: '2 boiled eggs + brown toast',  emoji:'🥚', cal:240, protein:17, carbs:22, fat:9,  tags:['breakfast'],           goal:['maintain','lose'] },
  { name: 'Egg white omelette (3 eggs)',   emoji:'🍳', cal:100, protein:18, carbs:2,  fat:1,  tags:['breakfast','lunch'],   goal:['lose'] },
  { name: '3 scrambled eggs + toast',     emoji:'🍳', cal:320, protein:22, carbs:24, fat:14, tags:['breakfast'],           goal:['maintain','gain'] },
  { name: '2 idlis with sambar',          emoji:'🍚', cal:200, protein:6,  carbs:38, fat:2,  tags:['breakfast'],           goal:['lose','maintain'] },
  { name: 'Masala dosa (1 piece)',        emoji:'🫓', cal:220, protein:5,  carbs:36, fat:7,  tags:['breakfast'],           goal:['maintain'] },
  { name: 'Besan chilla (2 pieces)',      emoji:'🫓', cal:180, protein:9,  carbs:22, fat:5,  tags:['breakfast','snack'],   goal:['lose','maintain'] },
  { name: 'Moong dal chilla (2 pieces)',  emoji:'🫓', cal:160, protein:10, carbs:20, fat:3,  tags:['breakfast','snack'],   goal:['lose','maintain'] },
  { name: 'Poha with peanuts (1 bowl)',   emoji:'🍽️', cal:270, protein:7,  carbs:45, fat:7,  tags:['breakfast'],           goal:['maintain'] },
  { name: 'Upma with veggies (1 bowl)',   emoji:'🍽️', cal:230, protein:6,  carbs:40, fat:6,  tags:['breakfast'],           goal:['lose','maintain'] },
  { name: 'Greek yogurt + berries',       emoji:'🫙', cal:140, protein:14, carbs:14, fat:2,  tags:['breakfast','snack'],   goal:['lose','maintain'] },
  { name: 'Overnight oats (jar)',         emoji:'🥣', cal:350, protein:14, carbs:55, fat:8,  tags:['breakfast'],           goal:['maintain','gain'] },
  { name: 'Peanut butter toast (2 slices)',emoji:'🍞',cal:340, protein:13, carbs:38, fat:16, tags:['breakfast'],           goal:['maintain','gain'] },
  { name: 'Banana + whey protein shake',  emoji:'🥤', cal:260, protein:28, carbs:30, fat:2,  tags:['breakfast','post-workout'],goal:['maintain','gain'] },

  // ── Lunch ────────────────────────────────────────────────────────────────
  { name: 'Dal rice (1 plate)',           emoji:'🍛', cal:350, protein:12, carbs:60, fat:5,  tags:['lunch','dinner'],      goal:['maintain'] },
  { name: 'Brown rice + dal + sabzi',     emoji:'🍛', cal:380, protein:14, carbs:62, fat:6,  tags:['lunch','dinner'],      goal:['maintain'] },
  { name: '2 rotis + dal + sabzi',        emoji:'🫓', cal:320, protein:11, carbs:52, fat:7,  tags:['lunch','dinner'],      goal:['lose','maintain'] },
  { name: 'Chicken curry + 1 roti',       emoji:'🍗', cal:380, protein:30, carbs:28, fat:14, tags:['lunch','dinner'],      goal:['maintain','gain'] },
  { name: 'Grilled chicken salad',        emoji:'🥗', cal:280, protein:35, carbs:12, fat:8,  tags:['lunch'],               goal:['lose','maintain'] },
  { name: 'Egg fried rice (1 bowl)',      emoji:'🍳', cal:400, protein:16, carbs:55, fat:12, tags:['lunch','dinner'],      goal:['maintain','gain'] },
  { name: 'Paneer bhurji + 2 rotis',      emoji:'🧀', cal:450, protein:22, carbs:44, fat:20, tags:['lunch','dinner'],      goal:['maintain','gain'] },
  { name: 'Rajma chawal (1 plate)',       emoji:'🍛', cal:420, protein:16, carbs:72, fat:6,  tags:['lunch','dinner'],      goal:['maintain'] },
  { name: 'Chole with 1 bhatura',        emoji:'🍛', cal:480, protein:14, carbs:70, fat:16, tags:['lunch'],               goal:['gain'] },
  { name: 'Palak paneer + 1 roti',       emoji:'🥬', cal:310, protein:14, carbs:24, fat:18, tags:['lunch','dinner'],      goal:['maintain'] },
  { name: 'Quinoa salad with chickpeas', emoji:'🥗', cal:340, protein:14, carbs:52, fat:8,  tags:['lunch'],               goal:['lose','maintain'] },
  { name: 'Tuna salad wrap',             emoji:'🌯', cal:300, protein:28, carbs:28, fat:7,  tags:['lunch'],               goal:['lose','maintain'] },
  { name: 'Chicken breast + brown rice', emoji:'🍗', cal:440, protein:40, carbs:50, fat:6,  tags:['lunch','dinner'],      goal:['maintain','gain'] },
  { name: 'Fish curry + rice (1 bowl)',   emoji:'🐟', cal:380, protein:28, carbs:38, fat:10, tags:['lunch','dinner'],      goal:['maintain'] },
  { name: 'Egg curry + 2 rotis',         emoji:'🥚', cal:380, protein:20, carbs:40, fat:16, tags:['lunch','dinner'],      goal:['maintain'] },
  { name: 'Sprouts salad + curd',        emoji:'🌱', cal:180, protein:11, carbs:26, fat:2,  tags:['lunch','snack'],       goal:['lose'] },
  { name: 'Lentil soup (2 bowls)',        emoji:'🍲', cal:220, protein:14, carbs:32, fat:3,  tags:['lunch','dinner'],      goal:['lose','maintain'] },

  // ── Dinner ───────────────────────────────────────────────────────────────
  { name: 'Grilled fish + veggies',       emoji:'🐟', cal:280, protein:34, carbs:12, fat:8,  tags:['dinner'],              goal:['lose','maintain'] },
  { name: 'Chicken soup (1 bowl)',         emoji:'🍲', cal:180, protein:22, carbs:10, fat:5,  tags:['dinner','snack'],      goal:['lose','maintain'] },
  { name: 'Paneer tikka (100g) + salad',  emoji:'🧀', cal:320, protein:18, carbs:10, fat:22, tags:['dinner'],              goal:['maintain'] },
  { name: 'Khichdi (1 bowl)',             emoji:'🍲', cal:280, protein:9,  carbs:48, fat:5,  tags:['dinner'],              goal:['lose','maintain'] },
  { name: 'Vegetable soup + brown bread', emoji:'🍲', cal:200, protein:6,  carbs:35, fat:3,  tags:['dinner'],              goal:['lose'] },
  { name: 'Mutton curry + 1 roti',        emoji:'🍖', cal:460, protein:30, carbs:28, fat:24, tags:['dinner'],              goal:['maintain','gain'] },
  { name: 'Butter chicken + 2 rotis',     emoji:'🍗', cal:520, protein:32, carbs:44, fat:20, tags:['dinner'],              goal:['maintain','gain'] },
  { name: 'Biryani (1 plate)',            emoji:'🍛', cal:520, protein:22, carbs:70, fat:16, tags:['dinner'],              goal:['gain'] },
  { name: 'Mixed veg curry + 2 rotis',    emoji:'🥘', cal:300, protein:9,  carbs:50, fat:7,  tags:['dinner'],              goal:['lose','maintain'] },

  // ── Snacks ───────────────────────────────────────────────────────────────
  { name: 'Handful of almonds (28g)',      emoji:'🌰', cal:160, protein:6,  carbs:6,  fat:14, tags:['snack'],               goal:['lose','maintain'] },
  { name: 'Apple + peanut butter (1 tbsp)',emoji:'🍎', cal:160, protein:4,  carbs:24, fat:8,  tags:['snack'],               goal:['lose','maintain'] },
  { name: 'Banana',                        emoji:'🍌', cal:105, protein:1,  carbs:27, fat:0,  tags:['snack','pre-workout'], goal:['maintain','gain'] },
  { name: 'Buttermilk (1 glass)',          emoji:'🥛', cal:40,  protein:3,  carbs:5,  fat:1,  tags:['snack'],               goal:['lose'] },
  { name: 'Curd (200g) + fruits',          emoji:'🫙', cal:180, protein:8,  carbs:28, fat:4,  tags:['snack'],               goal:['maintain'] },
  { name: 'Whey protein shake',            emoji:'🥤', cal:120, protein:25, carbs:5,  fat:1,  tags:['snack','post-workout'],goal:['lose','maintain','gain'] },
  { name: 'Makhana (foxnuts, 30g)',        emoji:'🌾', cal:104, protein:3,  carbs:23, fat:0,  tags:['snack'],               goal:['lose','maintain'] },
  { name: 'Boiled chickpeas (1 cup)',      emoji:'🫘', cal:180, protein:10, carbs:30, fat:3,  tags:['snack','lunch'],       goal:['lose','maintain'] },
  { name: 'Fruit salad (1 bowl)',          emoji:'🍓', cal:100, protein:1,  carbs:25, fat:0,  tags:['snack','breakfast'],   goal:['lose','maintain'] },
  { name: 'Peanuts (30g)',                 emoji:'🥜', cal:170, protein:8,  carbs:5,  fat:14, tags:['snack'],               goal:['maintain','gain'] },
  { name: 'Cottage cheese + cucumber',    emoji:'🥒', cal:130, protein:16, carbs:6,  fat:3,  tags:['snack'],               goal:['lose','maintain'] },
  { name: 'Dark chocolate (2 squares)',    emoji:'🍫', cal:100, protein:1,  carbs:12, fat:6,  tags:['snack'],               goal:['maintain'] },

  // ── Post-Workout ─────────────────────────────────────────────────────────
  { name: 'Chicken + sweet potato',       emoji:'🍗', cal:400, protein:38, carbs:38, fat:6,  tags:['post-workout','dinner'],goal:['maintain','gain'] },
  { name: 'Paneer + banana shake',        emoji:'🥤', cal:340, protein:20, carbs:40, fat:10, tags:['post-workout','snack'], goal:['maintain','gain'] },
  { name: 'Egg whites (4) + toast',       emoji:'🥚', cal:200, protein:24, carbs:22, fat:2,  tags:['post-workout','breakfast'],goal:['lose','maintain'] },
  { name: 'Rice cakes + peanut butter',   emoji:'🍞', cal:220, protein:7,  carbs:30, fat:9,  tags:['post-workout','snack'], goal:['maintain'] },
  { name: 'Tuna + rice (1 bowl)',          emoji:'🐟', cal:350, protein:32, carbs:42, fat:3,  tags:['post-workout','lunch'], goal:['maintain','gain'] },

  // ── High Cal / Bulking ────────────────────────────────────────────────────
  { name: 'Mutton biryani (1 plate)',      emoji:'🍖', cal:620, protein:28, carbs:72, fat:22, tags:['dinner'],              goal:['gain'] },
  { name: 'Peanut butter banana smoothie',emoji:'🥤', cal:480, protein:18, carbs:58, fat:18, tags:['breakfast','snack'],   goal:['gain'] },
  { name: 'Mass gainer shake',            emoji:'🥤', cal:600, protein:30, carbs:90, fat:6,  tags:['post-workout','snack'], goal:['gain'] },
  { name: 'Chicken + pasta bowl',         emoji:'🍝', cal:560, protein:42, carbs:60, fat:12, tags:['lunch','dinner'],      goal:['gain'] },
];

// ── Time of day ──────────────────────────────────────────────────────────────
function getTimeSlot() {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return { slot: 'breakfast',     label: 'breakfast' };
  if (h >= 11 && h < 15) return { slot: 'lunch',         label: 'lunch' };
  if (h >= 15 && h < 18) return { slot: 'snack',         label: 'an afternoon snack' };
  if (h >= 18 && h < 22) return { slot: 'dinner',        label: 'dinner' };
  return                         { slot: 'snack',         label: 'a late-night snack' };
}

// ── Reason tags ───────────────────────────────────────────────────────────────
function buildReasons(meal, { remainingCal, remainingProtein, goal, slot }) {
  const reasons = [];
  if (meal.tags.includes(slot))         reasons.push('⏰ Right time');
  if (meal.protein >= 20)               reasons.push('🥩 High protein');
  if (meal.cal <= remainingCal * 0.4)  reasons.push('✅ Fits budget');
  if (goal === 'lose' && meal.cal < 200) reasons.push('🔥 Low calorie');
  if (goal === 'gain' && meal.cal > 400) reasons.push('💪 High energy');
  if (meal.tags.includes('post-workout')) reasons.push('⚡ Post-workout');
  if (remainingProtein > 20 && meal.protein >= 15) reasons.push('🎯 Protein boost');
  return reasons.slice(0, 3);
}

// ── Main suggest function ─────────────────────────────────────────────────────
function suggest({ remainingCal, remainingProtein, goal = 'maintain' }) {
  if (remainingCal <= 0) {
    return {
      message: "🎯 You've hit your calorie goal for today! Great discipline.",
      label: '',
      suggestions: [],
    };
  }

  const { slot, label } = getTimeSlot();

  // Score each meal
  const scored = MEALS.map(meal => {
    // Hard filter: skip if way over remaining (allow slight overflow)
    if (meal.cal > remainingCal + 80) return null;

    let score = 0;

    // Time of day fit
    if (meal.tags.includes(slot))                    score += 4;

    // Goal fit
    if (meal.goal.includes(goal))                    score += 3;

    // Protein priority
    if (remainingProtein > 20 && meal.protein >= 15) score += 3;
    if (remainingProtein > 40 && meal.protein >= 25) score += 2;

    // Calorie fit
    const calRatio = meal.cal / remainingCal;
    if (calRatio >= 0.2 && calRatio <= 0.6)          score += 2;  // good fit
    if (meal.cal > remainingCal)                      score -= 3;  // slightly over

    // Low remaining → prefer lighter options
    if (remainingCal < 250 && meal.cal < 150)         score += 2;

    return { ...meal, score };
  }).filter(Boolean);

  scored.sort((a, b) => b.score - a.score);

  // Pick top 4, deduplicate by calorie band to ensure variety
  const seen = new Set();
  const top = [];
  for (const m of scored) {
    const band = Math.round(m.cal / 100);
    if (!seen.has(band) && top.length < 4) {
      seen.add(band);
      top.push(m);
    }
  }
  // If fewer than 3 variety picks, just fill from scored
  if (top.length < 3) {
    for (const m of scored) {
      if (!top.includes(m) && top.length < 4) top.push(m);
    }
  }

  return {
    message: `You have ~${Math.round(remainingCal)} kcal left today.`,
    label: `Ideas for ${label}`,
    suggestions: top.map(m => ({
      name:    m.name,
      emoji:   m.emoji,
      cal:     m.cal,
      protein: m.protein,
      carbs:   m.carbs,
      fat:     m.fat,
      reasons: buildReasons(m, { remainingCal, remainingProtein, goal, slot }),
    })),
  };
}

module.exports = { suggest };
