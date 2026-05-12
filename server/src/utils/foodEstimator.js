/**
 * foodEstimator.js
 * Estimates approximate nutrition for any food + grams + cooking method.
 * Used by POST /api/food/estimate when the food isn't in the client-side database.
 */

// ─── Comprehensive per-100g (raw/standard) database ───────────────────────────
// { cal, p: protein, c: carbs, f: fat }  — all in grams
const DB = [
  // ── Fish & Seafood ─────────────────────────────────────────────────────────
  { keys: ['fish','pomfret','rohu','catla','tilapia','sea bass','snapper','cod','haddock','sole','flounder'], cal:97,  p:20, c:0,    f:2   },
  { keys: ['salmon'],                    cal:208, p:20, c:0,    f:13  },
  { keys: ['tuna','seer fish','kingfish'],cal:130, p:29, c:0,    f:1.5 },
  { keys: ['prawn','shrimp','jhinga'],   cal:85,  p:18, c:0,    f:1   },
  { keys: ['crab'],                      cal:83,  p:18, c:0,    f:1   },
  { keys: ['squid','calamari'],          cal:92,  p:16, c:3,    f:1.4 },
  { keys: ['lobster'],                   cal:89,  p:19, c:0,    f:0.9 },
  { keys: ['sardine','mackerel','bangda'],cal:208, p:19, c:0,    f:14  },
  { keys: ['hilsa','ilish'],             cal:273, p:22, c:0,    f:20  },
  { keys: ['anchovy','nethili'],         cal:131, p:20, c:0,    f:5   },

  // ── Poultry ────────────────────────────────────────────────────────────────
  { keys: ['chicken breast'],            cal:165, p:31, c:0,    f:3.6 },
  { keys: ['chicken thigh','chicken leg'],cal:209,p:26, c:0,    f:11  },
  { keys: ['chicken','murgh','poultry'], cal:190, p:27, c:0,    f:8   },
  { keys: ['chicken curry','murgh masala'],cal:165,p:14,c:5,    f:10  },
  { keys: ['chicken tikka'],             cal:175, p:22, c:5,    f:7   },
  { keys: ['turkey'],                    cal:135, p:29, c:0,    f:1   },
  { keys: ['duck'],                      cal:404, p:12, c:0,    f:40  },
  { keys: ['egg','anda'],                cal:155, p:13, c:1.1,  f:11  },

  // ── Red Meat ───────────────────────────────────────────────────────────────
  { keys: ['beef','mutton','lamb','goat','keema'],  cal:250, p:26, c:0,    f:16  },
  { keys: ['pork','bacon'],              cal:297, p:25, c:0,    f:21  },
  { keys: ['liver','kaleji'],            cal:175, p:26, c:4,    f:5   },

  // ── Indian Veg Dishes ──────────────────────────────────────────────────────
  { keys: ['dal','lentil','moong','chana dal','masoor','toor dal','arhar'],cal:116, p:9, c:17, f:1.5},
  { keys: ['rajma','kidney bean'],       cal:127, p:8.7,c:22,   f:0.5 },
  { keys: ['chole','chickpea','chana'],  cal:164, p:8.9,c:27,   f:2.6 },
  { keys: ['sambar'],                    cal:55,  p:2.5,c:8,    f:1.5 },
  { keys: ['rasam'],                     cal:30,  p:1,  c:5,    f:0.5 },
  { keys: ['paneer'],                    cal:265, p:18, c:1.2,  f:20  },
  { keys: ['tofu'],                      cal:76,  p:8,  c:2,    f:4.5 },
  { keys: ['palak paneer','spinach paneer'],cal:158,p:7, c:6,   f:12  },
  { keys: ['butter chicken','murgh makhani'],cal:175,p:12,c:7,  f:11  },
  { keys: ['biryani','pulao'],           cal:170, p:9,  c:22,   f:5   },
  { keys: ['pav bhaji'],                 cal:110, p:3,  c:18,   f:3.5 },
  { keys: ['aloo gobi'],                 cal:95,  p:2.5,c:14,   f:3.5 },
  { keys: ['baingan','eggplant bharta'], cal:60,  p:2,  c:9,    f:2   },
  { keys: ['korma'],                     cal:190, p:14, c:6,    f:13  },
  { keys: ['kofta'],                     cal:200, p:12, c:8,    f:14  },

  // ── Rice & Grains ──────────────────────────────────────────────────────────
  { keys: ['white rice','cooked rice','chawal','plain rice'],cal:130,p:2.7,c:28,f:0.3},
  { keys: ['brown rice'],                cal:123, p:2.7,c:26,   f:0.9 },
  { keys: ['basmati'],                   cal:121, p:3.5,c:25,   f:0.4 },
  { keys: ['chapati','roti','phulka'],   cal:297, p:9,  c:56,   f:4   },
  { keys: ['paratha','plain paratha'],   cal:330, p:7,  c:52,   f:11  },
  { keys: ['naan'],                      cal:317, p:9,  c:56,   f:6   },
  { keys: ['bread','toast'],             cal:265, p:9,  c:49,   f:3.2 },
  { keys: ['pasta','spaghetti','noodle'],cal:158, p:5.8,c:31,   f:0.9 },
  { keys: ['oat','oatmeal','porridge'],  cal:71,  p:2.5,c:12,   f:1.4 },
  { keys: ['poha','flattened rice','beaten rice'],cal:150,p:2.4,c:34,f:0.6},
  { keys: ['idli'],                      cal:78,  p:2.1,c:16,   f:0.4 },
  { keys: ['dosa'],                      cal:168, p:3.9,c:28,   f:4.5 },
  { keys: ['upma'],                      cal:145, p:3.5,c:25,   f:3.8 },
  { keys: ['puri'],                      cal:365, p:7,  c:49,   f:16  },
  { keys: ['bhatura'],                   cal:380, p:8,  c:52,   f:16  },
  { keys: ['quinoa'],                    cal:120, p:4.4,c:21,   f:1.9 },
  { keys: ['wheat','atta'],              cal:340, p:13, c:71,   f:1.9 },
  { keys: ['corn','maize','bhutta'],     cal:86,  p:3.3,c:19,   f:1.4 },
  { keys: ['millet','bajra','jowar','ragi'],cal:350,p:11,c:70, f:3   },

  // ── Vegetables ─────────────────────────────────────────────────────────────
  { keys: ['potato','aloo'],             cal:77,  p:2,  c:17,   f:0.1 },
  { keys: ['sweet potato','shakarkandi'],cal:86,  p:1.6,c:20,   f:0.1 },
  { keys: ['tomato','tamatar'],          cal:18,  p:0.9,c:3.9,  f:0.2 },
  { keys: ['onion','pyaz'],              cal:40,  p:1.1,c:9.3,  f:0.1 },
  { keys: ['garlic','lahsun'],           cal:149, p:6.4,c:33,   f:0.5 },
  { keys: ['ginger','adrak'],            cal:80,  p:1.8,c:18,   f:0.8 },
  { keys: ['broccoli'],                  cal:34,  p:2.8,c:7,    f:0.4 },
  { keys: ['spinach','palak'],           cal:23,  p:2.9,c:3.6,  f:0.4 },
  { keys: ['kale'],                      cal:49,  p:4.3,c:9,    f:0.9 },
  { keys: ['cabbage','patta gobhi'],     cal:25,  p:1.3,c:5.8,  f:0.1 },
  { keys: ['cauliflower','gobhi'],       cal:25,  p:2,  c:5,    f:0.3 },
  { keys: ['carrot','gajar'],            cal:41,  p:0.9,c:10,   f:0.2 },
  { keys: ['cucumber','kheera'],         cal:15,  p:0.7,c:3.6,  f:0.1 },
  { keys: ['capsicum','bell pepper'],    cal:31,  p:1,  c:6,    f:0.3 },
  { keys: ['peas','matar'],              cal:81,  p:5.4,c:14,   f:0.4 },
  { keys: ['mushroom'],                  cal:22,  p:3.1,c:3.3,  f:0.3 },
  { keys: ['beetroot','beet'],           cal:43,  p:1.6,c:10,   f:0.2 },
  { keys: ['ladyfinger','okra','bhindi'],cal:33,  p:1.9,c:7.5,  f:0.2 },
  { keys: ['bitter gourd','karela'],     cal:17,  p:1,  c:3.7,  f:0.2 },
  { keys: ['bottle gourd','lauki'],      cal:15,  p:0.6,c:3.4,  f:0.1 },
  { keys: ['pumpkin','kaddu'],           cal:26,  p:1,  c:6.5,  f:0.1 },
  { keys: ['zucchini','courgette'],      cal:17,  p:1.2,c:3.1,  f:0.3 },
  { keys: ['asparagus'],                 cal:20,  p:2.2,c:3.9,  f:0.2 },
  { keys: ['yam','jimikand'],            cal:118, p:1.5,c:28,   f:0.2 },

  // ── Fruits ─────────────────────────────────────────────────────────────────
  { keys: ['banana','kela'],             cal:89,  p:1.1,c:23,   f:0.3 },
  { keys: ['apple','seb'],               cal:52,  p:0.3,c:14,   f:0.2 },
  { keys: ['mango','aam'],               cal:60,  p:0.8,c:15,   f:0.4 },
  { keys: ['orange','santra'],           cal:47,  p:0.9,c:12,   f:0.1 },
  { keys: ['grapes','angur'],            cal:67,  p:0.6,c:17,   f:0.4 },
  { keys: ['papaya','papita'],           cal:43,  p:0.5,c:11,   f:0.3 },
  { keys: ['watermelon','tarbuz'],       cal:30,  p:0.6,c:7.5,  f:0.2 },
  { keys: ['pineapple','ananas'],        cal:50,  p:0.5,c:13,   f:0.1 },
  { keys: ['strawberry'],                cal:32,  p:0.7,c:7.7,  f:0.3 },
  { keys: ['guava','amrud'],             cal:68,  p:2.6,c:14,   f:1   },
  { keys: ['pomegranate','anar'],        cal:83,  p:1.7,c:19,   f:1.2 },
  { keys: ['pear','nashpati'],           cal:57,  p:0.4,c:15,   f:0.1 },
  { keys: ['date','khajur'],             cal:282, p:2.5,c:75,   f:0.4 },
  { keys: ['fig','anjeer'],              cal:74,  p:0.8,c:19,   f:0.3 },
  { keys: ['lychee','litchi'],           cal:66,  p:0.8,c:17,   f:0.4 },
  { keys: ['coconut','nariyal'],         cal:354, p:3.3,c:15,   f:33  },
  { keys: ['avocado'],                   cal:160, p:2,  c:9,    f:15  },
  { keys: ['kiwi'],                      cal:61,  p:1.1,c:15,   f:0.5 },

  // ── Dairy & Eggs ───────────────────────────────────────────────────────────
  { keys: ['milk','doodh'],              cal:61,  p:3.2,c:4.8,  f:3.3 },
  { keys: ['skimmed milk','skim milk'],  cal:34,  p:3.4,c:5,    f:0.1 },
  { keys: ['curd','dahi','yogurt'],      cal:60,  p:3.1,c:4,    f:3.2 },
  { keys: ['greek yogurt'],              cal:59,  p:10, c:3.6,  f:0.4 },
  { keys: ['butter','makhan'],           cal:717, p:0.9,c:0.1,  f:81  },
  { keys: ['ghee'],                      cal:900, p:0,  c:0,    f:100 },
  { keys: ['cheese','cheddar'],          cal:402, p:25, c:1.3,  f:33  },
  { keys: ['cream','malai'],             cal:340, p:2.1,c:2.8,  f:36  },
  { keys: ['lassi','sweet lassi'],       cal:70,  p:3,  c:10,   f:2.5 },
  { keys: ['kheer','rice pudding'],      cal:150, p:3.5,c:25,   f:4   },

  // ── Nuts & Seeds ───────────────────────────────────────────────────────────
  { keys: ['almond','badam'],            cal:579, p:21, c:22,   f:50  },
  { keys: ['cashew','kaju'],             cal:553, p:18, c:30,   f:44  },
  { keys: ['peanut','groundnut','mungfali'],cal:567,p:26,c:16,  f:49  },
  { keys: ['peanut butter'],             cal:588, p:25, c:20,   f:50  },
  { keys: ['walnut','akhrot'],           cal:654, p:15, c:14,   f:65  },
  { keys: ['pistachio','pista'],         cal:562, p:20, c:28,   f:45  },
  { keys: ['chia seed'],                 cal:486, p:17, c:42,   f:31  },
  { keys: ['flaxseed','alsi'],           cal:534, p:18, c:29,   f:42  },
  { keys: ['sunflower seed'],            cal:584, p:21, c:20,   f:51  },
  { keys: ['sesame','til'],              cal:573, p:18, c:23,   f:50  },
  { keys: ['makhana','fox nut','lotus seed'],cal:347,p:9.7,c:76,f:0.1},

  // ── Snacks & Fast Food ─────────────────────────────────────────────────────
  { keys: ['samosa'],                    cal:262, p:4,  c:30,   f:14  },
  { keys: ['vada','medu vada'],          cal:288, p:6,  c:30,   f:16  },
  { keys: ['bhajiya','pakora','fritter'],cal:290, p:5,  c:30,   f:17  },
  { keys: ['pizza'],                     cal:266, p:11, c:33,   f:10  },
  { keys: ['burger','hamburger'],        cal:295, p:17, c:24,   f:14  },
  { keys: ['french fries','chips'],      cal:312, p:3.4,c:41,   f:15  },
  { keys: ['popcorn'],                   cal:375, p:11, c:74,   f:4.3 },
  { keys: ['chocolate'],                 cal:546, p:5,  c:60,   f:31  },
  { keys: ['ice cream','gelato'],        cal:207, p:3.5,c:24,   f:11  },
  { keys: ['biscuit','cookie'],          cal:450, p:6,  c:65,   f:18  },
  { keys: ['cake','pastry'],             cal:350, p:5,  c:52,   f:14  },
  { keys: ['doughnut','donut'],          cal:424, p:5,  c:51,   f:23  },

  // ── Drinks ────────────────────────────────────────────────────────────────
  { keys: ['coconut water','nariyal pani'],cal:19,p:0.7,c:3.7,  f:0.2 },
  { keys: ['orange juice'],              cal:45,  p:0.7,c:10,   f:0.2 },
  { keys: ['apple juice'],               cal:46,  p:0.1,c:11,   f:0.1 },
  { keys: ['coffee','black coffee'],     cal:2,   p:0.3,c:0,    f:0   },
  { keys: ['tea','chai'],                cal:30,  p:0.5,c:5,    f:0.9 },
  { keys: ['protein shake','whey'],      cal:120, p:25, c:3,    f:1.5 },

  // ── Supplements & Health ─────────────────────────────────────────────────
  { keys: ['whey protein'],              cal:120, p:25, c:3,    f:1.5 },
];

