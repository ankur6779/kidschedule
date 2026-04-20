import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
  Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { brand } from "@/constants/colors";
import * as Haptics from "expo-haptics";

// ── Lesson data — trilingual ───────────────────────────────────────────────
type AgeBucket = "0-2" | "2-4" | "5-7" | "8-10" | "10+";
type LangCode = "en" | "hi" | "hinglish";

interface MultiScript { en: string; hi: string; hinglish: string }
interface MultiText   { en: string; hi: string; hinglish: string }

interface Lesson {
  id: string;
  title: MultiText;
  age: AgeBucket;
  duration: string;
  emoji: string;
  scripts: MultiScript;
}

function getScript(l: Lesson, lang: string): string {
  const k: LangCode = lang === "hi" ? "hi" : lang === "hinglish" ? "hinglish" : "en";
  return l.scripts[k];
}
function getTitle(l: Lesson, lang: string): string {
  const k: LangCode = lang === "hi" ? "hi" : lang === "hinglish" ? "hinglish" : "en";
  return l.title[k];
}

const LESSONS: Lesson[] = [
  // 0-2 ──────────────────────────────────────────────────────────────────
  {
    id: "a1",
    title: { en: "Newborn Sleep Cycles", hi: "नवजात की नींद के चक्र", hinglish: "Newborn Sleep Cycles" },
    age: "0-2", duration: "4 min", emoji: "😴",
    scripts: {
      en: "Newborns sleep 14–17 hours a day in short bursts of 45–90 minutes. Their sleep cycles are shorter than adults — about 50 minutes — which is why they wake so often. The best thing you can do is follow their cues. Watch for eye-rubbing, yawning, or looking away. Responding quickly prevents overtiredness, which actually makes sleep harder. A consistent pre-sleep routine — dim lights, a warm bath, a soft song — begins building sleep associations from week 4 onwards.",
      hi: "नवजात शिशु दिन में 14-17 घंटे सोते हैं — 45-90 मिनट के छोटे-छोटे periods में। उनके sleep cycles वयस्कों से छोटे होते हैं (लगभग 50 मिनट), इसीलिए वे अक्सर जागते हैं। सबसे अच्छा तरीका है उनके संकेतों को follow करना — आँखें मलना, जम्हाई लेना या मुँह फेरना। जल्दी respond करने से overtiredness रुकती है जो नींद और मुश्किल बना देती है। Week 4 से एक consistent pre-sleep routine शुरू करें — मद्धिम रोशनी, गर्म स्नान, धीमा गाना।",
      hinglish: "Newborns din mein 14-17 ghante sote hain — 45-90 minute ke chhote bursts mein. Unke sleep cycles adults se chhote hote hain (lagbhag 50 minute), isliye woh aksar jagte hain. Sabse accha hai unke cues follow karna — aankhen malana, jamhaayi lena ya muh pherna. Jaldi respond karna overtiredness rokta hai jo neend aur mushkil banati hai. Week 4 se ek consistent pre-sleep routine shuru karein — maddham roshni, garam nahaana, dheema gaana.",
    },
  },
  {
    id: "a2",
    title: { en: "Tummy Time Basics", hi: "टमी टाइम की बुनियाद", hinglish: "Tummy Time Basics" },
    age: "0-2", duration: "3 min", emoji: "🐢",
    scripts: {
      en: "Tummy time builds the neck, shoulder, and core muscles babies need to roll, sit, and crawl. Start with 2–3 minutes, 2–3 times a day, from the very first week home. Use a rolled towel under the chest for support. Make it fun: lie face-to-face with your baby, use a mirror, or place a high-contrast toy in front. By 4 months, most babies can lift their head 90 degrees. If your baby hates it, try tummy time on your chest or lap first.",
      hi: "Tummy time से बच्चे की गर्दन, कंधे और core muscles बनती हैं जो बाद में करवट लेने, बैठने और रेंगने के लिए जरूरी हैं। घर आने के पहले हफ्ते से शुरू करें — दिन में 2-3 बार, 2-3 मिनट। Support के लिए सीने के नीचे मुड़ा हुआ तौलिया रखें। इसे मज़ेदार बनाएं: आमने-सामने लेटें, आईना इस्तेमाल करें या high-contrast खिलौना सामने रखें। 4 महीने तक ज़्यादातर बच्चे सिर 90 डिग्री उठा सकते हैं। अगर बच्चा पसंद न करे तो अपने सीने पर rummy time try करें।",
      hinglish: "Tummy time se baby ki gardan, kandhe aur core muscles banti hain jo baad mein palatne, baithne aur ghutnon ke balne ke liye zaruri hain. Ghar aane ke pehle hafte se shuru karein — din mein 2-3 baar, 2-3 minute. Support ke liye seene ke neeche moda hua towel rakhein. Ise mazedaar banayein: aamnae-samnae letein, mirror use karein ya high-contrast toy saamne rakhein. 4 mahine tak zyaadatar bacche sar 90 degree uthaa lete hain. Agar baccha pasand na kare toh apne seene par tummy time try karein.",
    },
  },
  {
    id: "a3",
    title: { en: "Responsive Feeding", hi: "बच्चे के संकेतों पर दूध पिलाना", hinglish: "Responsive Feeding" },
    age: "0-2", duration: "3 min", emoji: "🍼",
    scripts: {
      en: "Responsive feeding means following your baby's hunger and fullness cues rather than a strict schedule. Look for rooting, sucking motions, or hands moving toward the mouth as early hunger signals — crying is a late cue. Feed until satisfied, not until a bottle is empty. This builds a healthy relationship with food and trust. Research shows responsive feeding is linked to better self-regulation, healthy weight, and stronger attachment.",
      hi: "Responsive feeding का मतलब है बच्चे के भूख और तृप्ति के संकेतों को follow करना — घड़ी के schedule को नहीं। Rooting, चूसने की हरकत या हाथ मुँह की तरफ जाना शुरुआती भूख के संकेत हैं — रोना देर का संकेत है। जब तक संतुष्ट न हो तब तक खिलाएं, बोतल खाली होने तक नहीं। इससे खाने के साथ healthy रिश्ता और trust बनता है। Research बताती है responsive feeding बेहतर self-regulation, healthy weight और मजबूत attachment से जुड़ी है।",
      hinglish: "Responsive feeding matlab hai baby ke bhooke aur pet bhare hone ke signs follow karna — strict schedule nahi. Rooting, chusne ki harkat ya haath muh ki taraf jaana early hunger ke signs hain — rona late cue hai. Jab tak satisfied na ho tab tak khilayein, bottle khaali hone tak nahi. Isse khaane ke saath healthy rishta aur trust banta hai. Research batati hai responsive feeding behtar self-regulation, healthy weight aur mazboot attachment se judi hai.",
    },
  },

  // 2-4 ──────────────────────────────────────────────────────────────────
  {
    id: "b1",
    title: { en: "Toddler Tantrums", hi: "Toddler का Tantrum", hinglish: "Toddler Tantrums" },
    age: "2-4", duration: "4 min", emoji: "😤",
    scripts: {
      en: "Tantrums peak between ages 2 and 3 because children have big emotions but immature prefrontal cortices — the part of the brain that manages them. The most effective response is calm consistency. Stay close, name the emotion: 'You're really frustrated.' Don't try to reason mid-tantrum — the thinking brain is offline. After it passes, reconnect with a hug, then briefly discuss what happened. Prevention: hunger, tiredness, and overstimulation are the biggest triggers. Two-minute warnings before transitions help enormously.",
      hi: "Tantrum 2-3 साल में सबसे ज्यादा होते हैं क्योंकि बच्चों में बड़ी भावनाएं होती हैं पर prefrontal cortex अभी अविकसित होता है। सबसे effective response है शांत consistency। पास रहें, emotion को नाम दें: 'तुम बहुत frustrated हो।' Tantrum के बीच में reason न करें — सोचने वाला brain offline होता है। बाद में गले लगाएं और briefly बात करें। बचाव: भूख, थकान और overstimulation सबसे बड़े triggers हैं। Transition से 2 मिनट पहले warning बहुत मदद करती है।",
      hinglish: "Tantrum 2-3 saal mein sabse zyaada hote hain kyunki bachon mein badi feelings hoti hain par prefrontal cortex abhi immature hota hai. Sabse effective response hai shant consistency. Paas rahein, emotion ko naam dein: 'Tum bahut frustrated ho.' Tantrum ke beech reason na karein — sochne wala brain offline hota hai. Baad mein gale lagayein aur briefly baat karein. Prevention: bhoookh, thakaan aur overstimulation sabse bade triggers hain. Transition se 2 minute pehle warning bahut madad karti hai.",
    },
  },
  {
    id: "b2",
    title: { en: "Language Explosion", hi: "भाषा का विस्फोट", hinglish: "Language Explosion" },
    age: "2-4", duration: "3 min", emoji: "💬",
    scripts: {
      en: "Between 18 months and 3 years, most children add up to 10 new words a day. The single biggest predictor of vocabulary size is how much parents talk to and with their child — not at them. Use parallel talk: narrate what you both are doing. Expand their sentences: if they say 'more milk', you say 'you want more milk, here you go'. Read together daily — even the same books repeatedly. Dual-language children may mix languages, which is completely normal and a cognitive advantage.",
      hi: "18 महीने से 3 साल के बीच ज्यादातर बच्चे रोज़ 10 नए शब्द सीखते हैं। Vocabulary का सबसे बड़ा predictor है माता-पिता कितना बच्चे से बात करते हैं — उन पर नहीं। Parallel talk करें: जो आप दोनों कर रहे हैं उसे narrate करें। उनके sentences expand करें: अगर वे 'aur doodh' कहते हैं तो आप कहें 'तुम aur doodh chahte ho, lo'। रोज़ साथ पढ़ें — एक ही किताब बार-बार भी ठीक है। दो भाषाओं वाले बच्चे भाषाएं mix कर सकते हैं — यह बिल्कुल normal और cognitive advantage है।",
      hinglish: "18 mahine se 3 saal ke beech zyaadatar bacche roz 10 naye words seekhte hain. Vocabulary ka sabse bada predictor hai parents kitna bacche se baat karte hain — unpar nahi. Parallel talk karein: jo aap dono kar rahe hain use narrate karein. Unke sentences expand karein: agar woh 'aur doodh' kehte hain toh aap kahein 'tum aur doodh chahte ho, lo'. Roz saath padhein — ek hi kitaab baar baar bhi theek hai. Do bhashao wale bacche languages mix kar sakte hain — yeh bilkul normal aur cognitive advantage hai.",
    },
  },
  {
    id: "b3",
    title: { en: "Screen Time for Toddlers", hi: "Toddlers के लिए Screen Time", hinglish: "Toddlers ke liye Screen Time" },
    age: "2-4", duration: "3 min", emoji: "📱",
    scripts: {
      en: "WHO and AAP guidelines suggest under 1 hour of high-quality screen time per day for ages 2–5, with a parent present when possible. The problem isn't screens — it's displacement of talk, play, and sleep. Video chat with grandparents counts as quality screen time. Educational apps with two-way interaction (where the child must respond) are better than passive watching. The best habit: no screens 1 hour before bedtime, no screens during meals, and always discuss what you watched together.",
      hi: "WHO और AAP guidelines 2-5 साल के बच्चों के लिए रोज़ 1 घंटे से कम high-quality screen time suggest करते हैं — अगर हो सके तो parent साथ हो। Problem screens नहीं हैं — बात, खेल और नींद का displacement है। दादा-दादी से video call quality screen time में गिना जाता है। Two-way interaction वाले educational apps passive देखने से बेहतर हैं। Best habit: सोने से 1 घंटे पहले screen नहीं, खाने के दौरान screen नहीं, और हमेशा साथ में discuss करें।",
      hinglish: "WHO aur AAP guidelines 2-5 saal ke bachon ke liye roz 1 ghante se kam high-quality screen time suggest karte hain — ho sake toh parent saath ho. Problem screens nahi hai — baat, khel aur neend ka displacement hai. Daada-daadi se video call quality screen time mein count hoti hai. Two-way interaction wale educational apps passive dekhne se behtar hain. Best habit: sone se 1 ghante pehle screen nahi, khaane ke dauran screen nahi, aur hamesha saath discuss karein.",
    },
  },

  // 5-7 ──────────────────────────────────────────────────────────────────
  {
    id: "c1",
    title: { en: "Building Reading Habits", hi: "पढ़ने की आदत बनाना", hinglish: "Reading Habits Banana" },
    age: "5-7", duration: "4 min", emoji: "📚",
    scripts: {
      en: "The 5–7 window is when children move from learning to read to reading to learn — a critical transition. Reading aloud together even after children can read independently accelerates vocabulary and comprehension. Create a reading ritual: same time daily, cozy spot, no pressure to read perfectly. Let children choose books. Comic books and non-fiction count. Libraries remove cost as a barrier. Research shows children who read for 20 minutes a day are exposed to 1.8 million words a year more than those who don't.",
      hi: "5-7 साल का दौर वह है जब बच्चे पढ़ना सीखने से पढ़कर सीखने की तरफ जाते हैं। साथ ज़ोर से पढ़ना vocabulary और comprehension बढ़ाता है — जब बच्चा खुद पढ़ सकता हो तब भी। एक reading ritual बनाएं: रोज़ एक ही समय, आरामदेह जगह, कोई pressure नहीं। बच्चों को किताब चुनने दें। Comics और non-fiction भी count होती हैं। Research बताती है जो बच्चे रोज़ 20 मिनट पढ़ते हैं उन्हें साल में 18 लाख ज़्यादा words मिलते हैं।",
      hinglish: "5-7 saal ka daur woh hai jab bacche padhna seekhne se pad'hkar seekhne ki taraf jaate hain. Saath zor se padhna vocabulary aur comprehension badhata hai — jab baccha khud padh sakta ho tab bhi. Ek reading ritual banayein: roz ek hi waqt, aaram'deha jagah, koi pressure nahi. Bachon ko kitaab chunne dein. Comics aur non-fiction bhi count hoti hain. Research batati hai jo bacche roz 20 minute padhte hain unhe saal mein 18 lakh zyaada words milte hain.",
    },
  },
  {
    id: "c2",
    title: { en: "School Anxiety", hi: "स्कूल की चिंता", hinglish: "School Anxiety" },
    age: "5-7", duration: "4 min", emoji: "🎒",
    scripts: {
      en: "School anxiety is very common in the 5–7 range during transitions — new school year, new teacher, or after illness. Validate the feeling first: 'It makes sense you feel nervous.' Avoid excessive reassurance loops (which backfire) and instead focus on coping: 'What's one thing that might be okay today?' Maintain a predictable morning routine — chaos amplifies anxiety. Coordinate with the teacher for a check-in strategy. If avoidance is severe or physical symptoms appear regularly, consult a paediatric psychologist.",
      hi: "5-7 साल में school anxiety बहुत सामान्य है — खासकर transition में: नया school year, नया teacher या बीमारी के बाद। पहले feeling को validate करें: 'यह समझ में आता है कि तुम nervous हो।' ज़्यादा reassurance से बचें (उल्टा असर होता है) — बजाय coping पर focus करें: 'एक चीज़ जो आज ठीक हो सकती है वह क्या है?' Morning routine predictable रखें। Teacher के साथ check-in strategy तय करें। अगर avoidance गंभीर हो या regular physical symptoms आएं तो paediatric psychologist से मिलें।",
      hinglish: "5-7 saal mein school anxiety bahut saamaan hai — khaaskar transition mein: naya school year, naya teacher ya beemar'i ke baad. Pehle feeling validate karein: 'Yeh samajh mein aata hai ki tum nervous ho.' Zyaada reassurance se bachein (ulta asar hota hai) — bajaye coping par focus karein: 'Ek cheez jo aaj theek ho sakti hai woh kya hai?' Morning routine predictable rakhein. Teacher ke saath check-in strategy tay karein. Agar avoidance gambhir ho ya regular physical symptoms aayen toh paediatric psychologist se milein.",
    },
  },
  {
    id: "c3",
    title: { en: "Emotional Coaching", hi: "Emotional Coaching", hinglish: "Emotional Coaching" },
    age: "5-7", duration: "4 min", emoji: "❤️",
    scripts: {
      en: "Emotional coaching is the parenting approach most strongly linked to children's social competence and academic achievement. It has 5 steps: notice the emotion, see it as a teaching moment, listen and validate, name the emotion, and then problem-solve together. The opposite — dismissing ('You're fine') or punishing emotions ('Stop crying or I'll give you something to cry about') — suppresses emotional development. Children who are emotionally coached show better stress responses, stronger friendships, and lower rates of anxiety and depression.",
      hi: "Emotional coaching वह parenting approach है जो बच्चों की social competence और academic achievement से सबसे ज्यादा जुड़ी है। इसके 5 कदम हैं: emotion को notice करना, इसे teaching moment मानना, सुनना और validate करना, emotion को नाम देना, फिर साथ problem-solve करना। विपरीत — dismiss करना ('तुम ठीक हो') या emotions को punish करना — emotional development को दबाता है। Emotionally coached बच्चे बेहतर stress response, मज़बूत दोस्तियाँ और कम anxiety दिखाते हैं।",
      hinglish: "Emotional coaching woh parenting approach hai jo bachon ki social competence aur academic achievement se sabse zyaada judi hai. Iske 5 kadam hain: emotion ko notice karna, ise teaching moment maanna, sunna aur validate karna, emotion ko naam dena, phir saath problem-solve karna. Ulta — dismiss karna ('tum theek ho') ya emotions punish karna — emotional development ko dabata hai. Emotionally coached bacche behtar stress response, mazboot dostiyaan aur kam anxiety dikhate hain.",
    },
  },

  // 8-10 ─────────────────────────────────────────────────────────────────
  {
    id: "d1",
    title: { en: "Homework Motivation", hi: "Homework की Motivation", hinglish: "Homework Motivation" },
    age: "8-10", duration: "4 min", emoji: "✏️",
    scripts: {
      en: "Motivation research consistently shows that autonomy, competence, and connection drive intrinsic motivation better than rewards and punishments. For homework: let children choose when and where within limits ('you can do it before or after dinner'). Break large tasks into 20-minute chunks. Celebrate effort and strategy, not just results: 'You really stuck with that hard problem.' Avoid hovering — struggle is where learning happens. If power struggles are chronic, speak with the teacher about workload or check for an undiagnosed learning difference.",
      hi: "Motivation research बताती है कि autonomy, competence और connection rewards और punishments से बेहतर intrinsic motivation drive करते हैं। Homework के लिए: limits के अंदर बच्चे को choose करने दें ('dinner से पहले या बाद में करो')। बड़े tasks को 20-20 मिनट में तोड़ें। Result ही नहीं, effort और strategy celebrate करें: 'तुमने वह मुश्किल problem नहीं छोड़ी।' Hover करने से बचें — struggle ही learning होती है। अगर power struggles chronic हों तो teacher से workload के बारे में बात करें।",
      hinglish: "Motivation research batati hai ki autonomy, competence aur connection rewards aur punishments se behtar intrinsic motivation drive karte hain. Homework ke liye: limits ke andar bacche ko choose karne dein ('dinner se pehle ya baad mein karo'). Bade tasks ko 20-20 minute mein todein. Result hi nahi, effort aur strategy celebrate karein: 'Tum'ne woh mushkil problem nahi chhhodi.' Hover karne se bachein — struggle hi learning hai. Agar power struggles chronic hon toh teacher se workload ke baare mein baat karein.",
    },
  },
  {
    id: "d2",
    title: { en: "Peer Pressure & Friendships", hi: "Peer Pressure और दोस्ती", hinglish: "Peer Pressure aur Dosti" },
    age: "8-10", duration: "3 min", emoji: "👫",
    scripts: {
      en: "Ages 8–10 mark the shift from family as the primary social world to peers. Children this age are intensely concerned with belonging. Build a strong home base: regular one-on-one time, open dinner conversations, and genuine interest in their social world without interrogating. Teach the 'broken record' technique for peer pressure: simply repeat your position calmly. Help them identify at least one trusted adult at school. Research shows children with even one close friendship have dramatically better mental health outcomes.",
      hi: "8-10 साल की उम्र में family से peers की तरफ primary social world shift होती है। इस उम्र के बच्चे belong करने की गहरी चिंता रखते हैं। एक मज़बूत घरेलू base बनाएं: regular 1:1 time, खुली dinner conversations और उनकी social दुनिया में genuine दिलचस्पी — पूछताछ नहीं। Peer pressure के लिए 'broken record' technique सिखाएं: शांति से अपनी बात repeat करते रहें। School में कम से कम एक trusted adult identify करने में मदद करें। Research बताती है एक भी close friendship होने से mental health बहुत बेहतर होती है।",
      hinglish: "8-10 saal mein family se peers ki taraf primary social world shift hoti hai. Is umra ke bacche belong karne ki gehri chinta rakhte hain. Ek mazboot ghar ka base banayein: regular 1:1 time, khuli dinner baatein aur unki social duniya mein genuine dilchaspi — poochhataach nahi. Peer pressure ke liye 'broken record' technique sikhayen: shanti se apni baat repeat karte rahein. School mein kam se kam ek trusted adult identify karne mein madad karein. Research batati hai ek bhi close friendship hone se mental health bahut behtar hoti hai.",
    },
  },

  // 10+ ──────────────────────────────────────────────────────────────────
  {
    id: "e1",
    title: { en: "Talking to Teens", hi: "Teens से बात करना", hinglish: "Teens se Baat Karna" },
    age: "10+", duration: "5 min", emoji: "🎧",
    scripts: {
      en: "The teenage brain prioritises peer opinion and novelty because the reward system develops earlier than the prefrontal cortex. This makes risk-taking and peer influence peak behaviours — not defiance. The most predictive factor of teen wellbeing is whether they feel they can come to a parent without being lectured. Practice the 20-second rule: listen for at least 20 seconds before speaking. Ask open questions. Share your own experiences non-judgementally. Repair after arguments quickly — 'I got frustrated and I could have listened better.'",
      hi: "Teenage brain peer opinion और novelty को priority देता है क्योंकि reward system prefrontal cortex से पहले develop होता है। इससे risk-taking और peer influence peak behaviours बनते हैं — defiance नहीं। Teen wellbeing का सबसे बड़ा predictor यह है कि क्या वे बिना lecture के parent के पास आ सकते हैं। 20-second rule practice करें: बोलने से पहले कम से कम 20 सेकंड सुनें। Open questions पूछें। अपने अनुभव non-judgementally share करें। झगड़े के बाद जल्दी repair करें — 'मुझे frustration आ गया और मैं बेहतर सुन सकता था।'",
      hinglish: "Teenage brain peer opinion aur novelty ko priority deta hai kyunki reward system prefrontal cortex se pehle develop hota hai. Isse risk-taking aur peer influence peak behaviours bante hain — defiance nahi. Teen wellbeing ka sabse bada predictor yeh hai ki kya woh bina lecture ke parent ke paas aa sakte hain. 20-second rule practice karein: bolne se pehle kam se kam 20 second sunein. Open questions puchein. Apne anubhav non-judgementally share karein. Jhagde ke baad jaldi repair karein — 'Mujhe frustration aa gaya aur main behtar sun sakta tha.'",
    },
  },
  {
    id: "e2",
    title: { en: "Digital Safety for Older Kids", hi: "बड़े बच्चों के लिए Digital Safety", hinglish: "Bade Bachon ke liye Digital Safety" },
    age: "10+", duration: "4 min", emoji: "🔒",
    scripts: {
      en: "Research on digital wellbeing shows that rules without explanation backfire with older children. Instead, co-create agreements: what platforms, how long, where devices sleep at night (not in bedrooms). Teach them to evaluate sources, spot manipulation, and protect their personal information. Have explicit conversations about sexting and its legal consequences before they encounter pressure — studies show this reduces incidence. Model the behaviour you want: phones away at meals, no scrolling while talking.",
      hi: "Digital wellbeing की research बताती है कि explanation के बिना rules older बच्चों पर उल्टा असर डालते हैं। बजाय इसके, साथ मिलकर agreements बनाएं: कौन से platforms, कितनी देर, रात को devices कहाँ रहें (bedroom में नहीं)। Sources evaluate करना, manipulation पहचानना और personal information protect करना सिखाएं। Sexting और उसके legal consequences के बारे में pressure आने से पहले बात करें — studies इसका incidence कम दिखाती हैं। जो behavior चाहते हैं खुद वैसा करें।",
      hinglish: "Digital wellbeing ki research batati hai ki explanation ke bina rules older bachon par ulta asar dalte hain. Bajaye, saath milkar agreements banayein: kaun se platforms, kitni der, raat ko devices kahan rahein (bedroom mein nahi). Sources evaluate karna, manipulation pahchanna aur personal information protect karna sikhayen. Sexting aur uske legal consequences ke baare mein pressure aane se pehle baat karein — studies iska incidence kam dikhati hain. Jo behavior chahte hain khud waisa karein.",
    },
  },
  {
    id: "e3",
    title: { en: "Supporting Teen Mental Health", hi: "Teen के Mental Health को Support करें", hinglish: "Teen ke Mental Health ko Support Karein" },
    age: "10+", duration: "5 min", emoji: "🌱",
    scripts: {
      en: "1 in 5 teenagers experience a mental health condition — most go undetected and untreated. Warning signs include: persistent sadness or irritability, social withdrawal, sleep changes, declining grades, giving away possessions. If you're concerned, say so directly: 'I've noticed you seem down lately. I'm not going anywhere — I want to understand.' Avoid minimising ('everyone feels like that') or catastrophising. Seek assessment early; most conditions respond well to therapy when caught before they're entrenched. Your relationship is the most protective factor.",
      hi: "5 में से 1 किशोर mental health condition experience करता है — ज्यादातर undetected और untreated रहते हैं। Warning signs: लगातार उदासी या चिड़चिड़ापन, social withdrawal, नींद में बदलाव, grades गिरना, चीज़ें दूसरों को देना। अगर चिंतित हैं तो सीधे बोलें: 'मैंने देखा है तुम कुछ time से ठीक नहीं लग रहे। मैं कहीं नहीं जा रहा — समझना चाहता हूं।' Minimise या catastrophise न करें। जल्दी assessment लें — जल्दी catch होने पर ज्यादातर conditions therapy से ठीक होती हैं।",
      hinglish: "5 mein se 1 teenager mental health condition experience karta hai — zyaadatar undetected aur untreated rehte hain. Warning signs: lagaataar udaasi ya chidchidaapan, social withdrawal, neend mein badlaav, grades girna, cheezein doosron ko dena. Agar chintit hain toh seedha bolein: 'Mujhe dikha hai tum kuch time se theek nahi lag rahe. Main kahin nahi ja raha — samajhna chahta hoon.' Minimise ya catastrophise na karein. Jaldi assessment lein — jaldi catch hone par zyaadatar conditions therapy se theek hoti hain.",
    },
  },
];

