// ─── Static Parenting FAQ / Tips Database — Zero API Cost ────────────────────
// Rule-based keyword matching for the AI Parenting Assistant.

type FAQ = {
  keywords: string[];
  ageGroups?: string[]; // "infant" | "toddler" | "preschool" | "school" | "preteen"
  answer: string;
};

const FAQ_DATABASE: FAQ[] = [
  {
    keywords: ["sleep", "bedtime", "won't sleep", "night wake", "insomnia", "sleeping", "nap"],
    answer: `Sleep challenges are incredibly common and you're not alone in this! Here's what consistently helps:

**Establish a consistent wind-down routine** — 30-45 minutes before bed, dim the lights, lower noise, and follow the same sequence every night (bath → story → sleep). Consistency is the key — the brain learns to associate these cues with sleep.

**Screen-free hour before bed** — blue light from screens suppresses melatonin (the sleep hormone). Remove all devices from the bedroom at least 60 minutes before sleep.

**Keep wake-up and bedtime consistent** — even on weekends. A consistent sleep schedule regulates the body's internal clock within 1-2 weeks.

**Create a sleep-safe environment** — room temperature 20-22°C, blackout curtains, and white noise if needed (fan or a white noise machine works well).

**Watch out for:** overtiredness (an overtired child is harder to settle — watch for yawning cues and act 15 minutes before they peak), and stimulating activity too close to bedtime.

You're doing the right thing by addressing this — quality sleep is the foundation of good behaviour, learning, and mood. Give the routine 2-3 weeks of consistent practice before expecting results. You've got this! 🌙`,
  },
  {
    keywords: ["eat", "food", "picky", "won't eat", "fussy eater", "meal", "feeding", "appetite"],
    answer: `Picky eating is one of the most common parenting challenges — and it usually resolves with patience and the right approach. Here are proven strategies:

**Divide responsibility clearly** — *you* decide what food is served and when; *your child* decides how much they eat. This removes the power struggle completely.

**Offer new foods alongside familiar ones** — serve a new vegetable next to their favourite food. It can take 10-15 exposures before a child accepts a new food. Don't give up after one rejection!

**Make meals fun and pressure-free** — no bribing ("eat this, then get dessert"), no forcing, no commenting on how little they ate. The more pressure, the less they'll eat.

**Get them involved** — children who help choose vegetables at the market or help in the kitchen are 3x more likely to eat those foods.

**Small portions, often** — 5-6 small meals/snacks beat 3 large ones. Children's stomachs are the size of their fist.

**Watch out for:** if your child is losing weight, extremely fatigued, or refuses ALL foods — consult a paediatrician. But occasional fussiness is completely developmentally normal!

Trust your child's hunger cues and keep mealtimes positive. Most picky phases pass. You're doing great! 🥦`,
  },
  {
    keywords: ["tantrum", "angry", "meltdown", "behaviour", "aggressive", "hit", "throw", "scream"],
    answer: `Tantrums and big emotions are completely normal — especially between ages 1-4. This is actually a sign of healthy brain development, not bad parenting. Here's how to navigate it:

**Stay calm yourself first** — your nervous system regulates theirs. If you escalate, they escalate. Take a slow breath before responding.

**Don't try to reason during a tantrum** — the logical brain is offline during a meltdown. Simply be present: "I see you're very upset. I'm here." Wait until they calm down.

**Name the emotion** — "You're really frustrated that we have to leave the park. That makes sense." Naming feelings helps children develop emotional intelligence.

**After they calm down** — then you can talk about what happened and set boundaries. "I understand you were angry. But throwing things is not okay. Let's figure out a better way."

**Prevent where possible** — most tantrums happen when children are: hungry, tired, overstimulated, or transitioning. Giving 5-minute warnings before transitions ("In 5 minutes we're leaving the park") dramatically reduces outbursts.

**Watch out for:** if tantrums are happening more than 5+ times per day after age 4, or involve self-harm or harm to others, speak to your paediatrician.

You are doing a wonderful job by seeking understanding rather than just control. 💙`,
  },
  {
    keywords: ["screen", "phone", "tablet", "tv", "youtube", "mobile", "device", "digital"],
    answer: `Screen time is one of the most common parenting concerns today, and you're wise to be thinking about it. Here are evidence-based guidelines and practical tips:

**Age-appropriate limits:**
- Under 18 months: no screens except video calls
- 18-24 months: only high-quality educational content, co-viewed with parent
- 2-5 years: max 1 hour/day of quality content
- 6+ years: consistent limits (most experts recommend 1-2 hours/day recreational)

**Make it active, not passive** — co-watch and discuss what they're seeing. Ask "What do you think will happen?" and "What did you learn?" This transforms passive viewing to active learning.

**Create screen-free zones** — no screens during meals, in the bedroom, or the hour before sleep. These boundaries work best when set consistently from the start.

**Replace, don't just restrict** — have engaging offline alternatives ready: art supplies, sports gear, books, board games. Children reduce screen time naturally when interesting alternatives exist.

**Model the behaviour you want** — children whose parents are frequently on phones use screens more. Start with your own habits!

**Watch out for:** screen time replacing sleep, physical activity, or social interaction is a red flag. It's about balance, not perfection.

You're already ahead by being mindful of this. A balanced approach beats either extreme every time! 📱`,
  },
  {
    keywords: ["homework", "study", "school", "learning", "focus", "concentrate", "attention", "reading"],
    answer: `Homework battles are incredibly common — and often come down to environment and timing, not willpower. Here's what actually works:

**Timing matters enormously** — most children focus best 30-60 minutes after school (after a snack and light play). Forcing homework the moment they arrive usually backfires.

**Create a dedicated homework space** — a consistent, distraction-free spot with good lighting. This signals the brain that "this is work time." Remove phones and tablets from the space.

**Use the Pomodoro technique** (especially for ages 8+) — 25 minutes of focused work, 5-minute break, repeat. Children resist "do homework for 2 hours" but accept "work for just 25 minutes."

**Be present but don't do it for them** — sit nearby and be available. Guide with questions ("What does the problem ask?") rather than answers. The struggle is part of learning!

**Celebrate effort, not results** — "I saw how hard you tried on that maths problem" builds more resilience than "You're so smart."

**Chunk large tasks** — break big assignments into small steps. "First we'll just write the intro paragraph" feels manageable.

**Watch out for:** if homework takes 3+ hours every night despite effort, the work may be too hard. Speak to the teacher — this is important to address early.

Learning to learn is a skill. Your support is making a real difference! 📚`,
  },
  {
    keywords: ["sibling", "brother", "sister", "fighting", "jealous", "rivalry"],
    answer: `Sibling rivalry is as old as siblings themselves! Here's how to foster a more peaceful home:

**Avoid comparisons completely** — "Why can't you be more like your sister?" is the fastest way to build resentment. Every child is on their own development journey.

**Give each child individual time** — even 15 minutes of one-on-one "special time" per day dramatically reduces sibling conflict. They fight less when they feel secure in your love.

**Teach conflict resolution, don't just referee** — instead of deciding who's right, facilitate: "Tell me what happened. Now it's your turn. How can you solve this?" Children who learn to resolve conflicts develop lifelong relationship skills.

**Acknowledge feelings without taking sides** — "I can see both of you are frustrated." This validates without fuelling.

**Create sibling traditions** — shared rituals (Friday movie night, Sunday cooking together) build positive shared identity and memories.

**Watch out for:** if one sibling consistently bullies, frightens, or physically harms the other, this requires direct intervention and possibly professional support.

Most sibling relationships that feel impossible in childhood become incredibly close in adulthood. Keep nurturing both! ❤️`,
  },
  {
    keywords: ["potty", "toilet training", "diaper", "toilet", "bathroom"],
    answer: `Toilet training is a milestone that every child reaches in their own time. Here's a practical, low-stress approach:

**Readiness signs to watch for:** Can they stay dry for 2+ hours? Do they show awareness of when they're going? Can they follow simple instructions? Most children are ready between 18-36 months, but every child is different.

**Set up for success:**
- Get a child-sized potty or toilet seat insert
- Schedule regular potty sits: after waking, after meals, before bed
- Let them watch and learn (if comfortable) — observational learning is powerful
- Use simple, consistent language

**Celebrate every success** — a sticker chart or simple celebration dance works wonders. Never punish accidents — they're developmentally normal.

**Make it comfortable and fun** — some children are scared of the toilet sound. Let them flush themselves when ready, and offer books or toys to make sitting time calm.

**Be patient with regressions** — many children have setbacks, especially during transitions (new school, new sibling, moving). It's temporary.

**Watch out for:** if your child is over 4 and still not trained despite consistent effort, or if they're in pain during toilet use, speak to your paediatrician.

You're doing wonderfully — this is one of the biggest developmental leaps! 🌟`,
  },
  {
    keywords: ["anxiety", "scared", "fear", "worry", "nervous", "separation", "school refusal"],
    answer: `Childhood anxiety is very common — about 1 in 5 children experience it, and your attentiveness means you can really help. Here's how:

**Validate feelings without reinforcing avoidance** — "I understand you feel scared. Feeling scared is okay. AND you can do hard things." Avoid "There's nothing to be afraid of" — it dismisses the real feeling.

**For separation anxiety:** create a consistent goodbye ritual (a special hug, a phrase, a kiss), keep goodbyes brief but warm, and always follow through on pick-up promises. Lingering makes it harder.

**For general worry:** teach simple breathing techniques — "smell the flowers, blow out the candles" (slow inhale, slow exhale). This activates the calm nervous system.

**Gradual exposure works better than avoidance** — help your child face small versions of what scares them. Avoiding reinforces the message that the thing is dangerous.

**School refusal specifically:** maintain school attendance if possible (absence reinforces fear), work closely with the school counsellor, investigate if there's a specific trigger (bullying, difficult subject, social situation).

**Watch out for:** physical symptoms (stomachache, headache every school morning), complete refusal to go out, or anxiety significantly impacting daily life — these need professional support.

Your awareness and care are already the most important protective factor for your child. 💙`,
  },
  {
    keywords: ["weight", "overweight", "obese", "fitness", "exercise", "active", "sport"],
    answer: `Approaching children's health and fitness requires care and positivity. Here's what helps:

**Focus on health, never weight** — never comment on a child's weight or body size directly. Instead focus on "being strong", "having energy", and "feeling good." Body image formed in childhood lasts a lifetime.

**Make movement joyful** — the goal is to find physical activities they genuinely enjoy. Cycling, swimming, dancing, martial arts, team sports — try different things and let them choose.

**Daily family activity time** — even a 20-30 minute walk after dinner as a family is enormously powerful. Model an active lifestyle.

**Eating habits matter more than exercise** — reduce ultra-processed foods, sugary drinks, and excessive screen time. Offer fruits, vegetables, wholegrains, and protein naturally without making it a "diet."

**Never restrict meals** — food restriction in children can create unhealthy relationships with food. Focus on food quality and regular mealtimes, not quantity.

**Watch out for:** any weight changes should be discussed with your paediatrician. Avoid making it a home obsession — professional guidance is important here.

You're setting your child up for a lifetime of healthy habits. 🏃`,
  },
  {
    keywords: ["reading", "book", "story", "language", "speech", "talk", "vocabulary", "literacy"],
    answer: `Building a love of reading and strong language skills is one of the greatest gifts you can give your child! Here's how:

**Read aloud daily** — even 15-20 minutes makes a significant difference. Don't stop when they learn to read independently — being read TO is different and valuable well into the teen years.

**Let them choose (mostly)** — children who choose their own books read more. Visit the library, let them browse. Even comics and graphic novels count!

**Make it interactive** — ask "What do you think happens next?" and "How do you think [character] feels?" This builds comprehension and emotional intelligence.

**Narrate your day constantly** for toddlers and preschoolers — "Now we're putting the red apple in the bag. The apple is round and smooth." This vocabulary exposure is far more powerful than formal teaching.

**Surround them with words** — labels, signs, recipe cards, notes on the fridge. An environment rich in text builds reading readiness naturally.

**Never make reading feel like homework** — the moment it becomes a chore is the moment engagement drops. Keep it warm, cosy, and joyful.

**Watch out for:** if your school-age child consistently struggles with reading despite genuine effort (reversing letters, very slow reading), ask for a screening for dyslexia. Early identification changes outcomes dramatically.

You are building a reader. That's one of the most powerful things a parent can do. 📚`,
  },
  {
    keywords: ["teen", "teenager", "puberty", "attitude", "disrespect", "rude", "independent", "phone addiction"],
    answer: `The pre-teen and teen years are one of the most rewarding — and challenging — phases of parenting. You're navigating one of the biggest developmental shifts in human life. Here's what helps:

**Connect before you correct** — relationship is your most powerful tool. Before addressing behaviour, make sure your teen feels genuinely known and liked by you. Daily check-ins ("How are you really doing?") matter more than lectures.

**Pick your battles wisely** — messy room vs. drug use are not the same category. Save your energy and authority for things that truly matter: safety, kindness, honesty.

**Give increasing autonomy with responsibility** — teens need to experience consequences and decision-making to develop judgment. Allow age-appropriate choices and let natural consequences teach when safe to do so.

**Stay curious about their world** — ask about their music, their friends, their interests without judgment. Your genuine curiosity signals respect and keeps the door open.

**Watch for warning signs:** significant withdrawal from family and ALL friends, dramatic changes in sleep/appetite, giving away possessions — these warrant professional support.

**The goal has shifted** — your job is slowly changing from managing to mentoring. This transition is hard but beautiful.

You're doing the right thing by staying engaged. The teens who have parents who stay curious and connected — even through difficult years — thrive. 💙`,
  },
];

