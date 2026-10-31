/* content.js — everything Max studies for the Unit 1, Leçon 1A quiz.
 * Source: the teacher's 6-page "UNIT 1" hand-out (photos from Dave, Oct 31 2026).
 * Defines window.FR = { quizDate, chunks, items, plan, numbers helpers }.
 */
(function () {
  'use strict';

  /* ---------- numbers ---------- */
  const U = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const T = { 20: 'vingt', 30: 'trente', 40: 'quarante', 50: 'cinquante', 60: 'soixante' };
  function numFr(n) {
    if (n === 1000) return 'mille';
    if (n === 100) return 'cent';
    if (n < 20) return U[n];
    if (n < 70) {
      const t = Math.floor(n / 10) * 10, u = n % 10;
      if (u === 0) return T[t];
      if (u === 1) return T[t] + ' et un';
      return T[t] + '-' + U[u];
    }
    if (n < 80) return n === 71 ? 'soixante et onze' : 'soixante-' + U[n - 60];
    if (n === 80) return 'quatre-vingts';
    return 'quatre-vingt-' + U[n - 80];
  }
  /* spelling pieces for the step-by-step builder (a leading "-" means "attach with a hyphen") */
  function numPieces(n) {
    const w = numFr(n);
    if (n < 17 || n === 100 || n === 1000) return [w];
    if (n < 20) return ['dix', '-' + U[n - 10]];
    if (n === 80) return ['quatre-vingts'];
    if (n < 70) {
      const t = Math.floor(n / 10) * 10, u = n % 10;
      if (u === 0) return [w];
      if (u === 1) return [T[t], 'et un'];
      return [T[t], '-' + U[u]];
    }
    if (n < 80) return n === 70 ? ['soixante', '-dix'] : n === 71 ? ['soixante', 'et onze'] : ['soixante', '-' + U[n - 60]];
    return n === 81 ? ['quatre-vingt', '-un'] : ['quatre-vingt', '-' + U[n - 80]];
  }
  /* how the number is built, in plain words */
  function numWhy(n) {
    const w = numFr(n);
    if (n <= 10) return w + ' is one of the first ten. Say them in order out loud: un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix.';
    if (n <= 16) return '11 to 16 all end in -ze, and each one looks like a small number: onze, douze (deux), treize (trois), quatorze (quatre), quinze (cinq), seize (six).';
    if (n < 20) return 'From 17 on, French just says "ten-seven", "ten-eight", "ten-nine": ' + w + ' = 10 + ' + (n - 10) + '.';
    if (n === 100) return 'cent = 100 (think "cent" = a hundredth of a dollar, or "century" = 100 years).';
    if (n === 1000) return 'mille = 1000 (think "millennium" = 1000 years).';
    if (n < 70) {
      const t = Math.floor(n / 10) * 10, u = n % 10;
      const tens = 'The tens look like the small numbers: trente (trois), quarante (quatre), cinquante (cinq), soixante (six). vingt (20) is the odd one.';
      if (u === 0) return tens;
      if (u === 1) return n + ' = ' + T[t] + ' + un. When the number ends in 1, French says "et un" (and one) with spaces and no hyphens: ' + w + '.';
      return n + ' = ' + T[t] + ' + ' + U[u] + ', joined with a hyphen: ' + w + '.';
    }
    if (n < 80) {
      const r = n - 60;
      return 'French has no word for 70. It counts on from 60: ' + n + ' = 60 + ' + r + ' = soixante + ' + U[r] + ' → ' + w + '.' + (n === 71 ? ' Like 21 and 31, it uses "et": soixante et onze.' : '');
    }
    if (n === 80) return '80 is "four twenties": quatre × vingt → quatre-vingts. (Your sheet writes quatre-vingt; the official spelling adds an s only at exactly 80. Both sound the same.)';
    const r = n - 80;
    return n + ' = 80 + ' + r + ' = quatre-vingt + ' + U[r] + ' → ' + w + '. ' + (n === 81 ? 'No "et" here, unlike 21–71.' : n >= 90 ? 'The 90s are "four twenties + ten-something": 90 = quatre-vingt-dix.' : '') + ' Drop the s of vingts when another number follows.';
  }

  /* masculine nouns used in number sentences (no feminine, so "vingt et un" always works) */
  const NUM_NOUNS = [
    ['élèves', 'students', 'élève', 'student'],
    ['ordinateurs', 'computers', 'ordinateur', 'computer'],
    ['bureaux', 'desks', 'bureau', 'desk'],
    ['portables', 'cell phones', 'portable', 'cell phone'],
    ['objets', 'objects', 'objet', 'object'],
  ];
  function numSentence(n, k) {
    const z = NUM_NOUNS[k % NUM_NOUNS.length];
    if (n === 0) return ['Il y a zéro examen aujourd\'hui !', 'There are zero exams today!'];
    if (n === 1) return ['Il y a un ' + z[2] + '.', 'There is one ' + z[3] + '.'];
    return ['Il y a ' + numFr(n) + ' ' + z[0] + '.', 'There are ' + n + ' ' + z[1] + '.'];
  }

  /* ---------- chunks (the order Max learns them in) ---------- */
  const chunks = [
    { id: 'c1', name: 'Hello & goodbye', short: 'Greetings', mins: 8,
      intro: [{ title: 'Hello & goodbye', body: 'Four ways to greet people and say goodbye. Read each one, tap the speaker to hear it, then practice.' }] },
    { id: 'c2', name: 'Thank you, Mr. & Mrs.', short: 'Politeness', mins: 10,
      intro: [{ title: 'Being polite', body: 'How to say thank you, how to answer "thank you", and what to call grown-ups.' }] },
    { id: 'c3', name: 'Names & introductions', short: 'Names', mins: 12,
      intro: [{ title: 'tu or vous?', body: 'French has two words for "you".\n**tu / te** → a friend, a kid your age, family.\n**vous** → an adult you don\'t know well, a teacher, or more than one person.\nEvery phrase in this chunk comes in a tu version and a vous version.' }] },
    { id: 'c4', name: 'Numbers 0–20', short: '0–20', mins: 10,
      intro: [{ title: 'Numbers 0–20', body: '0–10 you just learn.\n11–16 all end in **-ze** and look like a small number: douze ≈ deux, treize ≈ trois, quatorze ≈ quatre, quinze ≈ cinq, seize ≈ six.\n17–19 are "ten-seven, ten-eight, ten-nine": dix-sept, dix-huit, dix-neuf.', listen: [0, 2, 4, 6, 11, 12, 13, 14, 15, 16, 17, 20] }] },
    { id: 'c5', name: 'Numbers 21–69', short: '21–69', mins: 10,
      intro: [{ title: 'Tens', body: 'The tens look like the small numbers: **trente** (trois), **quarante** (quatre), **cinquante** (cinq), **soixante** (six). **vingt** (20) is the odd one.', listen: [20, 30, 40, 50, 60] },
        { title: 'Building 21–69', body: 'Tens + ones, joined with a **hyphen**: vingt-deux, trente-cinq.\nBut a number ending in **1** uses **et** (and), no hyphens: vingt et un, trente et un.', listen: [21, 22, 31, 35, 48, 61, 69] }] },
    { id: 'c6', name: 'Numbers 70–1000', short: '70–1000', mins: 12,
      intro: [{ title: 'The strange ones: 70, 80, 90', body: 'French has no word for 70, 80 or 90. It does math instead.\n**70** = 60 + 10 → soixante-dix. 71 = 60 + 11 → soixante et onze. 75 = 60 + 15 → soixante-quinze.\n**80** = 4 × 20 → quatre-vingts.\n**90** = 4 × 20 + 10 → quatre-vingt-dix. 95 = 80 + 15 → quatre-vingt-quinze.', listen: [70, 71, 75, 79, 80, 81, 90, 91, 99] },
        { title: '100 and 1000', body: '**cent** = 100 (a cent is 1/100 of a dollar).\n**mille** = 1000 (a millennium is 1000 years).', listen: [100, 1000] }] },
    { id: 'c7', name: 'The: le, la, l\', les + people', short: 'le, la, les', mins: 12,
      intro: [{ title: 'Every noun is masculine or feminine', body: 'In French every noun is a "boy word" or a "girl word". The word for "the" tells you which:\n**le** → masculine (le copain)\n**la** → feminine (la copine)\n**l\'** → before a vowel or h, for both (l\'ami, l\'amie)\n**les** → plural, for both (les amis)' },
        { title: 'Boy and girl versions', body: 'For people, the girl version usually changes the ending:\nami → ami**e**   étudiant → étudiant**e**\ncopain → cop**ine**   acteur → act**rice**\nélève is the same word for a boy or a girl.' }] },
    { id: 'c8', name: 'Things + a: un, une, des', short: 'un, une, des', mins: 14,
      intro: [{ title: 'a / some: un, une, des', body: '**un** → a (masculine): un bureau\n**une** → a (feminine): une table\n**des** → some (plural, both): des tables\nTip: with l\' you can\'t hear if a word is masculine or feminine. un or une tells you: l\'ordinateur → **un** ordinateur.' },
        { title: 'Ending clues', body: 'Endings often give the gender away:\n**-eau, -eur** → masculine: le bureau, l\'ordinateur\n**-ette, -ie, -thèque, -sion** → feminine: la tablette, la librairie, la bibliothèque, la télé(vision)\nWatch out: **librairie** is a bookstore, not a library. A library is a **bibliothèque**.' }] },
    { id: 'c9', name: 'What is it? How many?', short: 'C\'est / Il y a', mins: 12,
      intro: [{ title: 'Qu\'est-ce que c\'est ?', body: '**Qu\'est-ce que c\'est ?** = What is it?\nAnswer with one thing: **C\'est** un portable. (It\'s a cell phone.)\nAnswer with more than one: **Ce sont** des portables. (They\'re cell phones.)\nYour sheet says Ce sont = "it is"; it really means "these are / they are", for plurals.' },
        { title: 'Il y a combien de… ?', body: '**Il y a** = there is / there are.\n**Il y a combien de** tables ? = How many tables are there?\nAnswer: **Il y a** trois tables.\nBefore a vowel, de becomes **d\'**: Il y a combien d\'élèves ?' }] },
  ];

  /* ---------- items ----------
   * kind: 'phrase' | 'noun' | 'num' | 'gram'
   * ex: easy example sentences [fr, en], shown after each right answer
   * pieces: spelling steps for long phrases (a leading "-" attaches with a hyphen)
   */
  const items = [];
  const P = (o) => { o.kind = 'phrase'; items.push(o); };

  // c1 Hello & goodbye
  P({ id: 'bonsoir', chunk: 'c1', fr: 'Bonsoir', en: 'Good evening',
    why: 'bon (good) + soir (evening). Bonjour is for daytime; in the evening switch to Bonsoir.',
    sit: 'It\'s 7 p.m. and you walk into a dinner party. You say:',
    ex: [['Bonsoir, Madame !', 'Good evening, ma\'am!'], ['Bonsoir, Papa !', 'Good evening, Dad!'], ['Bonsoir, je m\'appelle Max.', 'Good evening, my name is Max.']] });
  P({ id: 'bientot', chunk: 'c1', fr: 'À bientôt', en: 'See you soon',
    why: 'bientôt = soon. Literally "until soon". Both À and ô have accents: À bientôt.',
    sit: 'You\'ll see your friend again soon, but you don\'t know exactly when. You say:',
    ex: [['Au revoir, à bientôt !', 'Goodbye, see you soon!'], ['Merci, Paul. À bientôt !', 'Thanks, Paul. See you soon!'], ['À bientôt, Madame !', 'See you soon, ma\'am!']] });
  P({ id: 'demain', chunk: 'c1', fr: 'À demain', en: 'See you tomorrow',
    why: 'demain = tomorrow. Literally "until tomorrow".',
    sit: 'School is over and you\'ll see your friend tomorrow. You say:',
    ex: [['À demain, Léa !', 'See you tomorrow, Léa!'], ['Au revoir, Monsieur. À demain !', 'Goodbye, sir. See you tomorrow!'], ['Bonne nuit, Maman. À demain !', 'Good night, Mom. See you tomorrow!']] });
  P({ id: 'journee', chunk: 'c1', fr: 'Bonne journée', en: 'Have a good day', pieces: ['Bonne', 'journée'],
    why: 'journée = the (whole) day. It\'s a feminine word, so bon becomes bonne.',
    sit: 'It\'s morning and you\'re leaving the bakery. You wish the baker a good day:',
    ex: [['Merci, Madame. Bonne journée !', 'Thank you, ma\'am. Have a good day!'], ['Au revoir et bonne journée !', 'Goodbye and have a good day!'], ['Bonne journée, Max !', 'Have a good day, Max!']] });

  // c2 Thank you & titles
  P({ id: 'merci', chunk: 'c2', fr: 'Merci', en: 'Thank you',
    why: 'Merci = thank you. Think "mercy".',
    sit: 'Someone hands you a pencil. You say:',
    ex: [['Merci, Maman !', 'Thank you, Mom!'], ['Merci, Monsieur.', 'Thank you, sir.'], ['Le portable ? Merci !', 'The cell phone? Thank you!']] });
  P({ id: 'beaucoup', chunk: 'c2', fr: 'Merci beaucoup', en: 'Thank you very much', pieces: ['Merci', 'beaucoup'],
    why: 'beaucoup = a lot. "Thanks a lot." Spell it beau + coup.',
    sit: 'Your grandma gives you an amazing birthday present. You say:',
    ex: [['Merci beaucoup, Madame !', 'Thank you very much, ma\'am!'], ['Une tablette ? Merci beaucoup !', 'A tablet? Thank you very much!'], ['Merci beaucoup, Papa !', 'Thank you very much, Dad!']] });
  P({ id: 'derien', chunk: 'c2', fr: 'De rien', en: 'You\'re welcome', syn: ['pasdequoi'],
    why: 'rien = nothing. Literally "of nothing", like saying "it\'s nothing".',
    sit: 'Your friend says « Merci ! ». You answer with two words starting with D:',
    ex: [['— Merci ! — De rien !', '— Thanks! — You\'re welcome!'], ['De rien, Léa.', 'You\'re welcome, Léa.'], ['De rien, Monsieur.', 'You\'re welcome, sir.']] });
  P({ id: 'pasdequoi', chunk: 'c2', fr: 'Pas de quoi', en: 'You\'re welcome', syn: ['derien'], pieces: ['Pas de', 'quoi'],
    why: 'Literally "not of what", meaning "no need to thank me". Same as De rien.',
    sit: 'Your friend says « Merci ! ». You answer with three words starting with P:',
    ex: [['— Merci, Max ! — Pas de quoi !', '— Thanks, Max! — You\'re welcome!'], ['Pas de quoi, Madame.', 'You\'re welcome, ma\'am.'], ['Pas de quoi, Paul !', 'You\'re welcome, Paul!']] });
  P({ id: 'monsieur', chunk: 'c2', fr: 'Monsieur', en: 'Mister (Mr.) / sir',
    why: 'For a man. Short form: M. Spell it mon + sieur. The "on" sounds like "uh": "muh-syuh".',
    sit: 'You speak politely to a man you don\'t know. You call him:',
    ex: [['Bonjour, Monsieur !', 'Hello, sir!'], ['Merci, Monsieur Dupont.', 'Thank you, Mr. Dupont.'], ['Monsieur Martin est un acteur.', 'Mr. Martin is an actor.']] });
  P({ id: 'madame', chunk: 'c2', fr: 'Madame', en: 'Missus (Mrs.) / ma\'am',
    why: 'For a woman. Short form: Mme. It\'s ma + dame (lady).',
    sit: 'You speak politely to a grown woman. You call her:',
    ex: [['Bonsoir, Madame !', 'Good evening, ma\'am!'], ['Merci, Madame Leroy.', 'Thank you, Mrs. Leroy.'], ['Madame Dupont est dans la bibliothèque.', 'Mrs. Dupont is in the library.']] });
  P({ id: 'mademoiselle', chunk: 'c2', fr: 'Mademoiselle', en: 'Miss', pieces: ['Made', 'moiselle'],
    why: 'For a girl or a young woman. Short form: Mlle. Spell it in two parts: made + moiselle.',
    sit: 'You speak politely to a girl about your age at a store. You call her:',
    ex: [['Bonjour, Mademoiselle !', 'Hello, miss!'], ['Merci, Mademoiselle.', 'Thank you, miss.'], ['Mademoiselle Léa est une actrice.', 'Miss Léa is an actress.']] });

  // c3 Names & introductions
  P({ id: 'tappelles', chunk: 'c3', fr: 'Comment t\'appelles-tu ?', en: 'What\'s your name? (to a kid or friend)', pair: 'vousappelez',
    pieces: ['Comment', 't\'appelles', '-tu'], pieceEn: ['How', 'you call (yourself)', 'you?'],
    why: 'Literally "How do you call yourself?". tu and t\' are for a friend or a kid your age.',
    sit: 'A new kid sits next to you in class. You ask his name:',
    ex: [['Salut ! Comment t\'appelles-tu ?', 'Hi! What\'s your name?'], ['— Comment t\'appelles-tu ? — Je m\'appelle Léa.', '— What\'s your name? — My name is Léa.'], ['Tu es un élève ? Comment t\'appelles-tu ?', 'You\'re a student? What\'s your name?']] });
  P({ id: 'vousappelez', chunk: 'c3', fr: 'Comment vous appelez-vous ?', en: 'What is your name? (polite, to an adult)', pair: 'tappelles',
    pieces: ['Comment', 'vous appelez', '-vous'], pieceEn: ['How', 'you call', '(yourself)?'],
    why: 'Same question as Comment t\'appelles-tu, but with vous: for an adult like a teacher, or for more than one person.',
    sit: 'You meet your new teacher. You ask her name politely:',
    ex: [['Bonjour, Madame. Comment vous appelez-vous ?', 'Hello, ma\'am. What is your name?'], ['— Comment vous appelez-vous ? — Je m\'appelle Monsieur Dupont.', '— What is your name? — My name is Mr. Dupont.'], ['Bonsoir, Monsieur. Comment vous appelez-vous ?', 'Good evening, sir. What is your name?']] });
  P({ id: 'mappelle', chunk: 'c3', fr: 'Je m\'appelle', en: 'My name is', pieces: ['Je', 'm\'appelle'], accept: ['je m\'appelle max'],
    why: 'Literally "I call myself". m\' = myself. Two p\'s and two l\'s: a-pp-e-ll-e.',
    sit: 'Someone asks you « Comment t\'appelles-tu ? ». You start your answer with:',
    ex: [['Je m\'appelle Max.', 'My name is Max.'], ['Bonjour ! Je m\'appelle Léa.', 'Hello! My name is Léa.'], ['Je m\'appelle Paul. Et toi ?', 'My name is Paul. And you?']] });
  P({ id: 'vaisbien', chunk: 'c3', fr: 'Je vais bien', en: 'I\'m doing well', pieces: ['Je vais', 'bien'], pair: 'vaismal',
    why: 'vais = I go. "I\'m going well." bien = well.',
    sit: 'Someone asks how you are. You feel great:',
    ex: [['— Ça va ? — Je vais bien, merci !', '— How\'s it going? — I\'m doing well, thanks!'], ['Je vais bien, Madame. Merci.', 'I\'m doing well, ma\'am. Thank you.'], ['Bonsoir ! Je vais bien.', 'Good evening! I\'m doing well.']] });
  P({ id: 'vaismal', chunk: 'c3', fr: 'Je vais mal', en: 'I\'m doing badly', pieces: ['Je vais', 'mal'], pair: 'vaisbien',
    why: 'mal = badly. Think "malfunction" (something working badly).',
    sit: 'Someone asks how you are. You feel sick:',
    ex: [['— Ça va ? — Je vais mal.', '— How\'s it going? — I\'m doing badly.'], ['Je vais mal. Il y a un examen !', 'I\'m doing badly. There\'s an exam!'], ['Oh non, je vais mal.', 'Oh no, I\'m doing badly.']] });
  P({ id: 'vouspresente', chunk: 'c3', fr: 'Je vous présente…', en: 'I would like to introduce… (polite)', pair: 'tepresente',
    pieces: ['Je vous', 'présente'], pieceEn: ['I (to) you', 'introduce'],
    why: 'vous = polite. Use it when you introduce someone to an adult, like your teacher.',
    sit: 'You introduce your friend to the principal:',
    ex: [['Madame, je vous présente Paul.', 'Ma\'am, I\'d like to introduce Paul.'], ['Monsieur, je vous présente mon ami Max.', 'Sir, I\'d like to introduce my friend Max.'], ['Je vous présente Léa, une élève.', 'I\'d like to introduce Léa, a student.']] });
  P({ id: 'tepresente', chunk: 'c3', fr: 'Je te présente…', en: 'I would like to introduce… (to a friend)', pair: 'vouspresente',
    pieces: ['Je te', 'présente'], pieceEn: ['I (to) you', 'introduce'],
    why: 'te = the tu form. Use it with a friend, a kid, or family.',
    sit: 'You introduce your friend to your cousin:',
    ex: [['Léa, je te présente Max.', 'Léa, meet Max.'], ['Paul, je te présente ma copine Léa.', 'Paul, this is my friend Léa.'], ['Je te présente mon copain Hugo.', 'I\'d like you to meet my pal Hugo.']] });

  // c4–c6 numbers: each item is a small group of numbers
  const NUM_TIPS = {
 "n0": "Start with these six. Tap each one, then say it out loud: zéro, un, deux, trois, quatre, cinq.",
 "n6": "Six to ten. Spelling to watch: sept has a silent p, huit starts with a silent h.",
 "n11": "11 to 16 all end in -ze, and each one looks like a small number: onze, douze (deux), treize (trois), quatorze (quatre), quinze (cinq), seize (six).",
 "n17": "17, 18, 19 are \"ten-seven, ten-eight, ten-nine\": dix-sept, dix-huit, dix-neuf. Then 20 is vingt (the g and t are silent).",
 "n20s": "The tens look like the small numbers: trente (trois), quarante (quatre), cinquante (cinq), soixante (six). vingt is the odd one.",
 "net": "Numbers ending in 1 use \"et\" (and), with spaces and no hyphens: vingt et un, trente et un, quarante et un, cinquante et un, soixante et un.",
 "n2x": "Tens + ones, joined with a hyphen: vingt-deux = 20 + 2, trente-cinq = 30 + 5.",
 "n4x": "Same pattern as the 20s and 30s: quarante-six = 40 + 6, cinquante-huit = 50 + 8, soixante-quatre = 60 + 4.",
 "n70": "French counts on from 60: 70 = soixante-dix (60 + 10), 75 = soixante-quinze (60 + 15). 71 uses et: soixante et onze.",
 "n80": "80 = quatre-vingts (4 × 20). After that, add the number with hyphens and drop the s: 81 = quatre-vingt-un, 85 = quatre-vingt-cinq.",
 "n90": "90 = quatre-vingt-dix (80 + 10). 91 = quatre-vingt-onze (80 + 11), 97 = quatre-vingt-dix-sept (80 + 17).",
 "n100": "cent = 100 (a cent is 1/100 of a dollar). mille = 1000 (a millennium is 1000 years)."
};
  const N = (id, chunk, label, nums) => items.push({ id, chunk, kind: 'num', label, nums, tip: NUM_TIPS[id] });
  N('n0', 'c4', '0–5', [0, 1, 2, 3, 4, 5]);
  N('n6', 'c4', '6–10', [6, 7, 8, 9, 10]);
  N('n11', 'c4', '11–16', [11, 12, 13, 14, 15, 16]);
  N('n17', 'c4', '17–20', [17, 18, 19, 20]);
  N('n20s', 'c5', 'Tens: 20–60', [20, 30, 40, 50, 60]);
  N('net', 'c5', '21, 31, 41, 51, 61', [21, 31, 41, 51, 61]);
  N('n2x', 'c5', '22–39', [22, 23, 24, 25, 26, 27, 28, 29, 32, 33, 34, 35, 36, 37, 38, 39]);
  N('n4x', 'c5', '42–69', [42, 44, 46, 47, 48, 53, 55, 57, 58, 62, 64, 66, 67, 69]);
  N('n70', 'c6', '70–79', [70, 71, 72, 73, 74, 75, 76, 77, 78, 79]);
  N('n80', 'c6', '80–89', [80, 81, 82, 83, 84, 85, 86, 87, 88, 89]);
  N('n90', 'c6', '90–99', [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]);
  N('n100', 'c6', '100 and 1000', [100, 1000]);

  // c7 people, c8 things
  const NN = (o) => { o.kind = 'noun'; items.push(o); };
  NN({ id: 'ami', chunk: 'c7', w: 'ami', g: 'm', pl: 'amis', en: 'friend (boy)', fem: 'amie',
    why: 'ami starts with a vowel, so it\'s l\'ami. The girl version adds an e: amie (sounds the same).',
    ex: [['C\'est un ami.', 'He\'s a friend.'], ['Max est l\'ami de Paul.', 'Max is Paul\'s friend.'], ['Ce sont des amis.', 'They are friends.']] });
  NN({ id: 'amie', chunk: 'c7', w: 'amie', g: 'f', pl: 'amies', en: 'friend (girl)', masc: 'ami',
    why: 'amie = ami + e for a girl. Still l\'amie because it starts with a vowel.',
    ex: [['C\'est une amie.', 'She\'s a friend.'], ['Léa est l\'amie de Max.', 'Léa is Max\'s friend.'], ['Ce sont des amies.', 'They are (girl) friends.']] });
  NN({ id: 'copain', chunk: 'c7', w: 'copain', g: 'm', pl: 'copains', en: 'pal (boy)', fem: 'copine',
    why: 'copain = a pal, a buddy. Boy word: le copain.',
    ex: [['Paul est un copain.', 'Paul is a pal.'], ['Je te présente mon copain Hugo.', 'Meet my pal Hugo.'], ['Le copain de Max s\'appelle Paul.', 'Max\'s pal is named Paul.']] });
  NN({ id: 'copine', chunk: 'c7', w: 'copine', g: 'f', pl: 'copines', en: 'pal (girl)', masc: 'copain',
    why: 'copine = the girl version of copain: la copine.',
    ex: [['Léa est une copine.', 'Léa is a pal.'], ['La copine de Max s\'appelle Léa.', 'Max\'s pal is named Léa.'], ['Ce sont des copines.', 'They are pals.']] });
  NN({ id: 'eleve', chunk: 'c7', w: 'élève', g: 'mf', pl: 'élèves', en: 'student (at school)',
    why: 'élève is the same word for a boy or a girl. It starts with a vowel, so l\'élève. Two accents: é then è.',
    ex: [['Max est un élève.', 'Max is a student.'], ['L\'élève a un portable.', 'The student has a cell phone.'], ['Il y a vingt élèves.', 'There are twenty students.']] });
  NN({ id: 'etudiant', chunk: 'c7', w: 'étudiant', g: 'm', pl: 'étudiants', en: 'student (boy, older)', fem: 'étudiante',
    why: 'étudiant (think "study") starts with a vowel, so l\'étudiant. Add e for a girl: étudiante.',
    ex: [['Paul est un étudiant.', 'Paul is a student.'], ['L\'étudiant a un ordinateur.', 'The student has a computer.'], ['Il y a trois étudiants.', 'There are three students.']] });
  NN({ id: 'etudiante', chunk: 'c7', w: 'étudiante', g: 'f', pl: 'étudiantes', en: 'student (girl, older)', masc: 'étudiant',
    why: 'étudiante = étudiant + e. Now you hear the t at the end. Still l\' because of the vowel.',
    ex: [['Léa est une étudiante.', 'Léa is a student.'], ['L\'étudiante a une tablette.', 'The student has a tablet.'], ['Il y a deux étudiantes.', 'There are two students.']] });
  NN({ id: 'acteur', chunk: 'c7', w: 'acteur', g: 'm', pl: 'acteurs', en: 'actor', fem: 'actrice',
    why: 'Words ending in -eur for jobs are masculine. Vowel start, so l\'acteur.',
    ex: [['C\'est un acteur.', 'He\'s an actor.'], ['L\'acteur s\'appelle Tom.', 'The actor\'s name is Tom.'], ['Il y a un acteur à la télé.', 'There\'s an actor on TV.']] });
  NN({ id: 'actrice', chunk: 'c7', w: 'actrice', g: 'f', pl: 'actrices', en: 'actress', masc: 'acteur',
    why: '-eur becomes -rice for a woman: acteur → actrice. Vowel start, so l\'actrice.',
    ex: [['C\'est une actrice.', 'She\'s an actress.'], ['L\'actrice est à la télé.', 'The actress is on TV.'], ['Il y a deux actrices.', 'There are two actresses.']] });

  NN({ id: 'bureau', chunk: 'c8', w: 'bureau', g: 'm', pl: 'bureaux', en: 'desk', pic: '🗄️',
    why: 'Words ending in -eau are almost always masculine: le bureau. The plural adds x, not s: les bureaux.',
    ex: [['C\'est un bureau.', 'It\'s a desk.'], ['L\'ordinateur est sur le bureau.', 'The computer is on the desk.'], ['Il y a deux bureaux.', 'There are two desks.']] });
  NN({ id: 'objet', chunk: 'c8', w: 'objet', g: 'm', pl: 'objets', en: 'object',
    why: 'Vowel start, so l\'objet. To show it\'s masculine: un objet. The t is silent.',
    ex: [['Qu\'est-ce que c\'est ? C\'est un objet.', 'What is it? It\'s an object.'], ['L\'objet est sur la table.', 'The object is on the table.'], ['Il y a trois objets.', 'There are three objects.']] });
  NN({ id: 'ordinateur', chunk: 'c8', w: 'ordinateur', g: 'm', pl: 'ordinateurs', en: 'computer', pic: '💻',
    why: 'Machines ending in -eur are masculine: un ordinateur. Vowel start, so l\'ordinateur.',
    ex: [['C\'est un ordinateur.', 'It\'s a computer.'], ['L\'ordinateur est sur le bureau.', 'The computer is on the desk.'], ['Il y a dix ordinateurs.', 'There are ten computers.']] });
  NN({ id: 'telephone', chunk: 'c8', w: 'téléphone', g: 'm', pl: 'téléphones', en: 'phone', pic: '☎️',
    why: 'Ends in -e but it\'s masculine. Both phones are le: le téléphone, le portable.',
    ex: [['C\'est un téléphone.', 'It\'s a phone.'], ['Le téléphone est sur la table.', 'The phone is on the table.'], ['Il y a un téléphone.', 'There is one phone.']] });
  NN({ id: 'portable', chunk: 'c8', w: 'portable', g: 'm', pl: 'portables', en: 'cell phone', pic: '📱',
    why: 'A phone you can carry ("portable"). Masculine like le téléphone.',
    ex: [['C\'est le portable de Max.', 'It\'s Max\'s cell phone.'], ['Le portable est sur le bureau.', 'The cell phone is on the desk.'], ['Il y a deux portables.', 'There are two cell phones.']] });
  NN({ id: 'examen', chunk: 'c8', w: 'examen', g: 'm', pl: 'examens', en: 'exam', pic: '📝',
    why: 'Vowel start, so l\'examen. Masculine: un examen, just like le test.',
    ex: [['C\'est un examen.', 'It\'s an exam.'], ['L\'examen est demain !', 'The exam is tomorrow!'], ['Il y a deux examens.', 'There are two exams.']] });
  NN({ id: 'test', chunk: 'c8', w: 'test', g: 'm', pl: 'tests', en: 'test',
    why: 'Borrowed from English, and masculine: le test, un test.',
    ex: [['C\'est un test.', 'It\'s a test.'], ['Le test est demain.', 'The test is tomorrow.'], ['Il y a un test mercredi.', 'There\'s a test on Wednesday.']] });
  NN({ id: 'tele', chunk: 'c8', w: 'télé', g: 'f', pl: 'télés', en: 'TV', pic: '📺',
    why: 'télé is short for la télévision, and words ending in -sion are feminine. So la télé.',
    ex: [['C\'est une télé.', 'It\'s a TV.'], ['L\'actrice est à la télé.', 'The actress is on TV.'], ['Ce sont des télés.', 'These are TVs.']] });
  NN({ id: 'chose', chunk: 'c8', w: 'chose', g: 'f', pl: 'choses', en: 'thing',
    why: 'la chose. Lots of words ending in -e are feminine.',
    ex: [['C\'est une chose.', 'It\'s a thing.'], ['Qu\'est-ce que c\'est, cette chose ?', 'What is this thing?'], ['Il y a des choses sur le bureau.', 'There are things on the desk.']] });
  NN({ id: 'librairie', chunk: 'c8', w: 'librairie', g: 'f', pl: 'librairies', en: 'bookstore', pic: '🏪',
    why: 'Trick word: librairie is a BOOKSTORE (where you buy livres, books). Words ending in -ie are feminine: la librairie.',
    ex: [['C\'est une librairie.', 'It\'s a bookstore.'], ['La librairie est à Paris.', 'The bookstore is in Paris.'], ['Il y a une librairie et une bibliothèque.', 'There is a bookstore and a library.']] });
  NN({ id: 'bibliotheque', chunk: 'c8', w: 'bibliothèque', g: 'f', pl: 'bibliothèques', en: 'library', pic: '🏛️',
    why: 'biblio = books (like "bibliography"). Words ending in -thèque are feminine: la bibliothèque.',
    ex: [['C\'est une bibliothèque.', 'It\'s a library.'], ['Les élèves sont à la bibliothèque.', 'The students are at the library.'], ['Il y a des ordinateurs à la bibliothèque.', 'There are computers at the library.']] });
  NN({ id: 'table', chunk: 'c8', w: 'table', g: 'f', pl: 'tables', en: 'table',
    why: 'Same word as English, and feminine: la table.',
    ex: [['C\'est une table.', 'It\'s a table.'], ['La tablette est sur la table.', 'The tablet is on the table.'], ['Il y a quatre tables.', 'There are four tables.']] });
  NN({ id: 'tablette', chunk: 'c8', w: 'tablette', g: 'f', pl: 'tablettes', en: 'tablet',
    why: 'Words ending in -ette are feminine (la baguette, la tablette).',
    ex: [['C\'est une tablette.', 'It\'s a tablet.'], ['La tablette est sur le bureau.', 'The tablet is on the desk.'], ['Ce sont des tablettes.', 'These are tablets.']] });

  // c9 grammar phrases
  const G = (o) => { o.kind = 'gram'; items.push(o); };
  G({ id: 'questce', chunk: 'c9', fr: 'Qu\'est-ce que c\'est ?', en: 'What is it?', pieces: ['Qu\'est-ce', 'que', 'c\'est'], pieceEn: ['What is it', 'that', 'it is?'],
    why: 'Word by word it\'s "What is it that it is?". Learn it as one question: What is it?',
    ex: [['Qu\'est-ce que c\'est ? C\'est une table.', 'What is it? It\'s a table.'], ['Qu\'est-ce que c\'est ? C\'est un portable.', 'What is it? It\'s a cell phone.'], ['Qu\'est-ce que c\'est ? Ce sont des tablettes.', 'What are they? They\'re tablets.']] });
  G({ id: 'cest', chunk: 'c9', fr: 'C\'est…', en: 'It is… (one thing)',
    why: 'C\'est goes with ONE thing: C\'est un bureau.',
    ex: [['C\'est un bureau.', 'It\'s a desk.'], ['C\'est une bibliothèque.', 'It\'s a library.'], ['C\'est Max !', 'It\'s Max!']] });
  G({ id: 'cesont', chunk: 'c9', fr: 'Ce sont…', en: 'These are / they are… (more than one)', pieces: ['Ce', 'sont'],
    why: 'Ce sont goes with MORE THAN ONE thing, usually with des: Ce sont des tables.',
    ex: [['Ce sont des tables.', 'These are tables.'], ['Ce sont des amis.', 'They are friends.'], ['Ce sont des ordinateurs.', 'These are computers.']] });
  G({ id: 'ilya', chunk: 'c9', fr: 'Il y a', en: 'There is / there are', pieces: ['Il y', 'a'],
    why: 'Il y a = there is AND there are. It never changes: Il y a un bureau. Il y a trois bureaux.',
    ex: [['Il y a un bureau.', 'There is a desk.'], ['Il y a trois tables.', 'There are three tables.'], ['Il y a une télé.', 'There is a TV.']] });
  G({ id: 'combien', chunk: 'c9', fr: 'Il y a combien de… ?', en: 'How many … are there?', pieces: ['Il y a', 'combien', 'de'], pieceEn: ['There are', 'how many', 'of'],
    why: 'combien = how many. Il y a combien de tables ? = How many tables are there? Answer with Il y a + a number.',
    ex: [['Il y a combien de tables ? Il y a quatre tables.', 'How many tables are there? There are four tables.'], ['Il y a combien d\'élèves ? Il y a vingt élèves.', 'How many students are there? There are twenty students.'], ['Il y a combien de portables ? Il y a deux portables.', 'How many cell phones are there? There are two.']] });

  /* ---------- the study plan (days in local time) ---------- */
  const plan = [
    { date: '2026-10-31', label: 'Sat', chunks: ['c1', 'c2'] },
    { date: '2026-11-01', label: 'Sun', chunks: ['c3', 'c4', 'c5'] },
    { date: '2026-11-02', label: 'Mon', chunks: ['c6', 'c7'] },
    { date: '2026-11-03', label: 'Tue', chunks: ['c8', 'c9'] },
    { date: '2026-11-04', label: 'Wed', chunks: [], quiz: true },
  ];

  window.FR = { quizDate: '2026-11-04', chunks, items, plan, numFr, numPieces, numWhy, numSentence, NUM_NOUNS };
})();
