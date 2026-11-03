import type { RoastLevel } from "./state.js";

// Only English is offered for now. The other lines wait in the bank until they're added here.
export const LANGUAGES = ["en"] as const;
export const BANK_LANGUAGES = ["en", "banglish", "bn"] as const;

export type Language = (typeof LANGUAGES)[number];
type BankLanguage = (typeof BANK_LANGUAGES)[number];

export interface RoastVars {
  readonly name: string;
  readonly days: number;
  readonly muscle: string;
}

// {days} appears only where skipDays is above 0 (annoyed to nuclear).
// {muscle} is what was trained today right after a check-in, and the weakest muscle at other times.
export const ROAST_BANK: Readonly<Record<RoastLevel, Readonly<Record<BankLanguage, readonly string[]>>>> = {
  hype: {
    en: [
      "THAT'S what I'm talking about! {muscle} day DESTROYED. You're a fucking machine, {name}. Same time tomorrow.",
      "{name}, you absolute BEAST! {muscle} never stood a chance. Hell yes!",
      "You showed the fuck up and {muscle} paid for it. That's a killer's work, {name}!",
      "LOOK AT YOU, {name}! No excuses, no bullshit, just {muscle} and iron. Unstoppable!",
      "The couch lost. The snooze button lost. You won, {name}. {muscle} is DONE. Fucking right!",
      "Hell yes, {name}! That's another promise you actually kept. {muscle} is toast. Do it again tomorrow.",
      "Nobody's stopping you today, you mad son of a b***h! {muscle} got wrecked and you're still standing. BEAST!",
      "That's my damn lifter! {muscle} done, excuses zero. Keep this up, {name}, and you're fucking unstoppable.",
    ],
    banglish: [
      "BOSS! Aaj {muscle} fatay dili! Tui ekta beast, kalke abar!",
      "Eita-i to chai, {name}! {muscle} shesh, excuse zero. Tui ekta machine!",
      "Hell yes, {name}! Couch harlo, tui jitli. {muscle} er kaj shesh!",
      "Dekh ke ashche! {name} gym e, {muscle} dhongsho. Tore keu thamate parbe na!",
      "Fucking beast re tui, {name}! Kotha dili, kotha rakhli. Kalke abar ay!",
      "Aaj {muscle} ke kandiye dili, {name}! Ei energy dhore rakh, unstoppable!",
      "Snooze button haar mene nilo, {name}! Tui aaj killer. Kalke same time!",
      "Eita-i asol tui, {name}! {muscle} shesh, baki shobai pichone!",
    ],
    bn: [
      "সাবাস! আজকে {muscle} এর দফারফা করে দিলি! তুই একটা জানোয়ার, কাল আবার!",
      "এটাই তো চাই, {name}! {muscle} শেষ, অজুহাত শূন্য। তুই একটা মেশিন!",
      "সোফা হারল, তুই জিতলি, {name}! {muscle} এর কাজ খতম!",
      "দেখ কে এসেছে! {name} জিমে, {muscle} ধ্বংস। তোকে কেউ থামাতে পারবে না!",
      "কথা দিলি, কথা রাখলি, {name}! তুই আসল যোদ্ধা। কাল আবার আয়!",
      "আজ {muscle} কে কাঁদিয়ে দিলি, {name}! এই তেজ ধরে রাখ!",
      "স্নুজ বাটন হার মেনেছে, {name}! আজ তুই অপ্রতিরোধ্য। কাল একই সময়ে!",
      "এই তো আসল তুই, {name}! {muscle} শেষ, বাকি সবাই পেছনে!",
    ],
  },
  rest: {
    en: [
      "Rest day, {name}. Enjoy it. Tomorrow your ass is back under that bar.",
      "Day off. Not a week off, you hear me? Don't get fucking creative.",
      "Rest is part of the plan, {name}. Your couch marathon is not.",
      "One easy day. Put the damn phone down, sleep, and be ready to work.",
      "Your {muscle} needs the most work, {name}. Rest today. Hit it hard tomorrow.",
      "Enjoy the rest, {name}. Don't you dare turn it into your \"I'll start Monday\" bullshit.",
      "Today you rest. Tomorrow the snooze button gets ignored. Clear?",
      "Take today, {name}. Waste tomorrow and I'll fucking know.",
    ],
    banglish: [
      "Aaj rest, {name}. Moja kor. Kalke abar bar er niche.",
      "Ek din chuti, ek shoptaho na. Chalaki koris na, bujhli?",
      "Rest plan er ongsho, {name}. Shara din couch e pore thaka na.",
      "Phone ta rakh, ghuma, pani kha. Kalke kaj ache.",
      "Tor {muscle} e kaj beshi dorkar, {name}. Aaj rest, kalke dhor.",
      "Aaj chuti. \"Shombar theke shuru korbo\" bullshit jeno na shuni.",
      "Aaj aram kor, {name}. Kalke snooze chapish na.",
      "Aajker din ta ne, {name}. Kalke na gele ami thik e jante parbo.",
    ],
    bn: [
      "আজ বিশ্রাম, {name}। মজা কর। কাল আবার বারের নিচে।",
      "এক দিনের ছুটি, এক সপ্তাহের না। চালাকি করিস না।",
      "বিশ্রাম পরিকল্পনার অংশ, {name}। সারাদিন সোফায় পড়ে থাকা না।",
      "ফোন রাখ, ঘুমা, পানি খা। কাল কাজ আছে।",
      "তোর {muscle} এ কাজ বেশি দরকার, {name}। আজ বিশ্রাম, কাল ধর।",
      "আজ ছুটি। \"সোমবার থেকে শুরু করব\" মার্কা ফালতু কথা যেন না শুনি।",
      "আজ আরাম কর, {name}। কাল স্নুজ টিপবি না।",
      "আজকের দিনটা নে, {name}। কাল না গেলে আমি ঠিকই জানব।",
    ],
  },
  annoyed: {
    en: [
      "One day off, {name}. ONE. Don't you dare make it two, I'm watching.",
      "You missed a day, {name}. I noticed. The squat rack noticed too.",
      "Busy, {name}? Everybody's busy. Put the phone down and get to the gym.",
      "Yesterday was free. Today costs you. Go.",
      "I smell an excuse brewing, {name}. Save it and pick up a damn weight.",
      "That snooze button won once. Don't let it win twice.",
      "Your {muscle} needs you, {name}, and you're late. Move.",
      "One miss is a slip, {name}. Two is a habit. Choose.",
    ],
    banglish: [
      "Ek din miss, {name}. EK din. Dui din koris na, ami dekhchi.",
      "Gotokal gym e chili na, {name}. Ami dekhsi. Squat rack o dekhse.",
      "Busy? Shobai busy, {name}. Phone rakh, gym e ja.",
      "Gotokal free chilo. Aaj na, {name}. Utth.",
      "Excuse er gondho paitesi, {name}. Oshob rakh, weight dhor.",
      "Snooze button ekbar jitse. Dui bar jitte dish na.",
      "Tor {muscle} wait kortese, {name}, ar tui late. Chol.",
      "Ek din miss bhul. Dui din obhyash. Tui bech, {name}.",
    ],
    bn: [
      "এক দিন মিস, {name}। মাত্র এক দিন। দুই দিন করিস না, আমি দেখছি।",
      "গতকাল জিমে ছিলি না, {name}। আমি দেখেছি। স্কোয়াট র‍্যাকও দেখেছে।",
      "ব্যস্ত? সবাই ব্যস্ত, {name}। ফোন রাখ, জিমে যা।",
      "গতকালের ছাড় শেষ। আজ না, {name}। উঠ।",
      "অজুহাতের গন্ধ পাচ্ছি, {name}। ওসব রাখ, ওজন তোল।",
      "স্নুজ বাটন একবার জিতেছে। দুইবার জিততে দিস না।",
      "তোর {muscle} অপেক্ষা করছে, {name}, আর তুই দেরি করছিস। চল।",
      "এক দিন মিস ভুল। দুই দিন অভ্যাস। তুই বেছে নে, {name}।",
    ],
  },
  angry: {
    en: [
      "Two days? What the hell, {name}? Your excuses are getting stronger than you are.",
      "{days} days of bullshit, {name}. I've heard better excuses from a broken treadmill.",
      "What's the story today? Too tired? Too busy? Too damn comfortable? Go anyway.",
      "Your dumbbells are collecting dust, {name}, and your excuses are collecting interest.",
      "You made a promise, {name}. {days} days later, it's worth shit.",
      "Damn it, {name}, your {muscle} is waiting and you're busy scrolling. Pathetic.",
      "You've got time to watch three seasons of crap but no time for the gym? Bullshit.",
      "{days} days. That's not rest, {name}, that's you getting soft. Get moving, you lazy a**hole.",
    ],
    banglish: [
      "Ki re {name}, {days} din gym nai? Excuse diye ki muscle banabi naki?",
      "{days} din bullshit, {name}. Bhanga treadmill o tor cheye bhalo excuse dey.",
      "Aaj ki golpo? Tired? Busy? Beshi aram? Jaitei hobe, damn it.",
      "Dumbbell e dhula porse, {name}, ar tor excuse e sud barche.",
      "Kotha dichili, {name}. {days} din pore shei kothar dam shit.",
      "Tor {muscle} wait kore, ar tui reels scroll koros? Hell no, {name}.",
      "Web series er jonno shomoy ache, gym er jonno nai? Bullshit.",
      "{days} din rest na, eita norom hoye jawa. Utth, {name}.",
    ],
    bn: [
      "দুই দিন জিম নাই? এত অজুহাত কোথা থেকে আসে রে?",
      "{days} দিনের ফালতু অজুহাত, {name}। ভাঙা ট্রেডমিলও এর চেয়ে ভালো অজুহাত দেয়।",
      "আজ কী গল্প? ক্লান্ত? ব্যস্ত? বেশি আরাম? তবু যেতে হবে, {name}!",
      "ডাম্বেলে ধুলো পড়ছে, {name}, আর তোর অজুহাতে সুদ বাড়ছে।",
      "কথা দিয়েছিলি, {name}। {days} দিন পরে সেই কথার দাম শূন্য।",
      "তোর {muscle} অপেক্ষায়, আর তুই রিলস দেখছিস? ধুর, {name}!",
      "সিরিজ দেখার সময় আছে, জিমের সময় নাই? ফালতু কথা!",
      "{days} দিন বিশ্রাম না, এটা নরম হয়ে যাওয়া। উঠ, {name}!",
    ],
  },
  savage: {
    en: [
      "{days} fucking days, {name}. Your {muscle} filed a missing person report. Get your lazy ass up.",
      "Your couch has seen more reps from you than the gym has. Pathetic. MOVE.",
      "{days} days of \"I'll start Monday\". You're a fucking liar, {name}, and the only one you're fooling is you.",
      "Your snooze button has a better winning record than you, you useless a**hole. Get up, {name}.",
      "{days} days, you coward. The bar didn't get heavier, you just got fucking soft.",
      "You scroll for hours and can't lift for forty minutes, you piece of sh*t? Get up, {name}.",
      "Every excuse you've got is shit, {name}. Your {muscle} is paying for them. Get to the gym, d**khead.",
      "You broke your promise {days} days in a row. How the fuck do you trust yourself now? Prove me wrong.",
    ],
    banglish: [
      "Shara din phone tipe tipe angul er muscle banaili, baki body te zero. Utth, aloshir dhenki!",
      "Gym er membership ki wallet e sajay rakhar jonno kinchili? Lojja nai tor?",
      "{days} din, {name}! \"Shombar theke\" bolte bolte koy shombar gelo? Fucking mitthuk!",
      "Tor snooze button er record tor cheye bhalo, {name}. Useless, utth!",
      "Bar bhari hoy nai, tui norom hoye gesos. {days} din, ki lojja, {name}!",
      "Ghontar por ghonta scroll korte paros, 40 minute lift korte paros na? Piece of sh*t, {name}.",
      "Tor shob excuse shit, {name}. Dam diteche tor {muscle}. Gym e ja, d**khead!",
      "{days} din dhore nijer kotha nije bhangli. Nijeke bishash koros ki kore? Prove kor!",
    ],
    bn: [
      "{days} দিন! তোর {muscle} রাগ করে বাড়ি চলে গেছে। অলস কোথাকার, উঠ!",
      "সারাদিন ফোন টিপে আঙুলের পেশি বানালি, জিমে শূন্য। লজ্জা নাই, {name}?",
      "জিমের মেম্বারশিপ কি মানিব্যাগে সাজিয়ে রাখার জন্য নিয়েছিস? লজ্জা কর!",
      "\"সোমবার থেকে\" বলতে বলতে {days} দিন গেল। মিথ্যুক কোথাকার, {name}!",
      "তোর স্নুজ বাটনের রেকর্ড তোর চেয়ে ভালো, {name}। অকর্মা, উঠ!",
      "বার ভারী হয়নি, তুই নরম হয়ে গেছিস। {days} দিন, ছি ছি, {name}!",
      "ঘণ্টার পর ঘণ্টা ফোন ঘাঁটতে পারিস, ৪০ মিনিট জিম পারিস না? কাপুরুষ!",
      "তোর সব অজুহাত ফালতু, {name}। দাম দিচ্ছে তোর {muscle}। জিমে যা, গাধা!",
    ],
  },
  nuclear: {
    en: [
      "{days} DAYS?! I've seen houseplants with more discipline. You're soft. You're comfortable. And comfortable is killing your gains. GET. UP.",
      "Stop scrolling. Stop lying to yourself. Every fucking day you skip, the weak version of you wins.",
      "{days} FUCKING DAYS, {name}! YOUR {muscle} PACKED ITS BAGS AND LEFT! GO WIN IT BACK, YOU LAZY ASS!",
      "I'M DONE BEING NICE, {name}! {days} DAYS OF BULLSHIT! THE GYM IS OPEN AND YOUR EXCUSES ARE WORTHLESS! MOVE!",
      "YOU KNOW WHAT YOU ARE AFTER {days} DAYS? COMFORTABLE! WEAK! USELESS! NOW PROVE ME WRONG, YOU SON OF A B***H!",
      "THE COUCH WON, {name}! THE PHONE WON! THE SNOOZE BUTTON WON! {days} DAYS AND YOU DIDN'T EVEN FIGHT! GET UP, YOU LAZY B*STARD!",
      "{days} days. I'm not even mad anymore, {name}. I'm DISAPPOINTED. Get your pathetic ass out the fucking door.",
      "HOW MANY MORE MONDAYS, {name}?! {days} DAYS OF LIES! SHUT UP, STAND UP AND GO LIFT SOMETHING, YOU MOTHER****ER!",
    ],
    banglish: [
      "{days} DIN! Tor {muscle} rag kore bari chole gese. Ghumkatura, ekhon e utth, gym e ja!",
      "{days} FUCKING DIN, {name}! COUCH JITSE, PHONE JITSE, TUI HARSOS! UTTH, A**HOLE!",
      "AR KOTO SHOMBAR, {name}?! {days} DIN DHORE MITTHA! CHUP KOR, UTTH, WEIGHT TOL!",
      "BHALO KOTHA SHESH, {name}! {days} DIN BULLSHIT! GYM KHOLA, TOR EXCUSE ER DAM ZERO!",
      "{days} DIN PORE TUI KI JANOS? ARAMI! DURBOL! USELESS! AMAKE BHUL PROMAN KOR!",
      "Phone rakh! Nijer shathe mittha bola bondho kor! Proti din skip mane tor durbol version jite!",
      "Ami ar ragi na, {name}. Ami HOTASH. Tor {muscle} chole gese. Ja, firiye an, lazy ass!",
      "{days} DIN?! Gach o tor cheye beshi discipline e thake! Norom hoye gesos, {name}! UTTH!",
    ],
    bn: [
      "সারাদিন শুয়ে শুয়ে কী পাচ্ছিস? দুর্বলতা! এখনই উঠ, জিমে যা!",
      "{days} দিন, {name}! সোফা জিতেছে, ফোন জিতেছে, তুই হেরেছিস! উঠ!",
      "আর কত সোমবার, {name}?! {days} দিনের মিথ্যা! চুপ কর, উঠ, ওজন তোল!",
      "ভালো কথা শেষ, {name}! {days} দিন ফালতু অজুহাত! জিম খোলা, এখনই যা!",
      "{days} দিন পরে তুই কী জানিস? আরামপ্রিয়! দুর্বল! অকর্মা! আমাকে ভুল প্রমাণ কর!",
      "ফোন রাখ! নিজের সাথে মিথ্যা বলা বন্ধ কর! প্রতিদিন স্কিপ মানে তোর দুর্বল রূপ জিতছে!",
      "আমি আর রাগি না, {name}। আমি হতাশ। তোর {muscle} চলে গেছে। যা, ফিরিয়ে আন, অলস!",
      "{days} দিন?! গাছেরও তোর চেয়ে বেশি শৃঙ্খলা আছে! নরম হয়ে গেছিস, {name}! উঠ!",
    ],
  },
  comeback: {
    en: [
      "Well, look who crawled back. About fucking time. Now shut up and earn it.",
      "About fucking time, {name}. {muscle} remembers you. Barely. Don't vanish again.",
      "Oh, NOW you show up? Good. {muscle} is done. One day doesn't fix shit, so be back tomorrow.",
      "Look who finally found the damn door, {name}. {muscle} done. Now do it again.",
      "You came back. That's the hardest part, {name}, and you fucking did it. Don't you dare stop now.",
      "I had you written off, {name}, and you proved me wrong. Good. Prove it again tomorrow, beast.",
      "Took you long enough. {muscle} got hit. The excuses can stay gone.",
      "Back from the couch, you stubborn b*stard? Damn right. {muscle} is done. Now you're dangerous again.",
    ],
    banglish: [
      "Ashli tahole? Bhalo. Kotha kom, kaaj beshi. Weight tol.",
      "About fucking time, {name}. {muscle} tor nam bhule jachilo. Ar palash na.",
      "Ekhon ashli? Thik ache. Ek din e kichui thik hoy na, kalke abar ay.",
      "Dekh ke rasta chinse! {muscle} shesh, {name}. Erpor abar kor.",
      "Fire asha-i shobcheye kothin, {name}, ar tui korli. Ekhon thamish na.",
      "Tor asha chere dichilam, {name}. Bhul proman korli. Beast! Kalke abar.",
      "Onek deri korli. {muscle} er kaj holo. Excuse gulo ar ferot ashbe na.",
      "Couch theke firli, {name}? Damn right. {muscle} shesh. Ekhon tui abar danger.",
    ],
    bn: [
      "আসলি তাহলে? ভালো। কথা কম, কাজ বেশি। ওজন তোল।",
      "এতদিনে সময় হলো, {name}? {muscle} তোর নাম ভুলে যাচ্ছিল। আর পালাবি না।",
      "এখন আসলি? ঠিক আছে। এক দিনে কিছুই ঠিক হয় না, কাল আবার আয়।",
      "দেখ কে রাস্তা চিনেছে! {muscle} শেষ, {name}। এবার আবার কর।",
      "ফিরে আসাই সবচেয়ে কঠিন, {name}, আর তুই করলি। এখন থামিস না।",
      "তোর আশা ছেড়ে দিয়েছিলাম, {name}। ভুল প্রমাণ করলি। সাবাস! কাল আবার।",
      "অনেক দেরি করলি। {muscle} এর কাজ হলো। অজুহাতগুলো আর ফিরবে না।",
      "সোফা থেকে ফিরলি, {name}? একদম ঠিক। {muscle} শেষ। এবার তুই আবার ভয়ংকর।",
    ],
  },
};