const GENERAL_TIPS = [
  `Parenting is a journey, not a destination. Every family is unique, and you're doing better than you think.

Here are some universal principles that make a real difference:

**Connection before correction** — before addressing any behaviour, ensure your child feels loved and understood. A connected child is a cooperative child.

**Be consistent** — children thrive on predictability. Consistent boundaries and routines reduce anxiety and improve behaviour more than any punishment.

**Celebrate effort over results** — "I saw how hard you tried" builds more resilience than "You're so smart." Children who focus on effort bounce back from failure.

**Take care of yourself** — you cannot pour from an empty cup. Your wellbeing directly affects your child's wellbeing. Sleep, eat, connect with friends.

**Seek support when needed** — there is no shame in asking for help from family, professionals, or parenting communities. Strong parents know when to ask.

You are your child's greatest gift. Keep showing up — that's what matters most. ❤️`,
];

export function getParentingAdvice(question: string, childName?: string, childAge?: number): string {
  const lower = question.toLowerCase();

  // Find best matching FAQ
  let bestMatch: FAQ | null = null;
  let bestScore = 0;

  for (const faq of FAQ_DATABASE) {
    let score = 0;
    for (const keyword of faq.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.split(" ").length; // multi-word keywords score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  const namePrefix = childName ? `Great question about ${childName}! ` : "";

  if (bestMatch && bestScore > 0) {
    return namePrefix + bestMatch.answer;
  }

  // Generic supportive response
  return namePrefix + GENERAL_TIPS[0]!;
}