// ─── Category fallbacks (when no keyword match) ───────────────────────────────
const CATEGORY_FALLBACKS = [
  { keys: ['fish','seafood','prawn','shrimp','crab'],                  cal:100, p:20, c:0,    f:2   },
  { keys: ['chicken','poultry','turkey','duck','hen'],                 cal:180, p:25, c:0,    f:8   },
  { keys: ['meat','beef','mutton','lamb','pork','goat'],               cal:250, p:25, c:0,    f:16  },
  { keys: ['egg'],                                                      cal:155, p:13, c:1,    f:11  },
  { keys: ['dal','lentil','bean','legume','pulse','rajma','chole'],    cal:130, p:9,  c:20,   f:1   },
  { keys: ['paneer','tofu','soya','soy'],                              cal:200, p:15, c:5,    f:12  },
  { keys: ['rice','chawal','biryani','pulao','khichdi'],               cal:130, p:3,  c:28,   f:0.5 },
  { keys: ['roti','chapati','naan','bread','paratha','puri'],          cal:300, p:8,  c:54,   f:5   },
  { keys: ['pasta','noodle','spaghetti'],                              cal:160, p:6,  c:32,   f:1   },
  { keys: ['curry','masala','sabzi','gravy','korma'],                  cal:140, p:7,  c:10,   f:8   },
  { keys: ['salad','veg','vegetable','sabzi','greens'],                cal:35,  p:2,  c:7,    f:0.5 },
  { keys: ['fruit','juice'],                                           cal:60,  p:0.8,c:15,   f:0.2 },
  { keys: ['milk','dairy','curd','yogurt','dahi','lassi'],             cal:65,  p:3.5,c:5,    f:3   },
  { keys: ['nuts','seeds','dry fruit'],                                cal:560, p:18, c:25,   f:48  },
  { keys: ['snack','chips','fries','fried','deep fried'],              cal:380, p:5,  c:45,   f:20  },
  { keys: ['cake','sweet','dessert','chocolate','ice cream'],          cal:380, p:5,  c:55,   f:16  },
  { keys: ['oil','ghee','butter'],                                     cal:800, p:0,  c:0,    f:90  },
];