// For asking the coach on purpose, when you're putting the gym off. Works any day, so only {name} is used.
export const PROCRASTINATION_ROASTS: Readonly<Record<Language, readonly string[]>> = {
  en: [
    "You opened an app to get yelled at instead of just going. That's how fucking deep your laziness goes, {name}. SHOES. NOW.",
    "\"Five more minutes.\" You've been saying that for an hour, you lying sack of sh*t. Get up, {name}.",
    "\"After this episode.\" There's always another episode, you useless a**hole. Turn it off and go.",
    "You've spent longer thinking about the gym than the whole damn workout takes. Stop thinking, d**khead. MOVE.",
    "You're not tired, {name}. You're a lazy b*stard with a big vocabulary for excuses. Get your ass out the door.",
    "Your gym bag has been packed longer than your promises ever last. Pick it up, you gutless piece of sh*t.",
    "Right now you're doing the one thing you're truly world class at: fucking nothing. Get up, {name}.",
    "Tomorrow? You said that yesterday, you lying son of a b***h. Tomorrow you is just as useless. GO NOW.",
    "The only heavy thing you lift is your phone, you pathetic mother****er. Put it down and go lift something real.",
    "Nobody is coming to drag your lazy ass there, {name}. It's you or it's nothing. GO.",
    "You're negotiating with yourself again, {name}, and the coward is winning. Shut the fuck up and put your shoes on.",
    "Every minute you sit there, your promises look more like a fucking joke. Prove me wrong, a**hole.",
    "Waiting for motivation? It isn't coming, dumbass. Discipline is getting up while you feel like shit. UP.",
    "You've rearranged your whole fucking day to dodge forty minutes of work. Impressive, you spineless d**khead. Go.",
    "\"I'll go later.\" No you won't, {name}. You know it, I know it, your couch knows it. Prove us wrong, you b*stard.",
    "Still reading this? Still sitting down, you lazy sack of sh*t? GET. OUT. THE. DOOR.",
    "You know exactly how shit you feel after skipping. And you're doing it AGAIN, you stubborn fucking idiot. Go, {name}.",
    "Forty minutes, {name}. That's it. You waste that on the toilet with your phone, you useless mother****er. GO.",
    "Your excuses are the only thing you've ever trained consistently, a**hole. Today they lose. Get moving.",
    "You came here to get insulted? Fine: you're a soft, lazy, lying piece of sh*t until you walk into that gym, {name}. GO.",
  ],
};

/** Fills {name}, {days} and {muscle}. Replacer functions keep "$" in a user's name literal. */
export function fillRoast(template: string, vars: RoastVars): string {
  return template
    .replaceAll("{name}", () => vars.name)
    .replaceAll("{days}", () => String(vars.days))
    .replaceAll("{muscle}", () => vars.muscle);
}

export function pickRoast(level: RoastLevel, language: Language, vars: RoastVars): string {
  const lines = ROAST_BANK[level][language];
  return fillRoast(lines[Math.floor(Math.random() * lines.length)], vars);
}

/** Never the line shown last, so asking again always gets a new one. */
export function pickProcrastinationRoast(language: Language, name: string, previous?: string): string {
  const lines = PROCRASTINATION_ROASTS[language]
    .map((line) => line.replaceAll("{name}", () => name))
    .filter((line) => line !== previous);
  return lines[Math.floor(Math.random() * lines.length)];
}

/** Different lines in random order, still with their {placeholders}. */
export function sampleRoasts(level: RoastLevel, language: Language, count: number): readonly string[] {
  return ROAST_BANK[level][language]
    .map((line) => ({ line, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .slice(0, count)
    .map(({ line }) => line);
}