// ── Age bucket labels ──────────────────────────────────────────────────────
const AGE_LABELS: Record<AgeBucket, Record<LangCode, string>> = {
  "0-2":  { en: "0–2 yrs", hi: "0–2 साल", hinglish: "0–2 saal" },
  "2-4":  { en: "2–4 yrs", hi: "2–4 साल", hinglish: "2–4 saal" },
  "5-7":  { en: "5–7 yrs", hi: "5–7 साल", hinglish: "5–7 saal" },
  "8-10": { en: "8–10 yrs", hi: "8–10 साल", hinglish: "8–10 saal" },
  "10+":  { en: "10+ yrs", hi: "10+ साल", hinglish: "10+ saal" },
};
const AGE_EMOJIS: Record<AgeBucket, string> = {
  "0-2": "👶", "2-4": "🧒", "5-7": "🎨", "8-10": "📚", "10+": "🎒",
};
const AGE_ORDER: AgeBucket[] = ["0-2", "2-4", "5-7", "8-10", "10+"];

// ── Simulated TTS player ───────────────────────────────────────────────────
function usePlayer(lessonId: string | null) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef  = useRef(0);
  const TOTAL_SECS  = 240;

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [lessonId]);

  const play = () => {
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      const pct = Math.min(elapsedRef.current / TOTAL_SECS, 1);
      setProgress(pct);
      if (pct >= 1) { clearInterval(intervalRef.current!); setPlaying(false); }
    }, 1000);
  };
  const pause = () => {
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  const skip = (delta: number) => {
    elapsedRef.current = Math.max(0, Math.min(TOTAL_SECS, elapsedRef.current + delta));
    setProgress(elapsedRef.current / TOTAL_SECS);
  };
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60); const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  return { playing, progress, play, pause, skip, elapsed: elapsedRef.current, total: TOTAL_SECS, formatTime };
}

