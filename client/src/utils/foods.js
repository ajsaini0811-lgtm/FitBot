// Curated food database — calories and macros per 100g
const FOODS = [
  // ── Indian Staples ─────────────────────────────────
  { id: 1,  name: 'White Rice (cooked)',      aliases: ['rice','chawal','plain rice'],              cat: 'grains',   per100: { cal: 130, p: 2.7, c: 28,  f: 0.3 } },
  { id: 2,  name: 'Brown Rice (cooked)',      aliases: ['brown rice'],                              cat: 'grains',   per100: { cal: 123, p: 2.7, c: 26,  f: 0.9 } },
  { id: 3,  name: 'Chapati / Roti',           aliases: ['roti','chapatti','phulka','wheat roti'],   cat: 'grains',   per100: { cal: 297, p: 9,   c: 56,  f: 4   } },
  { id: 4,  name: 'Idli',                     aliases: ['idly'],                                    cat: 'breakfast',per100: { cal: 78,  p: 2.1, c: 16,  f: 0.4 } },
  { id: 5,  name: 'Dosa',                     aliases: ['dosai','plain dosa'],                      cat: 'breakfast',per100: { cal: 168, p: 3.9, c: 28,  f: 4.5 } },
  { id: 6,  name: 'Poha',                     aliases: ['aval','flattened rice'],                   cat: 'breakfast',per100: { cal: 150, p: 2.4, c: 34,  f: 0.6 } },
  { id: 7,  name: 'Upma',                     aliases: [],                                          cat: 'breakfast',per100: { cal: 145, p: 3.5, c: 25,  f: 3.8 } },
  { id: 8,  name: 'Dal (Moong)',               aliases: ['moong dal','green lentil'],                cat: 'protein',  per100: { cal: 105, p: 7,   c: 14,  f: 0.9 } },
  { id: 9,  name: 'Dal (Chana)',               aliases: ['chana dal','chick pea dal'],               cat: 'protein',  per100: { cal: 150, p: 8,   c: 24,  f: 2.5 } },
  { id: 10, name: 'Rajma (cooked)',            aliases: ['kidney beans','rajma chawal'],              cat: 'protein',  per100: { cal: 127, p: 8.7, c: 22,  f: 0.5 } },
  { id: 11, name: 'Chole (cooked)',            aliases: ['chickpeas','chana'],                        cat: 'protein',  per100: { cal: 164, p: 8.9, c: 27,  f: 2.6 } },
  { id: 12, name: 'Paneer',                   aliases: ['cottage cheese indian'],                   cat: 'protein',  per100: { cal: 265, p: 18,  c: 1.2, f: 20  } },
  { id: 13, name: 'Curd / Dahi',              aliases: ['yogurt indian','curd'],                    cat: 'dairy',    per100: { cal: 60,  p: 3.1, c: 4,   f: 3.2 } },
  { id: 14, name: 'Chicken Curry',            aliases: ['murgh curry'],                             cat: 'protein',  per100: { cal: 165, p: 14,  c: 5,   f: 10  } },
  { id: 15, name: 'Egg Curry',                aliases: ['anda curry'],                              cat: 'protein',  per100: { cal: 118, p: 7.5, c: 4.5, f: 7.5 } },
  { id: 16, name: 'Biryani (Chicken)',         aliases: ['chicken biryani'],                         cat: 'meals',    per100: { cal: 170, p: 9,   c: 22,  f: 5   } },
  { id: 17, name: 'Sambar',                   aliases: [],                                          cat: 'meals',    per100: { cal: 55,  p: 2.5, c: 8,   f: 1.5 } },
  { id: 18, name: 'Aloo Sabzi',               aliases: ['potato sabzi','aloo ki sabzi'],             cat: 'veggies',  per100: { cal: 110, p: 2,   c: 20,  f: 3   } },
  { id: 19, name: 'Palak Paneer',             aliases: ['spinach paneer'],                          cat: 'meals',    per100: { cal: 158, p: 7,   c: 6,   f: 12  } },
  { id: 20, name: 'Butter Chicken',           aliases: ['murgh makhani'],                           cat: 'meals',    per100: { cal: 175, p: 12,  c: 7,   f: 11  } },
  // ── International ──────────────────────────────────
  { id: 21, name: 'Oats (cooked)',             aliases: ['oatmeal','porridge'],                      cat: 'breakfast',per100: { cal: 71,  p: 2.5, c: 12,  f: 1.4 } },
  { id: 22, name: 'Banana',                   aliases: [],                                          cat: 'fruits',   per100: { cal: 89,  p: 1.1, c: 23,  f: 0.3 } },
  { id: 23, name: 'Apple',                    aliases: [],                                          cat: 'fruits',   per100: { cal: 52,  p: 0.3, c: 14,  f: 0.2 } },
  { id: 24, name: 'Boiled Egg',               aliases: ['egg boiled','hard boiled egg'],             cat: 'protein',  per100: { cal: 155, p: 13,  c: 1.1, f: 11  } },
  { id: 25, name: 'Scrambled Egg',            aliases: ['egg scrambled'],                           cat: 'protein',  per100: { cal: 162, p: 11,  c: 1.6, f: 12  } },
  { id: 26, name: 'Chicken Breast (grilled)', aliases: ['chicken breast','grilled chicken'],         cat: 'protein',  per100: { cal: 165, p: 31,  c: 0,   f: 3.6 } },
  { id: 27, name: 'Tuna (canned)',             aliases: ['canned tuna'],                             cat: 'protein',  per100: { cal: 116, p: 25.5,c: 0,   f: 1   } },
  { id: 28, name: 'Salmon (baked)',            aliases: ['salmon fish'],                             cat: 'protein',  per100: { cal: 206, p: 20,  c: 0,   f: 13  } },
  { id: 29, name: 'Whole Milk',               aliases: ['milk full fat'],                           cat: 'dairy',    per100: { cal: 61,  p: 3.2, c: 4.8, f: 3.3 } },
  { id: 30, name: 'Skimmed Milk',             aliases: ['low fat milk','skim milk'],                 cat: 'dairy',    per100: { cal: 34,  p: 3.4, c: 5,   f: 0.1 } },
  { id: 31, name: 'Greek Yogurt',             aliases: ['greek curd'],                              cat: 'dairy',    per100: { cal: 59,  p: 10,  c: 3.6, f: 0.4 } },
  { id: 32, name: 'White Bread',              aliases: ['bread','bread slice'],                     cat: 'grains',   per100: { cal: 265, p: 9,   c: 49,  f: 3.2 } },
  { id: 33, name: 'Brown Bread',              aliases: ['whole wheat bread'],                       cat: 'grains',   per100: { cal: 247, p: 9,   c: 41,  f: 4.2 } },
  { id: 34, name: 'Pasta (cooked)',            aliases: ['spaghetti','noodles cooked'],               cat: 'grains',   per100: { cal: 158, p: 5.8, c: 31,  f: 0.9 } },
  { id: 35, name: 'Broccoli',                 aliases: [],                                          cat: 'veggies',  per100: { cal: 34,  p: 2.8, c: 7,   f: 0.4 } },
  { id: 36, name: 'Spinach',                  aliases: ['palak'],                                   cat: 'veggies',  per100: { cal: 23,  p: 2.9, c: 3.6, f: 0.4 } },
  { id: 37, name: 'Sweet Potato',             aliases: ['shakarkandi'],                             cat: 'veggies',  per100: { cal: 86,  p: 1.6, c: 20,  f: 0.1 } },
  { id: 38, name: 'Almonds',                  aliases: ['badam'],                                   cat: 'snacks',   per100: { cal: 579, p: 21,  c: 22,  f: 50  } },
  { id: 39, name: 'Peanut Butter',            aliases: ['pb'],                                      cat: 'snacks',   per100: { cal: 588, p: 25,  c: 20,  f: 50  } },
  { id: 40, name: 'Whey Protein (1 scoop)',   aliases: ['protein shake','whey'],                    cat: 'supplements',per100: { cal: 120, p: 25, c: 3,   f: 1.5 } },
  // ── Indian Snacks ──────────────────────────────────
  { id: 41, name: 'Makhana (Foxnuts)',         aliases: ['fox nuts','lotus seeds'],                  cat: 'snacks',   per100: { cal: 347, p: 9.7, c: 76,  f: 0.1 } },
  { id: 42, name: 'Peanuts (roasted)',         aliases: ['groundnuts'],                              cat: 'snacks',   per100: { cal: 567, p: 26,  c: 16,  f: 49  } },
  { id: 43, name: 'Banana Chips',             aliases: ['plantain chips'],                          cat: 'snacks',   per100: { cal: 519, p: 2.3, c: 58,  f: 31  } },
  { id: 44, name: 'Popcorn (plain)',           aliases: [],                                          cat: 'snacks',   per100: { cal: 375, p: 11,  c: 74,  f: 4.3 } },
  { id: 45, name: 'Dark Chocolate (70%)',      aliases: ['dark choco'],                              cat: 'snacks',   per100: { cal: 598, p: 7.8, c: 46,  f: 43  } },
  { id: 46, name: 'Cashews',                  aliases: ['kaju'],                                    cat: 'snacks',   per100: { cal: 553, p: 18,  c: 30,  f: 44  } },
  { id: 47, name: 'Orange',                   aliases: ['santra','narangi'],                        cat: 'fruits',   per100: { cal: 47,  p: 0.9, c: 12,  f: 0.1 } },
  { id: 48, name: 'Watermelon',               aliases: ['tarbuz'],                                  cat: 'fruits',   per100: { cal: 30,  p: 0.6, c: 7.5, f: 0.2 } },
  { id: 49, name: 'Lassi (sweet)',             aliases: ['sweet lassi'],                             cat: 'drinks',   per100: { cal: 70,  p: 3,   c: 10,  f: 2.5 } },
  { id: 50, name: 'Coconut Water',            aliases: ['nariyal pani'],                            cat: 'drinks',   per100: { cal: 19,  p: 0.7, c: 3.7, f: 0.2 } },
];

export function searchFoods(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return FOODS.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.aliases.some(a => a.toLowerCase().includes(q))
  ).slice(0, 5);
}

export function calcNutrition(food, grams) {
  const ratio = grams / 100;
  return {
    calories: Math.round(food.per100.cal * ratio),
    proteinG: Math.round(food.per100.p * ratio * 10) / 10,
    carbsG:   Math.round(food.per100.c * ratio * 10) / 10,
    fatG:     Math.round(food.per100.f * ratio * 10) / 10,
  };
}

export default FOODS;