// ─── Cooking method multipliers ──────────────────────────────────────────────
// Applied to calories; fat multiplier added separately for fried/curried
const METHOD_MULTIPLIERS = {
  raw:       { cal: 1.00, fat: 1.00 },
  fresh:     { cal: 1.00, fat: 1.00 },
  boiled:    { cal: 0.85, fat: 0.90 },
  steamed:   { cal: 0.87, fat: 0.90 },
  grilled:   { cal: 0.88, fat: 0.80 },
  roasted:   { cal: 0.90, fat: 0.95 },
  baked:     { cal: 0.90, fat: 0.95 },
  sauteed:   { cal: 1.10, fat: 1.20 },
  stir_fried:{ cal: 1.12, fat: 1.25 },
  fried:     { cal: 1.40, fat: 1.80 },
  deep_fried:{ cal: 1.55, fat: 2.00 },
  curried:   { cal: 1.18, fat: 1.40 },
  cooked:    { cal: 1.05, fat: 1.05 },
  other:     { cal: 1.00, fat: 1.00 },
};

/**
 * Find best match in the database for a given food name.
 * Returns { cal, p, c, f } per 100g or null.
 */
function findFood(foodName) {
  const lower = foodName.toLowerCase().trim();

  // Try exact / substring match in main DB
  for (const item of DB) {
    if (item.keys.some(k => lower.includes(k) || k.includes(lower))) {
      return { cal: item.cal, p: item.p, c: item.c, f: item.f };
    }
  }

  // Try category fallbacks
  for (const item of CATEGORY_FALLBACKS) {
    if (item.keys.some(k => lower.includes(k) || k.includes(lower))) {
      return { cal: item.cal, p: item.p, c: item.c, f: item.f };
    }
  }

  // Generic fallback — assume a balanced mixed dish
  return { cal: 150, p: 8, c: 20, f: 5 };
}

/**
 * Main estimator function.
 * @param {string} foodName
 * @param {number} grams
 * @param {string} cookingMethod  e.g. 'boiled', 'fried', 'curried', 'raw'
 * @returns {{ calories, proteinG, carbsG, fatG, estimated: true, matchedName }}
 */
function estimateNutrition(foodName, grams, cookingMethod = 'cooked') {
  const base = findFood(foodName);
  const method = METHOD_MULTIPLIERS[cookingMethod.toLowerCase().replace(/[\s-]/g, '_')] || METHOD_MULTIPLIERS.cooked;

  const ratio = grams / 100;

  const calories = Math.round(base.cal * method.cal * ratio);
  const proteinG = Math.round(base.p * ratio * 10) / 10;
  const carbsG   = Math.round(base.c * ratio * 10) / 10;
  const fatG     = Math.round(base.f * method.fat * ratio * 10) / 10;

  return { calories, proteinG, carbsG, fatG, estimated: true };
}

module.exports = { estimateNutrition, findFood };
