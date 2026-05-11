// CommonJS mirror of client/src/utils/exercises.js — used by /api/exercises
const EXERCISES = [
  { id: 1,  name: 'Bench Press',           cat: 'strength',    muscle: 'chest',      bodyPart: 'chest',      difficulty: 'intermediate', equipment: 'barbell',    defaultSets: 3, defaultReps: 10 },
  { id: 2,  name: 'Incline Dumbbell Press', cat: 'strength',    muscle: 'chest',      bodyPart: 'chest',      difficulty: 'intermediate', equipment: 'dumbbell',   defaultSets: 3, defaultReps: 12 },
  { id: 3,  name: 'Push-up',               cat: 'strength',    muscle: 'chest',      bodyPart: 'chest',      difficulty: 'beginner',     equipment: 'bodyweight', defaultSets: 3, defaultReps: 15 },
  { id: 4,  name: 'Pull-up',               cat: 'strength',    muscle: 'back',       bodyPart: 'back',       difficulty: 'intermediate', equipment: 'bodyweight', defaultSets: 3, defaultReps: 8  },
  { id: 5,  name: 'Lat Pulldown',          cat: 'strength',    muscle: 'back',       bodyPart: 'back',       difficulty: 'beginner',     equipment: 'machine',    defaultSets: 3, defaultReps: 12 },
  { id: 6,  name: 'Bent-Over Row',         cat: 'strength',    muscle: 'back',       bodyPart: 'back',       difficulty: 'intermediate', equipment: 'barbell',    defaultSets: 3, defaultReps: 10 },
  { id: 7,  name: 'Deadlift',              cat: 'strength',    muscle: 'back',       bodyPart: 'back',       difficulty: 'advanced',     equipment: 'barbell',    defaultSets: 4, defaultReps: 5  },
  { id: 8,  name: 'Barbell Squat',         cat: 'strength',    muscle: 'legs',       bodyPart: 'legs',       difficulty: 'intermediate', equipment: 'barbell',    defaultSets: 4, defaultReps: 8  },
  { id: 9,  name: 'Leg Press',             cat: 'strength',    muscle: 'legs',       bodyPart: 'legs',       difficulty: 'beginner',     equipment: 'machine',    defaultSets: 3, defaultReps: 12 },
  { id: 10, name: 'Lunges',                cat: 'strength',    muscle: 'legs',       bodyPart: 'legs',       difficulty: 'beginner',     equipment: 'bodyweight', defaultSets: 3, defaultReps: 12 },
  { id: 11, name: 'Shoulder Press',        cat: 'strength',    muscle: 'shoulders',  bodyPart: 'shoulders',  difficulty: 'intermediate', equipment: 'barbell',    defaultSets: 3, defaultReps: 10 },
  { id: 12, name: 'Lateral Raise',         cat: 'strength',    muscle: 'shoulders',  bodyPart: 'shoulders',  difficulty: 'beginner',     equipment: 'dumbbell',   defaultSets: 3, defaultReps: 15 },
  { id: 13, name: 'Bicep Curl',            cat: 'strength',    muscle: 'biceps',     bodyPart: 'arms',       difficulty: 'beginner',     equipment: 'dumbbell',   defaultSets: 3, defaultReps: 12 },
  { id: 14, name: 'Tricep Pushdown',       cat: 'strength',    muscle: 'triceps',    bodyPart: 'arms',       difficulty: 'beginner',     equipment: 'cable',      defaultSets: 3, defaultReps: 12 },
  { id: 15, name: 'Plank',                 cat: 'strength',    muscle: 'core',       bodyPart: 'core',       difficulty: 'beginner',     equipment: 'bodyweight', defaultSets: 3, defaultReps: null },
  { id: 16, name: 'Crunches',              cat: 'strength',    muscle: 'core',       bodyPart: 'core',       difficulty: 'beginner',     equipment: 'bodyweight', defaultSets: 3, defaultReps: 20 },
  { id: 17, name: 'Leg Raise',             cat: 'strength',    muscle: 'core',       bodyPart: 'core',       difficulty: 'beginner',     equipment: 'bodyweight', defaultSets: 3, defaultReps: 15 },
  { id: 18, name: 'Glute Bridge',          cat: 'strength',    muscle: 'glutes',     bodyPart: 'legs',       difficulty: 'beginner',     equipment: 'bodyweight', defaultSets: 3, defaultReps: 15 },
  { id: 19, name: 'Hip Thrust',            cat: 'strength',    muscle: 'glutes',     bodyPart: 'legs',       difficulty: 'intermediate', equipment: 'barbell',    defaultSets: 3, defaultReps: 12 },
  { id: 20, name: 'Cable Row',             cat: 'strength',    muscle: 'back',       bodyPart: 'back',       difficulty: 'beginner',     equipment: 'cable',      defaultSets: 3, defaultReps: 12 },
  { id: 21, name: 'Running (Treadmill)',   cat: 'cardio',      muscle: 'full body',  bodyPart: 'full body',  difficulty: 'beginner',     equipment: 'machine',    defaultSets: null, defaultReps: null },
  { id: 22, name: 'Running (Outdoor)',     cat: 'cardio',      muscle: 'full body',  bodyPart: 'full body',  difficulty: 'beginner',     equipment: 'none',       defaultSets: null, defaultReps: null },
  { id: 23, name: 'Walking',              cat: 'cardio',      muscle: 'legs',       bodyPart: 'legs',       difficulty: 'beginner',     equipment: 'none',       defaultSets: null, defaultReps: null },
  { id: 24, name: 'Cycling (Stationary)', cat: 'cardio',      muscle: 'legs',       bodyPart: 'legs',       difficulty: 'beginner',     equipment: 'machine',    defaultSets: null, defaultReps: null },
  { id: 25, name: 'Cycling (Outdoor)',    cat: 'cardio',      muscle: 'legs',       bodyPart: 'legs',       difficulty: 'beginner',     equipment: 'none',       defaultSets: null, defaultReps: null },
  { id: 26, name: 'Jump Rope',            cat: 'cardio',      muscle: 'full body',  bodyPart: 'full body',  difficulty: 'beginner',     equipment: 'none',       defaultSets: null, defaultReps: null },
  { id: 27, name: 'Burpees',              cat: 'cardio',      muscle: 'full body',  bodyPart: 'full body',  difficulty: 'intermediate', equipment: 'bodyweight', defaultSets: 3,    defaultReps: 15  },
  { id: 28, name: 'Mountain Climbers',    cat: 'cardio',      muscle: 'core',       bodyPart: 'core',       difficulty: 'beginner',     equipment: 'bodyweight', defaultSets: 3,    defaultReps: 20  },
  { id: 29, name: 'Elliptical',           cat: 'cardio',      muscle: 'full body',  bodyPart: 'full body',  difficulty: 'beginner',     equipment: 'machine',    defaultSets: null, defaultReps: null },
  { id: 30, name: 'Swimming',             cat: 'cardio',      muscle: 'full body',  bodyPart: 'full body',  difficulty: 'beginner',     equipment: 'none',       defaultSets: null, defaultReps: null },
  { id: 31, name: 'Stair Climbing',       cat: 'cardio',      muscle: 'legs',       bodyPart: 'legs',       difficulty: 'beginner',     equipment: 'none',       defaultSets: null, defaultReps: null },
  { id: 32, name: 'HIIT Circuit',         cat: 'cardio',      muscle: 'full body',  bodyPart: 'full body',  difficulty: 'intermediate', equipment: 'bodyweight', defaultSets: null, defaultReps: null },
  { id: 33, name: 'Box Jumps',            cat: 'cardio',      muscle: 'legs',       bodyPart: 'legs',       difficulty: 'intermediate', equipment: 'none',       defaultSets: 4,    defaultReps: 10  },
  { id: 34, name: 'Rowing Machine',       cat: 'cardio',      muscle: 'full body',  bodyPart: 'full body',  difficulty: 'beginner',     equipment: 'machine',    defaultSets: null, defaultReps: null },
  { id: 35, name: 'Battle Ropes',         cat: 'cardio',      muscle: 'full body',  bodyPart: 'full body',  difficulty: 'intermediate', equipment: 'none',       defaultSets: 3,    defaultReps: null },
  { id: 36, name: 'Yoga (Vinyasa)',       cat: 'flexibility',  muscle: 'full body',  bodyPart: 'full body',  difficulty: 'beginner',     equipment: 'none',       defaultSets: null, defaultReps: null },
  { id: 37, name: 'Full Body Stretching', cat: 'flexibility',  muscle: 'full body',  bodyPart: 'full body',  difficulty: 'beginner',     equipment: 'none',       defaultSets: null, defaultReps: null },
  { id: 38, name: 'Foam Rolling',         cat: 'flexibility',  muscle: 'full body',  bodyPart: 'full body',  difficulty: 'beginner',     equipment: 'none',       defaultSets: null, defaultReps: null },
  { id: 39, name: 'Pilates',              cat: 'flexibility',  muscle: 'core',       bodyPart: 'core',       difficulty: 'beginner',     equipment: 'none',       defaultSets: null, defaultReps: null },
  { id: 40, name: 'Sun Salutation',       cat: 'flexibility',  muscle: 'full body',  bodyPart: 'full body',  difficulty: 'beginner',     equipment: 'none',       defaultSets: null, defaultReps: null },
];

function searchExercises({ q = '', bodyPart = '', cat = '', difficulty = '', equipment = '' } = {}) {
  return EXERCISES.filter(e => {
    const matchQ = !q || e.name.toLowerCase().includes(q.toLowerCase()) || e.muscle.toLowerCase().includes(q.toLowerCase());
    const matchBodyPart = !bodyPart || e.bodyPart === bodyPart;
    const matchCat = !cat || e.cat === cat;
    const matchDifficulty = !difficulty || e.difficulty === difficulty;
    const matchEquipment = !equipment || e.equipment === equipment;
    return matchQ && matchBodyPart && matchCat && matchDifficulty && matchEquipment;
  });
}

module.exports = { EXERCISES, searchExercises };
