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
  };
}

// ─── State Machine ─────────────────────────────────────────────
// Returns: { newState, botMessages, pendingApiCall? }
// pendingApiCall = (api) => Promise — Chat.jsx executes it

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
          bot(`${greeting}, ${name}! 💪 I'm FitBot, your fitness companion. What would you like to do today?`,
            ['🍽️ Log a Meal', '🏋️ Log Workout', '📊 Today\'s Summary', '⚖️ Update Weight', '🔄 Back to Menu'])
        ],
      };
    }

    // ── MAIN_MENU ────────────────────────────────────────────
    case 'MAIN_MENU': {
      const i = input.toLowerCase();
      if (i.includes('meal') || i.includes('food') || i.includes('eat') || i.includes('🍽')) {
        return {
          newState: { ...state, name: 'SELECT_MEAL_TYPE' },
          botMessages: [bot('Great! Which meal are you logging?', ['☀️ Breakfast', '🌤️ Lunch', '🌙 Dinner', '🍎 Snack'])],
        };
      }
      if (i.includes('workout') || i.includes('exercise') || i.includes('gym') || i.includes('🏋')) {
        return {
          newState: { ...state, name: 'SELECT_EXERCISE_TYPE' },
          botMessages: [bot('Let\'s log your workout! What type of exercise?', ['💪 Strength Training', '🏃 Cardio', '🧘 Flexibility / Yoga'])],
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
          botMessages: [bot('Sure! What\'s your weight today? (in kg)', null, { inputMode: 'free' })],
        };
      }
      if (i.includes('progress') || i.includes('📈')) {
        return {
          newState: { ...state, name: 'MAIN_MENU' },
          botMessages: [bot('Head to the Progress tab to see your charts 📈', ['🍽️ Log a Meal', '🏋️ Log Workout', '📊 Today\'s Summary', '⚖️ Update Weight'])],
          navigate: '/progress',
        };
      }
      // fallback
      return {
        newState: { ...state, name: 'MAIN_MENU' },
        botMessages: [bot('What would you like to do?', ['🍽️ Log a Meal', '🏋️ Log Workout', '📊 Today\'s Summary', '⚖️ Update Weight'])],
      };
    }

    // ── MEAL LOGGING ─────────────────────────────────────────
    case 'SELECT_MEAL_TYPE': {
      const mealMap = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack: 'snack', '☀️': 'breakfast', '🌤️': 'lunch', '🌙': 'dinner', '🍎': 'snack' };
      const key = Object.keys(mealMap).find(k => input.toLowerCase().includes(k));
      const mealType = mealMap[key] || 'snack';
      return {
        newState: { ...state, name: 'SEARCH_FOOD', mealType },
        botMessages: [bot(`What did you eat for ${mealType}? Type a food name to search.`, null, { inputMode: 'free' })],
      };
    }

    case 'SEARCH_FOOD': {
      const results = searchFoods(input);
      if (results.length === 0) {
        return {
          newState: { ...state, name: 'SEARCH_FOOD' },
          botMessages: [bot(`Hmm, I couldn't find "${input}". Try another name or be more specific.`, null, { inputMode: 'free' })],
        };
      }
      const opts = results.map(f => `${f.name} (${f.per100.cal} kcal/100g)`);
      opts.push('🔍 Search again');
      return {
        newState: { ...state, name: 'SELECT_FOOD', foodResults: results },
        botMessages: [bot(`I found these. Which one did you have?`, opts)],
      };
    }

    case 'SELECT_FOOD': {
      if (input.includes('Search again') || input.includes('🔍')) {
        return {
          newState: { ...state, name: 'SEARCH_FOOD', foodResults: null },
          botMessages: [bot('No problem! Type the food name again.', null, { inputMode: 'free' })],
        };
      }
      const results = state.foodResults || [];
      const selected = results.find(f => input.includes(f.name)) || results[0];
      return {
        newState: { ...state, name: 'ENTER_QUANTITY', selectedFood: selected },
        botMessages: [bot(
          `Great choice! How much ${selected.name} did you have? (enter in grams, or approximate)`,
          ['50g', '100g', '150g', '200g', '250g', '300g'],
          { inputMode: 'free' }
        )],
      };
    }

    case 'ENTER_QUANTITY': {
      const grams = parseNumber(input);
      if (!grams || grams <= 0) {
        return {
          newState: { ...state, name: 'ENTER_QUANTITY' },
          botMessages: [bot('Please enter a valid amount in grams (e.g. 150)', null, { inputMode: 'free' })],
        };
      }
      const food = state.selectedFood;
      const nutrition = calcNutrition(food, grams);
      return {
        newState: { ...state, name: 'CONFIRM_FOOD', pendingFood: { food, grams, ...nutrition } },
        botMessages: [bot(
          `📋 Here's what I'll log:\n\n**${grams}g of ${food.name}**\n🔥 ${nutrition.calories} kcal  |  🥩 ${nutrition.proteinG}g protein  |  🍚 ${nutrition.carbsG}g carbs  |  🫒 ${nutrition.fatG}g fat\n\nShall I log this for ${state.mealType}?`,
          ['✅ Yes, log it!', '✏️ Change amount', '🔍 Search different food']
        )],
      };
    }

    case 'CONFIRM_FOOD': {
      if (input.includes('Yes') || input.includes('✅')) {
        const { pendingFood, mealType } = state;
        return {
          newState: { ...state, name: 'FOOD_LOGGED', pendingFood: null },
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
          apiSuccessMessage: `✅ Logged! **${pendingFood.grams}g of ${pendingFood.food.name}** = ${pendingFood.calories} kcal added to your ${mealType}. 🎯`,
          apiErrorMessage: 'Oops! Failed to log that meal. Try again?',
          afterSuccessReplies: ['🍽️ Log Another Meal', '🏋️ Log Workout', '📊 Today\'s Summary', '🔄 Back to Menu'],
        };
      }
      if (input.includes('Change') || input.includes('✏️')) {
        return {
          newState: { ...state, name: 'ENTER_QUANTITY' },
          botMessages: [bot(`How many grams of ${state.selectedFood?.name}?`, ['50g','100g','150g','200g','250g','300g'], { inputMode: 'free' })],
        };
      }
      // Search different food
      return {
        newState: { ...state, name: 'SEARCH_FOOD', selectedFood: null, pendingFood: null },
        botMessages: [bot('Sure! What food would you like to search?', null, { inputMode: 'free' })],
      };
    }

    case 'FOOD_LOGGED': {
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
        botMessages: [bot(`Pick an exercise from ${cat === 'cardio' ? 'Cardio' : cat === 'flexibility' ? 'Flexibility' : 'Strength Training'}:`, options)],
      };
    }

    case 'SELECT_EXERCISE': {
      let exerciseName = input.replace('✍️ ', '').replace('Other (type name)', '').trim();
      if (input.includes('Other') || input.includes('✍️')) {
        return {
          newState: { ...state, name: 'TYPE_EXERCISE' },
          botMessages: [bot('What\'s the exercise name?', null, { inputMode: 'free' })],
        };
      }
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
        botMessages: [bot(`Got it — ${sets} sets × ${reps} reps. What weight did you use? (kg, or 0 for bodyweight)`, ['0 (Bodyweight)', '10kg', '20kg', '30kg', '40kg', '50kg', '60kg', '80kg', '100kg'], { inputMode: 'free' })],
      };
    }

    case 'LOG_WEIGHT_USED': {
      const w = parseNumber(input);
      const weightKg = w !== null ? w : 0;
      return {
        newState: { ...state, name: 'CONFIRM_EXERCISE', pendingWeightKg: weightKg },
        botMessages: [bot(
          `💪 **${state.pendingExercise}** — ${state.pendingSets}×${state.pendingReps} @ ${weightKg === 0 ? 'bodyweight' : weightKg + 'kg'}\n\nAdd another exercise or finish the session?`,
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
      const dist = null; // could ask for distance in a future enhancement
      return {
        newState: { ...state, name: 'CONFIRM_EXERCISE', pendingDuration: mins, pendingWeightKg: null, pendingSets: null, pendingReps: null },
        botMessages: [bot(
          `🏃 **${state.pendingExercise}** — ${mins} minutes\n\nAdd another exercise or finish the session?`,
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
      // Finish session
      const allExercises = [...state.pendingExercises, exercise];
      const summary = allExercises.map(e =>
        `• ${e.name}${e.sets ? ` — ${e.sets}×${e.reps}${e.weightKg ? ` @ ${e.weightKg}kg` : ''}` : e.durationMin ? ` — ${e.durationMin} min` : ''}`
      ).join('\n');

      return {
        newState: { ...state, name: 'SESSION_SAVING', pendingExercises: allExercises },
        botMessages: [bot('Saving your workout… ⏳')],
        pendingApiCall: (api) => api.post('/workout/session', {
          exercises: allExercises,
        }),
        apiSuccessMessage: `🎉 Workout saved!\n\n${summary}\n\nGreat job today! 💪`,
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

    // ── SHOW SUMMARY (handled externally, state just resets) ─
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
      botMessages: [bot(`How long did you do **${exerciseName}** for? (enter minutes)`, ['10 min', '20 min', '30 min', '45 min', '60 min', '90 min'], { inputMode: 'free' })],
    };
  }
  return {
    newState: { ...state, name: 'LOG_SETS_REPS' },
    botMessages: [bot(`How many sets and reps for **${exerciseName}**? (e.g. 3x10 or 4x8)`, ['3x10', '4x8', '3x12', '5x5', '3x15', '4x12'], { inputMode: 'free' })],
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

// Build the summary message after fetching today's stats
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
