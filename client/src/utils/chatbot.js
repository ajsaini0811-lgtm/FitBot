import { searchFoods, calcNutrition } from './foods';
import { getByCategory } from './exercises';

// ─── State Helpers ─────────────────────────────────────────────

function bot(content, quickReplies = null, meta = {}) {
  return { role: 'bot', content, quickReplies, ...meta };
}

function parseNumber(text) {
  const n = parseFloat(String(text).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

function parseSetsReps(text) {
  const m = String(text).match(/(\d+)\s*[xX×]\s*(\d+)/);
  if (m) return { sets: parseInt(m[1]), reps: parseInt(m[2]) };
  return null;
}

// Cooking method chips shown to user → normalized key for API
const COOKING_METHODS = [
  '🥗 Raw / Fresh',
  '♨️ Boiled / Steamed',
  '🔥 Grilled / Roasted',
  '🫕 Curried / Cooked',
  '🍳 Fried',
  '🔆 Baked',
];

function normalizeCookingMethod(input) {
  const i = input.toLowerCase();
  if (i.includes('raw') || i.includes('fresh'))           return 'raw';
  if (i.includes('boil') || i.includes('steam'))         return 'boiled';
  if (i.includes('grill') || i.includes('roast'))        return 'grilled';
  if (i.includes('fry') || i.includes('fried') || i.includes('🍳')) return 'fried';
  if (i.includes('bak') || i.includes('🔆'))             return 'baked';
  if (i.includes('curri') || i.includes('cook') || i.includes('🫕')) return 'curried';
  return 'cooked';
}

// Apply cooking method multiplier to locally-known food nutrition
const LOCAL_METHOD_MULT = {
  raw:     { cal: 1.00, fat: 1.00 },
  boiled:  { cal: 0.85, fat: 0.90 },
  grilled: { cal: 0.88, fat: 0.80 },
  baked:   { cal: 0.90, fat: 0.95 },
  fried:   { cal: 1.40, fat: 1.80 },
  curried: { cal: 1.18, fat: 1.40 },
  cooked:  { cal: 1.05, fat: 1.05 },
};

function applyMethodToNutrition(nutrition, method) {
  const mult = LOCAL_METHOD_MULT[method] || LOCAL_METHOD_MULT.cooked;
  return {
    calories: Math.round(nutrition.calories * mult.cal),
    proteinG: nutrition.proteinG,
    carbsG:   nutrition.carbsG,
    fatG:     Math.round(nutrition.fatG * mult.fat * 10) / 10,
  };
}

// ─── Initial State ─────────────────────────────────────────────

export function getInitialState() {
  return {
    name: 'IDLE',
    mealType: null,
    pendingFood: null,
    pendingExercises: [],
    pendingExerciseCategory: null,
    pendingExercise: null,
    pendingSets: null,
    pendingReps: null,
    // food flow
    selectedFood: null,       // known food object from local DB
    unknownFoodName: null,    // user-typed food name (not in DB)
    pendingGrams: null,
    pendingCookingMethod: null,
    foodResults: null,
  };
}

// ─── State Machine ─────────────────────────────────────────────

export function transition(state, input, userData = {}) {
  const name = userData.name ? userData.name.split(' ')[0] : 'there';

  switch (state.name) {

    // ── IDLE → auto-welcome ──────────────────────────────────
    case 'IDLE': {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      return {
        newState: { ...state, name: 'MAIN_MENU' },
        botMessages: [
          bot(
            `${greeting}, ${name}! 💪 I'm FitBot, your fitness companion.\n\nYou can log **any food** — just type the name and I'll ask for the quantity and how it was cooked!\n\nWhat would you like to do?`,
            ['🍽️ Log a Meal', '🏋️ Log Workout', '📊 Today\'s Summary', '⚖️ Update Weight']
          ),
        ],
      };
    }

    // ── MAIN_MENU ────────────────────────────────────────────
    case 'MAIN_MENU': {
      const i = input.toLowerCase();
      if (i.includes('meal') || i.includes('food') || i.includes('eat') || i.includes('log') || i.includes('🍽')) {
        return {
          newState: { ...state, name: 'SELECT_MEAL_TYPE' },
          botMessages: [bot('Which meal are you logging?', ['☀️ Breakfast', '🌤️ Lunch', '🌙 Dinner', '🍎 Snack'])],
        };
      }
      if (i.includes('workout') || i.includes('exercise') || i.includes('gym') || i.includes('🏋')) {
        return {
          newState: { ...state, name: 'SELECT_EXERCISE_TYPE' },
          botMessages: [bot('Let\'s log your workout! What type?', ['💪 Strength Training', '🏃 Cardio', '🧘 Flexibility / Yoga'])],
        };
      }
      if (i.includes('summary') || i.includes('today') || i.includes('📊')) {
        return {
          newState: { ...state, name: 'SHOW_SUMMARY' },
          botMessages: [bot('Fetching your stats for today…')],
          pendingApiCall: async (api) => {
            const res = await api.get('/stats/today');
            return res.data;
          },
          apiSuccessState: 'SUMMARY_DONE',
        };
      }
      if (i.includes('weight') || i.includes('⚖')) {
        return {
          newState: { ...state, name: 'LOG_WEIGHT' },
          botMessages: [bot('What\'s your weight today? (in kg)', null, { inputMode: 'free' })],
        };
      }
      return {
        newState: { ...state, name: 'MAIN_MENU' },
        botMessages: [bot('What would you like to do?', ['🍽️ Log a Meal', '🏋️ Log Workout', '📊 Today\'s Summary', '⚖️ Update Weight'])],
      };
    }

    // ── MEAL TYPE ────────────────────────────────────────────
    case 'SELECT_MEAL_TYPE': {
      const mealMap = {
        breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack: 'snack',
        '☀️': 'breakfast', '🌤️': 'lunch', '🌙': 'dinner', '🍎': 'snack',
      };
      const key = Object.keys(mealMap).find(k => input.toLowerCase().includes(k));
      const mealType = mealMap[key] || 'snack';
      return {
        newState: { ...state, name: 'SEARCH_FOOD', mealType },
        botMessages: [bot(
          `What did you eat for ${mealType}? 🍽️\n\nType **any food name** — rice, fish, paneer, pizza, anything!`,
          null,
          { inputMode: 'free' }
        )],
      };
    }

    // ── FOOD SEARCH ──────────────────────────────────────────
    case 'SEARCH_FOOD': {
      const results = searchFoods(input);

      // ── FOUND in local DB ─────────────────────────────────
      if (results.length > 0) {
        if (results.length === 1) {
          // Single match — skip the list, go straight to grams
          return {
            newState: { ...state, name: 'ASK_GRAMS', selectedFood: results[0], unknownFoodName: null },
            botMessages: [bot(
              `Found it! How much **${results[0].name}** did you have?`,
              ['50g', '100g', '150g', '200g', '250g', '300g'],
              { inputMode: 'free' }
            )],
          };
        }
        const opts = results.map(f => `${f.name} (${f.per100.cal} kcal/100g)`);
        opts.push('🔍 Not in list — use my food name');
        return {
          newState: { ...state, name: 'SELECT_FOOD', foodResults: results, unknownFoodName: input.trim() },
          botMessages: [bot('Which one matches what you had?', opts)],
        };
      }

      // ── NOT FOUND — estimate mode ─────────────────────────
      return {
        newState: { ...state, name: 'ASK_GRAMS', selectedFood: null, unknownFoodName: input.trim() },
        botMessages: [bot(
          `I'll estimate the nutrition for **${input.trim()}**! 🧮\n\nHow many grams did you have?`,
          ['50g', '100g', '150g', '200g', '250g', '300g', '400g', '500g'],
          { inputMode: 'free' }
        )],
      };
    }

    case 'SELECT_FOOD': {
      if (input.includes('Not in list') || input.includes('🔍')) {
        // User wants to use their own food name — treat as unknown
        return {
          newState: { ...state, name: 'ASK_GRAMS', selectedFood: null },
          botMessages: [bot(
            `No problem! I'll estimate it. How many grams of **${state.unknownFoodName || 'that food'}** did you have?`,
            ['50g', '100g', '150g', '200g', '250g', '300g', '400g', '500g'],
            { inputMode: 'free' }
          )],
        };
      }
      const results = state.foodResults || [];
      const selected = results.find(f => input.includes(f.name)) || results[0];
      return {
        newState: { ...state, name: 'ASK_GRAMS', selectedFood: selected, unknownFoodName: null },
        botMessages: [bot(
          `Got it! How much **${selected.name}** did you have?`,
          ['50g', '100g', '150g', '200g', '250g', '300g'],
          { inputMode: 'free' }
        )],
      };
    }

    // ── ASK GRAMS (both known & unknown foods) ────────────────
    case 'ASK_GRAMS': {
      const grams = parseNumber(input);
      if (!grams || grams <= 0 || grams > 5000) {
        return {
          newState: state,
          botMessages: [bot('Please enter a valid amount in grams (e.g. 150)', null, { inputMode: 'free' })],
        };
      }
      const foodLabel = state.selectedFood?.name || state.unknownFoodName || 'that food';
      return {
        newState: { ...state, name: 'ASK_COOKING_METHOD', pendingGrams: grams },
        botMessages: [bot(
          `Got it — **${grams}g of ${foodLabel}**.\n\nHow was it prepared?`,
          COOKING_METHODS
        )],
      };
    }

    // ── COOKING METHOD ────────────────────────────────────────
    case 'ASK_COOKING_METHOD': {
      const method = normalizeCookingMethod(input);
      const grams = state.pendingGrams;
      const { selectedFood, unknownFoodName, mealType } = state;

      if (selectedFood) {
        // Known food — calculate locally + apply method multiplier
        const rawNutrition = calcNutrition(selectedFood, grams);
        const nutrition = applyMethodToNutrition(rawNutrition, method);
        const displayMethod = input.replace(/[🥗♨️🔥🫕🍳🔆]/g, '').trim();

        return {
          newState: { ...state, name: 'CONFIRM_FOOD', pendingCookingMethod: method, pendingFood: { food: selectedFood, grams, method, ...nutrition } },
          botMessages: [bot(
            `📋 Here's what I'll log:\n\n**${grams}g of ${selectedFood.name}** (${displayMethod})\n\n🔥 ${nutrition.calories} kcal\n🥩 Protein: ${nutrition.proteinG}g\n🍚 Carbs: ${nutrition.carbsG}g\n🫒 Fat: ${nutrition.fatG}g\n\nShall I log this for your ${mealType}?`,
            ['✅ Yes, log it!', '✏️ Change amount', '🔍 Search different food']
          )],
        };
      } else {
        // Unknown food — call server to estimate
        const foodName = unknownFoodName || 'Unknown food';
        const displayMethod = input.replace(/[🥗♨️🔥🫕🍳🔆]/g, '').trim();

        return {
          newState: { ...state, name: 'ESTIMATING_FOOD', pendingCookingMethod: method },
          botMessages: [bot(`Estimating nutrition for **${grams}g of ${foodName}** (${displayMethod})… 🧮`)],
          pendingApiCall: async (api) => {
            const res = await api.post('/food/estimate', { foodName, grams, cookingMethod: method });
            return res.data;
          },
          apiSuccessState: 'SHOW_ESTIMATE',
          estimateContext: { foodName, grams, method, displayMethod, mealType },
        };
      }
    }

    // ── CONFIRM FOOD (known food, locally calculated) ─────────
    case 'CONFIRM_FOOD': {
      if (input.includes('Yes') || input.includes('✅')) {
        const { pendingFood, mealType } = state;
        return {
          newState: { ...state, name: 'FOOD_LOGGED' },
          botMessages: [bot('Logging your meal… ⏳')],
          pendingApiCall: (api) => api.post('/food', {
            mealType,
            foodName:  pendingFood.food.name,
            quantity:  pendingFood.grams,
            calories:  pendingFood.calories,
            proteinG:  pendingFood.proteinG,
            carbsG:    pendingFood.carbsG,
            fatG:      pendingFood.fatG,
          }),
          apiSuccessMessage: `✅ Logged! **${pendingFood.grams}g of ${pendingFood.food.name}** = ${pendingFood.calories} kcal added to your ${mealType}! 🎯`,
          apiErrorMessage: 'Oops! Failed to log that meal. Try again?',
          afterSuccessReplies: ['🍽️ Log Another Meal', '🏋️ Log Workout', '📊 Today\'s Summary', '🔄 Back to Menu'],
        };
      }
      if (input.includes('Change') || input.includes('✏️')) {
        return {
          newState: { ...state, name: 'ASK_GRAMS' },
          botMessages: [bot(
            `How many grams of **${state.selectedFood?.name}**?`,
            ['50g', '100g', '150g', '200g', '250g', '300g'],
            { inputMode: 'free' }
          )],
        };
      }
      return {
        newState: { ...state, name: 'SEARCH_FOOD', selectedFood: null, pendingFood: null },
        botMessages: [bot('Sure! What food would you like to log?', null, { inputMode: 'free' })],
      };
    }

    // ── CONFIRM ESTIMATED FOOD (unknown food, server estimated) ─
    case 'CONFIRM_ESTIMATED_FOOD': {
      if (input.includes('Yes') || input.includes('✅')) {
        const { pendingFood, mealType } = state;
        return {
          newState: { ...state, name: 'FOOD_LOGGED' },
          botMessages: [bot('Logging your meal… ⏳')],
          pendingApiCall: (api) => api.post('/food', {
            mealType,
            foodName:  pendingFood.foodName,
            quantity:  pendingFood.grams,
            calories:  pendingFood.calories,
            proteinG:  pendingFood.proteinG,
            carbsG:    pendingFood.carbsG,
            fatG:      pendingFood.fatG,
          }),
          apiSuccessMessage: `✅ Logged! **${pendingFood.grams}g of ${pendingFood.foodName}** ≈ ${pendingFood.calories} kcal added to your ${mealType}! 🎯\n\n_(Nutrition is estimated — actual values may vary)_`,
          apiErrorMessage: 'Oops! Failed to log that meal. Try again?',
          afterSuccessReplies: ['🍽️ Log Another Meal', '🏋️ Log Workout', '📊 Today\'s Summary', '🔄 Back to Menu'],
        };
      }
      if (input.includes('Change') || input.includes('✏️')) {
        return {
          newState: { ...state, name: 'ASK_GRAMS' },
          botMessages: [bot(
            `How many grams of **${state.unknownFoodName}**?`,
            ['50g', '100g', '150g', '200g', '250g', '300g'],
            { inputMode: 'free' }
          )],
        };
      }
      return {
        newState: { ...state, name: 'SEARCH_FOOD', unknownFoodName: null, pendingFood: null },
        botMessages: [bot('Sure! What food would you like to log?', null, { inputMode: 'free' })],
      };
    }

    case 'FOOD_LOGGED':
    case 'ESTIMATING_FOOD': {
      return transition({ ...state, name: 'MAIN_MENU' }, input, userData);
    }

    // ── WORKOUT LOGGING ──────────────────────────────────────
    case 'SELECT_EXERCISE_TYPE': {
      let cat = 'strength';
      if (input.toLowerCase().includes('cardio') || input.includes('🏃')) cat = 'cardio';
      if (input.toLowerCase().includes('flex') || input.toLowerCase().includes('yoga') || input.includes('🧘')) cat = 'flexibility';

      const exList = getByCategory(cat);
      const options = exList.slice(0, 6).map(e => e.name);
      options.push('✍️ Other (type name)');

      return {
        newState: { ...state, name: 'SELECT_EXERCISE', pendingExerciseCategory: cat },
        botMessages: [bot(`Pick an exercise or type your own:`, options)],
      };
    }

    case 'SELECT_EXERCISE': {
      if (input.includes('Other') || input.includes('✍️')) {
        return {
          newState: { ...state, name: 'TYPE_EXERCISE' },
          botMessages: [bot('What\'s the exercise name?', null, { inputMode: 'free' })],
        };
      }
      const exerciseName = input.trim();
      return transitionToExerciseDetails({ ...state, name: 'LOG_EXERCISE_DETAILS', pendingExercise: exerciseName }, exerciseName);
    }

    case 'TYPE_EXERCISE': {
      if (!input.trim()) {
        return {
          newState: state,
          botMessages: [bot('Please type the exercise name.', null, { inputMode: 'free' })],
        };
      }
      return transitionToExerciseDetails({ ...state, name: 'LOG_EXERCISE_DETAILS', pendingExercise: input.trim() }, input.trim());
    }

    case 'LOG_SETS_REPS': {
      const parsed = parseSetsReps(input);
      const num = parseNumber(input);
      const sets = parsed?.sets || 3;
      const reps = parsed?.reps || num || 10;
      return {
        newState: { ...state, name: 'LOG_WEIGHT_USED', pendingSets: sets, pendingReps: reps },
        botMessages: [bot(
          `Got it — ${sets} sets × ${reps} reps. What weight did you use? (kg, or 0 for bodyweight)`,
          ['0 (Bodyweight)', '10kg', '20kg', '30kg', '40kg', '50kg', '60kg', '80kg', '100kg'],
          { inputMode: 'free' }
        )],
      };
    }

    case 'LOG_WEIGHT_USED': {
      const w = parseNumber(input);
      const weightKg = w !== null ? w : 0;
      return {
        newState: { ...state, name: 'CONFIRM_EXERCISE', pendingWeightKg: weightKg },
        botMessages: [bot(
          `💪 **${state.pendingExercise}** — ${state.pendingSets}×${state.pendingReps} @ ${weightKg === 0 ? 'bodyweight' : weightKg + 'kg'}\n\nAdd another exercise or finish?`,
          ['➕ Add Another Exercise', '✅ Finish Session']
        )],
      };
    }

    case 'LOG_CARDIO': {
      const mins = parseNumber(input);
      if (!mins || mins <= 0) {
        return {
          newState: state,
          botMessages: [bot('Please enter duration in minutes (e.g. 30)', null, { inputMode: 'free' })],
        };
      }
      return {
        newState: { ...state, name: 'CONFIRM_EXERCISE', pendingDuration: mins, pendingWeightKg: null, pendingSets: null, pendingReps: null },
        botMessages: [bot(
          `🏃 **${state.pendingExercise}** — ${mins} minutes\n\nAdd another exercise or finish?`,
          ['➕ Add Another Exercise', '✅ Finish Session']
        )],
      };
    }

    case 'CONFIRM_EXERCISE': {
      const exercise = buildExercise(state);
      if (input.includes('Add Another') || input.includes('➕')) {
        return {
          newState: {
            ...state,
            name: 'SELECT_EXERCISE_TYPE',
            pendingExercises: [...state.pendingExercises, exercise],
            pendingExercise: null, pendingSets: null, pendingReps: null,
            pendingWeightKg: null, pendingDuration: null,
          },
          botMessages: [bot('Nice! What\'s the next exercise?', ['💪 Strength Training', '🏃 Cardio', '🧘 Flexibility / Yoga'])],
        };
      }
      const allExercises = [...state.pendingExercises, exercise];
      const summary = allExercises.map(e =>
        `• ${e.name}${e.sets ? ` — ${e.sets}×${e.reps}${e.weightKg ? ` @ ${e.weightKg}kg` : ''}` : e.durationMin ? ` — ${e.durationMin} min` : ''}`
      ).join('\n');

      return {
        newState: { ...state, name: 'SESSION_SAVING', pendingExercises: allExercises },
        botMessages: [bot('Saving your workout… ⏳')],
        pendingApiCall: (api) => api.post('/workout/session', { exercises: allExercises }),
        apiSuccessMessage: `🎉 Workout saved!\n\n${summary}\n\nGreat job! 💪`,
        apiErrorMessage: 'Failed to save workout. Try again?',
        afterSuccessReplies: ['🍽️ Log a Meal', '📊 Today\'s Summary', '🔄 Back to Menu'],
        afterSuccessState: { name: 'MAIN_MENU', pendingExercises: [], pendingExercise: null, mealType: null },
      };
    }

    // ── WEIGHT LOGGING ───────────────────────────────────────
    case 'LOG_WEIGHT': {
      const kg = parseNumber(input);
      if (!kg || kg < 20 || kg > 500) {
        return {
          newState: state,
          botMessages: [bot('Please enter your weight in kg (e.g. 72.5)', null, { inputMode: 'free' })],
        };
      }
      return {
        newState: { ...state, name: 'WEIGHT_SAVING' },
        botMessages: [bot(`Logging ${kg} kg… ⏳`)],
        pendingApiCall: (api) => api.post('/weight', { weightKg: kg }),
        apiSuccessMessage: `✅ Weight logged: **${kg} kg**. Keep it up! 🌟`,
        apiErrorMessage: 'Failed to save weight. Try again?',
        afterSuccessReplies: ['🍽️ Log a Meal', '🏋️ Log Workout', '📊 Today\'s Summary', '🔄 Back to Menu'],
        afterSuccessState: { name: 'MAIN_MENU' },
      };
    }

    // ── SUMMARY ──────────────────────────────────────────────
    case 'SHOW_SUMMARY':
    case 'SUMMARY_DONE':
    case 'SESSION_SAVING':
    case 'WEIGHT_SAVING': {
      return transition({ ...state, name: 'MAIN_MENU' }, input, userData);
    }

    default:
      return {
        newState: { ...state, name: 'MAIN_MENU' },
        botMessages: [bot('What would you like to do?', ['🍽️ Log a Meal', '🏋️ Log Workout', '📊 Today\'s Summary', '⚖️ Update Weight'])],
      };
  }
}

// ─── Helpers ───────────────────────────────────────────────────

function transitionToExerciseDetails(state, exerciseName) {
  const cat = state.pendingExerciseCategory;
  if (cat === 'cardio' || cat === 'flexibility') {
    return {
      newState: { ...state, name: 'LOG_CARDIO' },
      botMessages: [bot(
        `How long did you do **${exerciseName}** for? (enter minutes)`,
        ['10 min', '20 min', '30 min', '45 min', '60 min', '90 min'],
        { inputMode: 'free' }
      )],
    };
  }
  return {
    newState: { ...state, name: 'LOG_SETS_REPS' },
    botMessages: [bot(
      `How many sets and reps for **${exerciseName}**? (e.g. 3x10 or 4x8)`,
      ['3x10', '4x8', '3x12', '5x5', '3x15', '4x12'],
      { inputMode: 'free' }
    )],
  };
}

function buildExercise(state) {
  const cat = state.pendingExerciseCategory;
  if (cat === 'cardio' || cat === 'flexibility') {
    return { name: state.pendingExercise, category: cat, durationMin: state.pendingDuration };
  }
  return {
    name: state.pendingExercise, category: cat,
    sets: state.pendingSets, reps: state.pendingReps,
    weightKg: state.pendingWeightKg || null,
  };
}

// ─── Summary message ──────────────────────────────────────────

export function buildSummaryMessage(stats, userName) {
  const name = userName?.split(' ')[0] || 'there';
  const remaining = stats.calorieBudget - stats.caloriesIn;
  const pct = Math.min(100, Math.round((stats.caloriesIn / stats.calorieBudget) * 100));

  return `📊 **Today's Summary for ${name}**\n\n` +
    `🔥 **Calories:** ${stats.caloriesIn} / ${stats.calorieBudget} kcal (${pct}%)\n` +
    `${remaining > 0 ? `✅ ${remaining} kcal remaining` : `⚠️ ${Math.abs(remaining)} kcal over budget`}\n\n` +
    `🥩 Protein: ${stats.proteinG}g / ${stats.proteinGoalG}g\n` +
    `🍚 Carbs: ${stats.carbsG}g / ${stats.carbGoalG}g\n` +
    `🫒 Fat: ${stats.fatG}g / ${stats.fatGoalG}g\n\n` +
    `🏋️ Workouts today: ${stats.workoutCount}\n` +
    `${stats.currentWeightKg ? `⚖️ Latest weight: ${stats.currentWeightKg} kg` : ''}`;
}