export default function AudioLessonsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [selectedAge, setSelectedAge] = useState<AgeBucket>("2-4");
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);
  const lessons = useMemo(() => LESSONS.filter(l => l.age === selectedAge), [selectedAge]);
  const player = usePlayer(openLesson?.id ?? null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pulsePlay = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const introText = lang === "hi"
    ? "हाथ भरे हैं? Amy आपको बच्चे की उम्र के हिसाब से जरूरी parenting topics समझाएगी। हर lesson 3–5 मिनट का है।"
    : lang === "hinglish"
    ? "Haath bhare hain? Amy aapko bacche ki umra ke hisaab se important topics samjhayegi. Har lesson 3–5 minute ka hai."
    : "Hands full? Let Amy talk you through the most important parenting topics for your child's age. Each lesson is 3–5 minutes.";

  return (
    <LinearGradient colors={["#0f0c29", "#1a1040", "#0c1220"]} style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#c4b5fd" />
        </TouchableOpacity>
        <Ionicons name="headset" size={20} color="#c4b5fd" style={{ marginRight: 6 }} />
        <Text style={styles.headerTitle}>Amy Audio Lessons</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Text style={styles.intro}>{introText}</Text>

        {/* Age selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.agePills} style={{ marginBottom: 20 }}>
          {AGE_ORDER.map(key => {
            const active = key === selectedAge;
            const label = `${AGE_EMOJIS[key]} ${AGE_LABELS[key][lang as LangCode] ?? AGE_LABELS[key].en}`;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => { setSelectedAge(key); setOpenLesson(null); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                activeOpacity={0.8}
              >
                {active ? (
                  <LinearGradient colors={[brand.primary, "#ec4899"]} style={styles.pill}>
                    <Text style={styles.pillTextActive}>{label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.pillInactive}>
                    <Text style={styles.pillText}>{label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lesson list */}
        {lessons.map(lesson => {
          const isOpen = openLesson?.id === lesson.id;
          const title = getTitle(lesson, lang);
          const script = getScript(lesson, lang);
          return (
            <View key={lesson.id} style={[styles.lessonCard, isOpen && styles.lessonCardOpen]}>
              <TouchableOpacity
                onPress={() => { setOpenLesson(isOpen ? null : lesson); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                activeOpacity={0.85}
                style={styles.lessonHeader}
              >
                <View style={styles.lessonEmoji}><Text style={{ fontSize: 26 }}>{lesson.emoji}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lessonTitle}>{title}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <Ionicons name="time-outline" size={11} color="#a99fd9" />
                    <Text style={styles.lessonMeta}>{lesson.duration}</Text>
                  </View>
                </View>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#a99fd9" />
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.playerWrap}>
                  {/* Progress bar */}
                  <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressFill, { width: `${player.progress * 100}%` as any }]} />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                    <Text style={styles.timeText}>{player.formatTime(player.elapsed)}</Text>
                    <Text style={styles.timeText}>{lesson.duration}</Text>
                  </View>

                  {/* Controls */}
                  <View style={styles.controls}>
                    <TouchableOpacity onPress={() => player.skip(-15)} style={styles.skipBtn} activeOpacity={0.7}>
                      <Ionicons name="play-back" size={22} color="#c4b5fd" />
                    </TouchableOpacity>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                      <TouchableOpacity
                        onPress={() => { pulsePlay(); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); player.playing ? player.pause() : player.play(); }}
                        style={styles.playBtn} activeOpacity={0.85}
                      >
                        <LinearGradient colors={[brand.primary, "#ec4899"]} style={styles.playBtnGrad}>
                          <Ionicons name={player.playing ? "pause" : "play"} size={26} color="#fff" />
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                    <TouchableOpacity onPress={() => player.skip(15)} style={styles.skipBtn} activeOpacity={0.7}>
                      <Ionicons name="play-forward" size={22} color="#c4b5fd" />
                    </TouchableOpacity>
                  </View>

                  {/* Script preview */}
                  <Text style={styles.script} numberOfLines={5}>{script}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(139,92,246,0.2)",
    gap: 6,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(167,139,250,0.15)",
    alignItems: "center", justifyContent: "center", marginRight: 4,
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  intro: { color: "#c7c0e8", fontSize: 13, lineHeight: 20, marginVertical: 16 },
  agePills: { gap: 8, paddingVertical: 4 },
  pill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  pillInactive: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
    borderWidth: 1, borderColor: "rgba(139,92,246,0.35)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  pillText: { color: "#c4b5fd", fontSize: 13, fontWeight: "600" },
  pillTextActive: { color: "#fff", fontSize: 13, fontWeight: "700" },
  lessonCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(139,92,246,0.25)",
    borderRadius: 16, marginBottom: 10, overflow: "hidden",
  },
  lessonCardOpen: { borderColor: brand.primary + "60" },
  lessonHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  lessonEmoji: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(139,92,246,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  lessonTitle: { color: "#fff", fontSize: 14, fontWeight: "800", lineHeight: 19 },
  lessonMeta: { color: "#a99fd9", fontSize: 11 },
  playerWrap: { paddingHorizontal: 16, paddingBottom: 16 },
  progressTrack: {
    height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: brand.primary },
  timeText: { color: "#a99fd9", fontSize: 11 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginVertical: 16 },
  skipBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  playBtn: { width: 60, height: 60, borderRadius: 30, overflow: "hidden" },
  playBtnGrad: { width: 60, height: 60, alignItems: "center", justifyContent: "center" },
  script: {
    color: "#c7c0e8", fontSize: 12.5, lineHeight: 18.5,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10, padding: 12,
  },
});
