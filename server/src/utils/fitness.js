// Harris-Benedict BMR formula
function calcBMR(weightKg, heightCm, age, gender) {
  if (gender === 'male') {
    return 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age);
  }
  return 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);
}

const ACTIVITY_MULTIPLIERS = {
  sedentary:   1.2,    // desk job, little/no exercise
  light:       1.375,  // light exercise 1-3 days/week
  moderate:    1.55,   // moderate exercise 3-5 days/week
  active:      1.725,  // hard exercise 6-7 days/week
  very_active: 1.9,    // very hard exercise + physical job
};

function calcTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

function calcCalorieGoal(tdee, goal) {
  if (goal === 'lose') return Math.max(1200, tdee - 500);
  if (goal === 'gain') return tdee + 300;
  return tdee;
}

// 30% protein / 40% carbs / 30% fat split
function calcMacros(calorieGoal) {
  return {
    proteinGoalG: Math.round((calorieGoal * 0.30) / 4),
    carbGoalG:    Math.round((calorieGoal * 0.40) / 4),
    fatGoalG:     Math.round((calorieGoal * 0.30) / 9),
  };
}

function calcBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

module.exports = { calcBMR, calcTDEE, calcCalorieGoal, calcMacros, calcBMI };
