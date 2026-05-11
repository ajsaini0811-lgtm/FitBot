// Harris-Benedict BMR formula
export function calcBMR(weightKg, heightCm, age, gender) {
  if (gender === 'male') {
    return 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age);
  }
  return 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);
}

const ACTIVITY_MULTIPLIERS = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

export function calcTDEE(bmr, activityLevel) {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.2));
}

export function calcCalorieGoal(tdee, goal) {
  if (goal === 'lose') return Math.max(1200, tdee - 500);
  if (goal === 'gain') return tdee + 300;
  return tdee;
}

// 30% protein / 40% carbs / 30% fat
export function calcMacros(calorieGoal) {
  return {
    proteinGoalG: Math.round((calorieGoal * 0.30) / 4),
    carbGoalG:    Math.round((calorieGoal * 0.40) / 4),
    fatGoalG:     Math.round((calorieGoal * 0.30) / 9),
  };
}

export function calcBMI(weightKg, heightCm) {
  const h = heightCm / 100;
  return parseFloat((weightKg / (h * h)).toFixed(1));
}

export function bmiCategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25)   return 'Normal weight';
  if (bmi < 30)   return 'Overweight';
  return 'Obese';
}

export function activityLabel(level) {
  const labels = {
    sedentary:   'Sedentary (desk job, no exercise)',
    light:       'Lightly active (1-3 days/week)',
    moderate:    'Moderately active (3-5 days/week)',
    active:      'Very active (6-7 days/week)',
    very_active: 'Extra active (physical job + exercise)',
  };
  return labels[level] || level;
}

export function goalLabel(goal) {
  return { lose: 'Lose Fat', maintain: 'Maintain Weight', gain: 'Build Muscle' }[goal] || goal;
}
