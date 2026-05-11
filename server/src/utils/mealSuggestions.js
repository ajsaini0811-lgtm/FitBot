// Smart meal suggestions based on remaining calories & macros
const MEALS = [
  // High protein, low cal
  { name: '2 boiled eggs', cal: 140, protein: 12, carbs: 1, fat: 10, tags: ['breakfast', 'snack', 'high-protein'] },
  { name: 'Greek yogurt (200g)', cal: 130, protein: 17, carbs: 8, fat: 3, tags: ['breakfast', 'snack', 'high-protein'] },
  { name: 'Chicken breast (150g)', cal: 165, protein: 31, carbs: 0, fat: 4, tags: ['lunch', 'dinner', 'high-protein'] },
  { name: 'Tuna can (185g)', cal: 130, protein: 30, carbs: 0, fat: 1, tags: ['lunch', 'snack', 'high-protein'] },
  { name: 'Cottage cheese (150g)', cal: 120, protein: 18, carbs: 5, fat: 3, tags: ['snack', 'high-protein'] },
  { name: 'Paneer (100g)', cal: 265, protein: 18, carbs: 3, fat: 20, tags: ['lunch', 'dinner', 'high-protein'] },
  { name: 'Whey protein shake', cal: 120, protein: 25, carbs: 5, fat: 1, tags: ['snack', 'post-workout', 'high-protein'] },

  // Balanced
  { name: 'Oats with banana (1 cup)', cal: 300, protein: 10, carbs: 55, fat: 5, tags: ['breakfast'] },
  { name: '2 idlis with sambar', cal: 200, protein: 6, carbs: 38, fat: 2, tags: ['breakfast', 'lunch'] },
  { name: 'Dal rice (1 bowl)', cal: 350, protein: 12, carbs: 60, fat: 5, tags: ['lunch', 'dinner'] },
  { name: 'Roti with sabzi (2 rotis)', cal: 280, protein: 8, carbs: 45, fat: 7, tags: ['lunch', 'dinner'] },
  { name: 'Brown rice + chicken curry', cal: 480, protein: 35, carbs: 52, fat: 10, tags: ['lunch', 'dinner'] },
  { name: 'Egg white omelette (3 eggs)', cal: 100, protein: 18, carbs: 2, fat: 1, tags: ['breakfast', 'lunch'] },
  { name: 'Upma (1 bowl)', cal: 230, protein: 6, carbs: 40, fat: 6, tags: ['breakfast'] },
  { name: 'Poha (1 bowl)', cal: 250, protein: 5, carbs: 45, fat: 6, tags: ['breakfast'] },
  { name: 'Quinoa salad (1 bowl)', cal: 320, protein: 12, carbs: 45, fat: 8, tags: ['lunch', 'dinner'] },

  // Low cal snacks
  { name: 'Apple', cal: 80, protein: 0, carbs: 21, fat: 0, tags: ['snack'] },
  { name: 'Banana', cal: 105, protein: 1, carbs: 27, fat: 0, tags: ['snack', 'pre-workout'] },
  { name: 'Handful of almonds (28g)', cal: 160, protein: 6, carbs: 6, fat: 14, tags: ['snack'] },
  { name: 'Sprouts salad (1 bowl)', cal: 130, protein: 9, carbs: 20, fat: 1, tags: ['snack', 'lunch'] },
  { name: 'Buttermilk (1 glass)', cal: 40, protein: 3, carbs: 5, fat: 1, tags: ['snack', 'lunch'] },
  { name: 'Fruit salad (1 bowl)', cal: 100, protein: 1, carbs: 25, fat: 0, tags: ['snack', 'breakfast'] },
];

function getHourTag() {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 18) return 'snack';
  return 'dinner';
}

function suggest({ remainingCal, remainingProtein }) {
  if (remainingCal <= 0) {
    return { message: "🎯 You've hit your calorie goal for today! Great discipline.", suggestions: [] };
  }

  const mealTime = getHourTag();

  // Score each meal
  const scored = MEALS.map(meal => {
    if (meal.cal > remainingCal + 50) return null; // too many calories

    let score = 0;
    // Prefer meals that fit the time of day
    if (meal.tags.includes(mealTime)) score += 3;
    // Prefer high protein if user needs more
    if (remainingProtein > 20 && meal.protein >= 15) score += 2;
    // Prefer smaller meals if low remaining
    if (remainingCal < 300 && meal.cal < 200) score += 2;
    // Penalise going over by more than 20 cal
    if (meal.cal > remainingCal) score -= 2;

    return { ...meal, score };
  }).filter(Boolean);

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);

  const timeLabel = { breakfast: 'breakfast', lunch: 'lunch', snack: 'a snack', dinner: 'dinner' }[mealTime];
  return {
    message: `You have ~${Math.round(remainingCal)} kcal left. Here are some ideas for ${timeLabel}:`,
    suggestions: top.map(m => ({
      name: m.name,
      cal: m.cal,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
    })),
  };
}

module.exports = { suggest };
