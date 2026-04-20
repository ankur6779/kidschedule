export type AgeBucket = "0-2" | "2-4" | "5-7" | "8-10" | "10+";
export type LangCode = "en" | "hi" | "hinglish";

export interface MultiLang {
  en: string;
  hi: string;
  hinglish: string;
}

export interface Lesson {
  id: string;
  title: MultiLang;
  description: MultiLang;
  durationMin: number;
  ageBucket: AgeBucket;
  emoji: string;
  expert: string;
  paragraphs: {
    en: string[];
    hi: string[];
    hinglish: string[];
  };
}

export function getLessonText(lesson: Lesson, lang: string) {
  const l: LangCode = lang === "hi" ? "hi" : lang === "hinglish" ? "hinglish" : "en";
  return {
    title: lesson.title[l],
    description: lesson.description[l],
    paragraphs: lesson.paragraphs[l],
  };
}

const L = (l: Lesson): Lesson => l;

export const LESSONS: Lesson[] = [
  // ─── 0–2 yrs ─────────────────────────────────────────────────────
  L({
    id: "infant-sleep-foundations",
    title: {
      en: "The Sleep Foundations Every Newborn Parent Needs",
      hi: "हर नए माता-पिता के लिए जरूरी नींद की बुनियाद",
      hinglish: "Naye Parent ke Liye Zaroori Neend ki Buniyad",
    },
    description: {
      en: "Wake windows, drowsy-but-awake, the 4-month sleep regression — explained simply.",
      hi: "वेक विंडो, नींद के चरण और 4 महीने की रिग्रेशन — सरल भाषा में।",
      hinglish: "Wake windows, drowsy-but-awake, aur 4-month sleep regression — simple mein samjhein.",
    },
    durationMin: 4, ageBucket: "0-2", emoji: "🌙", expert: "Based on AAP & Dr Harvey Karp",
    paragraphs: {
      en: [
        "Newborn sleep is not broken — it is biologically designed to be short, fragmented, and frequent. In the first 12 weeks, your baby has no circadian rhythm yet. Their melatonin production matures around week 8 to 12, which is why bedtimes start to settle only after that point.",
        "The single most useful tool in the first year is the wake window. A wake window is the time your baby stays awake between sleeps. For 0 to 8 weeks it is roughly 45 to 60 minutes. For 3 to 4 months it grows to 75 to 90 minutes. Putting your baby down before they cross their wake window is the #1 way to avoid the over-tired, hard-to-settle spiral.",
        "Place your baby in the crib drowsy but awake. This sounds clinical but it is the bedrock of independent sleep. If they always fall asleep on the breast, bottle, or in your arms, they will wake every sleep cycle (about every 45 minutes) and look for that exact same condition to fall back asleep.",
        "The 4-month sleep regression is not a regression — it is a permanent reorganisation of your baby's sleep architecture. Their sleep now has cycles like an adult, but they do not yet know how to bridge those cycles on their own. This is the right moment to gently teach independent sleep.",
        "Most importantly: a 'good sleeper' is largely made, not born. Consistency over the same 2 weeks beats any single technique. Pick one approach, and stick with it.",
      ],
      hi: [
        "नवजात की नींद टूटी-टूटी लगती है, लेकिन यह जैविक रूप से ऐसे ही बनी है। पहले 12 हफ्तों में शिशु की कोई सर्कैडियन लय नहीं होती। मेलाटोनिन उत्पादन 8-12 हफ्तों में शुरू होता है, तब जाकर सोने का समय स्थिर होता है।",
        "पहले साल में सबसे उपयोगी चीज़ है 'वेक विंडो' — दो नींदों के बीच जागने का समय। 0-8 हफ्तों में यह 45-60 मिनट होता है, 3-4 महीनों में 75-90 मिनट। वेक विंडो पार होने से पहले ही बच्चे को सुलाना सबसे जरूरी है।",
        "बच्चे को नींद आने लगे पर पूरी नींद आने से पहले पालने में रखें। यह 'drowsy but awake' तकनीक स्वतंत्र नींद की नींव है। अगर बच्चा हमेशा गोद या स्तन पर सोता है, तो हर 45 मिनट में उसी स्थिति को ढूंढेगा।",
        "4 महीने की स्लीप रिग्रेशन वास्तव में रिग्रेशन नहीं है — यह नींद की संरचना में स्थायी बदलाव है। अब नींद के चक्र वयस्कों जैसे हो जाते हैं, लेकिन बच्चा अभी उन्हें खुद से जोड़ना नहीं जानता। यही सही समय है धीरे-धीरे स्वतंत्र नींद सिखाने का।",
        "याद रखें: अच्छी नींद लेने वाला बच्चा ज्यादातर बनाया जाता है, पैदा नहीं होता। 2 हफ्तों की एकसमान दिनचर्या किसी भी तकनीक से बेहतर काम करती है।",
      ],
      hinglish: [
        "Newborn ki neend tuti-futi lagti hai, lekin yeh biology ke hisaab se hi aisa hota hai — yeh normal hai. Pehle 12 hafton mein baby ka koi circadian rhythm nahi hota. Melatonin production 8-12 hafte mein develop hoti hai, tab jaake sone ka waqt settle hona shuru hota hai.",
        "Pehle saal ka sabse useful tool hai 'wake window' — do sleeps ke beech jaagne ka time. 0-8 hafte mein yeh 45-60 minutes hota hai, 3-4 mahine mein 75-90 minutes ho jaata hai. Baby ko wake window cross karne se pehle sulana sabse zaroori hai, warna overtired ho jaata hai.",
        "Baby ko 'drowsy but awake' state mein cot mein rakhein — neenda aa rahi ho, par poori neend na aayi ho. Agar woh hamesha breast, bottle ya arms mein sota hai, toh har 45 minute ki sleep cycle mein usi cheez ko dhundhega.",
        "4-month sleep regression asal mein regression nahi hai — yeh sleep architecture ka permanent change hai. Ab baby ki neend adult cycles jaisi ho jaati hai, lekin wo khud se cycles bridge nahi kar paata. Yahi waqt hai gently independent sleep sikhane ka.",
        "Sabse zaroori baat: accha neend lene wala baccha banta hai, paida nahi hota. 2 hafte consistent rehna kisi bhi technique se zyaada kaam karta hai — ek approach choose karein aur usi par tikein.",
      ],
    },
  }),
  L({
    id: "infant-feeding-cues",
    title: {
      en: "Reading Your Baby's Hunger and Fullness Cues",
      hi: "बच्चे की भूख और तृप्ति के संकेत पहचानें",
      hinglish: "Baby ke Bhooke aur Pete Bhare Hone ke Signs Pehchanein",
    },
    description: {
      en: "Stop watching the clock. Read the baby — early hunger, late hunger, fullness signals.",
      hi: "घड़ी देखना बंद करें। बच्चे के संकेत पढ़ें — शुरुआती भूख, देर की भूख, पेट भरने के संकेत।",
      hinglish: "Clock band karein. Baby padhein — early hunger, late hunger, fullness ke signals.",
    },
    durationMin: 3, ageBucket: "0-2", emoji: "🍼", expert: "Based on WHO & Ellyn Satter",
    paragraphs: {
      en: [
        "Babies are born with one of the most reliable hunger and fullness systems in nature. Our job is to not break it. Schedule-feeding by the clock works against this; cue-feeding works with it.",
        "Early hunger cues: stirring, opening the mouth, turning the head and rooting, hand to mouth. This is the ideal time to feed — baby is calm and feeds efficiently.",
        "Mid hunger cues: stretching, increasing physical movement, fussing. You still have a calm window of a few minutes.",
        "Late hunger cues: crying, agitation, red face. Once a baby is crying from hunger, they are too dysregulated to latch well. Calm them first (skin-to-skin, gentle rocking) before offering the feed.",
        "Fullness cues are equally important: turning away, slowing the suck, falling asleep, pushing the bottle out, closing the mouth. Honour them. Forcing a baby to 'finish the bottle' overrides their satiety system and is one of the earliest causes of feeding battles later.",
      ],
      hi: [
        "बच्चे प्रकृति की सबसे भरोसेमंद भूख-तृप्ति प्रणाली के साथ पैदा होते हैं। हमारा काम है इसे बिगाड़ना नहीं। घड़ी के हिसाब से दूध पिलाना इस प्रणाली के खिलाफ काम करता है; संकेतों के अनुसार दूध पिलाना इसके साथ काम करता है।",
        "शुरुआती भूख के संकेत: हलचल करना, मुंह खोलना, सिर घुमाना और मुंह से ढूंढना, हाथ मुंह में डालना। यह दूध पिलाने का आदर्श समय है — बच्चा शांत होता है और अच्छे से दूध पीता है।",
        "बीच की भूख के संकेत: खिंचाव, ज्यादा हलचल, चिड़चिड़ापन। अभी भी कुछ मिनटों की शांत खिड़की बची है।",
        "देर की भूख के संकेत: रोना, बेचैनी, लाल चेहरा। एक बार रोने लगे तो शांत करना जरूरी है — पहले त्वचा से त्वचा का स्पर्श या धीरे हिलाएं, फिर दूध दें।",
        "तृप्ति के संकेत भी उतने ही महत्वपूर्ण हैं: मुंह फेरना, धीरे-धीरे चूसना, सो जाना, बोतल धकेलना। इन्हें मानें। 'बोतल खत्म करो' की जिद बच्चे की तृप्ति प्रणाली को नुकसान पहुंचाती है।",
      ],
      hinglish: [
        "Baby bhookh aur pet bhara hone ki sabse reliable natural system ke saath paida hota hai. Hamare kaam hai isko kharaab na karein. Clock ke hisaab se feed karna is system ke khilaf kaam karta hai; baby ke signals par feed karna sahi hai.",
        "Early hunger ke signs: hilna, muh kholna, sar ghoomana aur rooting, haath muh mein dalna. Yeh doodh pilane ka perfect time hai — baby calm hota hai aur acchi tarah peeta hai.",
        "Mid hunger ke signs: body stretching karna, zyaada movement, thoda fussy hona. Ab bhi kuch minute ka calm window bacha hai.",
        "Late hunger ke signs: rona, restless hona, laal chehra. Ek baar rona shuru ho jaye toh pehle calm karein — skin-to-skin ya gentle rocking — phir doodh dein. Rote hue latch achhi tarah nahi pakad paata.",
        "Fullness ke signs bhi utne hi important hain: muh pherna, dheere-dheere chusna, so jaana, bottle push karna. Inhe respect karein. 'Bottle khatam karo' ki zid baby ki natural satiety system ko break karti hai — baad mein feeding fights ka yahi sabse bada reason banta hai.",
      ],
    },
  }),
  L({
    id: "infant-tummy-time",
    title: {
      en: "Tummy Time: The 5-Minute Habit That Changes Everything",
      hi: "टमी टाइम: 5 मिनट की आदत जो सब बदल देती है",
      hinglish: "Tummy Time: 5-Minute ki Aadat Jo Sab Badal Deti Hai",
    },
    description: {
      en: "Why tummy time matters, when to start, and how to do it without tears.",
      hi: "टमी टाइम क्यों जरूरी है, कब शुरू करें, और बिना रोए कैसे करें।",
      hinglish: "Tummy time kyun zaroori hai, kab start karein, aur bina roye kaise karein.",
    },
    durationMin: 3, ageBucket: "0-2", emoji: "🤸", expert: "Based on AAP & paediatric PT",
    paragraphs: {
      en: [
        "Tummy time is the single most important developmental activity in the first 6 months. It builds neck strength, shoulder stability, core control, and prepares the baby for rolling, sitting, crawling and even later fine-motor skills.",
        "Start from day one. A 1 to 2 minute session 3 to 5 times a day is the goal. By 3 months, aim for 15 to 30 minutes total per day in short bursts.",
        "Most babies hate it at first. That is normal — it is hard work for them. Get down on the floor face-to-face with your baby. Sing, talk, make eye contact. Your face is the best toy.",
        "If your baby cries within seconds, try chest-to-chest tummy time on your reclined body. It still counts.",
        "Skipping tummy time is linked to delayed gross-motor milestones and to plagiocephaly (flat head). Make it a non-negotiable daily ritual, not a 'when I remember' activity.",
      ],
      hi: [
        "टमी टाइम पहले 6 महीनों में सबसे महत्वपूर्ण विकासात्मक गतिविधि है। यह गर्दन की ताकत, कंधे की स्थिरता, और कोर कंट्रोल बनाता है — जो बाद में करवट लेने, बैठने, और रेंगने के लिए जरूरी है।",
        "पहले दिन से शुरू करें। दिन में 3-5 बार 1-2 मिनट का सत्र लक्ष्य है। 3 महीने तक, दिन में कुल 15-30 मिनट का लक्ष्य रखें।",
        "ज्यादातर बच्चे शुरू में इसे नापसंद करते हैं — यह उनके लिए मेहनत का काम है। जमीन पर उतरें और बच्चे से आंखें मिलाएं, गाएं, बात करें। आपका चेहरा सबसे अच्छा खिलौना है।",
        "अगर बच्चा फौरन रोने लगे, तो अपने सीने पर लिटाकर tummy time करें — यह भी उतना ही काम करता है।",
        "टमी टाइम छोड़ने से motor milestones देर से आते हैं और सिर चपटा हो सकता है। इसे रोज़ की जरूरी दिनचर्या बनाएं।",
      ],
      hinglish: [
        "Tummy time pehle 6 mahino ki sabse important developmental activity hai. Isse baby ki gardan, shoulders, aur core strong hoti hai — jo baad mein palat'ne, baithne aur ghutne chalne ke liye zaruri hai.",
        "Pehle din se shuru karein. Din mein 3-5 baar 1-2 minute ka session goal hai. 3 mahine tak, din mein total 15-30 minute tak pahunchein.",
        "Zyaadatar babies pehle ise pasand nahi karte — yeh unke liye mehnat ka kaam hai. Zameen par utar'ke baby se aankhen milayein, gaayein, baat karein. Aapka chehra sabse accha toy hai.",
        "Agar baby turant rona shuru kar de, toh apne seene par lita'ke tummy time karein — yeh bhi utna hi count karta hai.",
        "Tummy time chhod'ne se motor milestones late aate hain aur sir납chahta (flat head) ho sakta hai. Ise roz ki zaruri routine banayein, 'jab yaad aaye' wali activity mat banayen.",
      ],
    },
  }),
  L({
    id: "infant-bonding-language",
    title: {
      en: "How Talking to Your Baby Wires Their Brain",
      hi: "बच्चे से बात करना उनका दिमाग कैसे बनाता है",
      hinglish: "Baby se Baat Karna Unka Dimaag Kaise Banata Hai",
    },
    description: {
      en: "The 30-million-word gap and why narrating your day matters.",
      hi: "3 करोड़ शब्दों का अंतर और रोज़ की बातचीत का महत्व।",
      hinglish: "30-million word gap aur roz narrate karne ki ahmiyat.",
    },
    durationMin: 3, ageBucket: "0-2", emoji: "🧠", expert: "Based on Hart & Risley research",
    paragraphs: {
      en: [
        "By age 4, children from talk-rich homes have heard roughly 30 million more words than children from talk-poor homes. This gap predicts vocabulary, reading readiness, and academic outcomes years later.",
        "The good news: 'talk-rich' is free. Narrate your day. 'Now mama is rinsing the dal, see the bubbles, the water is warm.' Your baby does not understand the words but their brain is laying down the language scaffolding.",
        "Use parentese, not baby talk. Parentese is real words spoken with exaggerated melody, longer vowels and slightly higher pitch. It is the format babies process best.",
        "Pause and wait. When your baby coos or babbles, respond. Then pause. This 'serve and return' is the foundation of conversation and one of the strongest predictors of later language.",
        "Read aloud daily, even at 3 months. The same book over and over is a feature, not a bug — repetition is how language consolidates.",
      ],
      hi: [
        "4 साल की उम्र तक, बात-बहुल घरों के बच्चों ने शांत घरों के बच्चों से लगभग 3 करोड़ ज्यादा शब्द सुने होते हैं। यह अंतर शब्दावली, पढ़ने की तैयारी और शैक्षणिक प्रदर्शन को प्रभावित करता है।",
        "अच्छी बात यह है: बात करना मुफ्त है। अपना दिन बयान करें। 'अभी मम्मा दाल धो रही है, देखो बुलबुले, पानी गर्म है।' बच्चा शब्द नहीं समझता लेकिन दिमाग भाषा का ढांचा बना रहा होता है।",
        "Parentese का उपयोग करें — असली शब्द लेकिन लंबी आवाज़ और ऊंचे सुर में। बच्चे इसे सबसे अच्छे से समझते हैं।",
        "बच्चा जब गुनगुनाए या बोले, तो जवाब दें और फिर रुकें। यह 'serve and return' बातचीत की नींव है और भाषा विकास का सबसे बड़ा संकेतक।",
        "रोज़ ज़ोर से पढ़ें, 3 महीने से भी। एक ही किताब बार-बार पढ़ना फायदेमंद है — दोहराव से ही भाषा पक्की होती है।",
      ],
      hinglish: [
        "4 saal ki umra tak, zyaada baat karne wale ghar ke bachche 3 crore zyaada words sun chuke hote hain. Yeh gap vocabulary, reading readiness aur academic performance ko kaafi baad tak affect karta hai.",
        "Acchi khabar yeh hai: baat karna free hai. Apna din narrate karein. 'Ab mama dal dho rahi hai, dekho bubbles, paani garam hai.' Baby words nahi samajhta lekin brain language ka scaffolding bana raha hota hai.",
        "Parentese use karein — asli words lekin lambi awaaz aur thodi oonji pitch mein. Baby ise sabse achhi tarah process karta hai — baby talk nahi, real words melodically.",
        "Baby jab gungunaye ya bole, toh jawab dein phir ruk'ke intezaar karein. Yeh 'serve and return' baatcheet ki buniyadh hai aur language development ka sabse bada predictor.",
        "Roz zor se padhein, chahe 3 mahine ki umra mein hi ho. Ek hi kitaab baar baar padhna achha hai — repetition se hi language consolidate hoti hai.",
      ],
    },
  }),

  // ─── 2–4 yrs ─────────────────────────────────────────────────────
  L({
    id: "toddler-tantrums-101",
    title: {
      en: "Why Toddlers Tantrum — and What Actually Works",
      hi: "बच्चे क्यों करते हैं गुस्सा — और क्या वाकई काम आता है",
      hinglish: "Toddler Tantrum Kyun Karta Hai — Aur Kya Kaam Aata Hai",
    },
    description: {
      en: "The 'flipped lid' brain, co-regulation, and the 3-step in-the-moment script.",
      hi: "फ्लिप्ड लिड ब्रेन, को-रेगुलेशन और 3 कदमों का स्क्रिप्ट।",
      hinglish: "'Flipped lid' brain, co-regulation, aur 3-step in-the-moment script.",
    },
    durationMin: 4, ageBucket: "2-4", emoji: "🌋", expert: "Based on Dr Dan Siegel & Mona Delahooke",
    paragraphs: {
      en: [
        "A tantrum is not bad behaviour. It is a nervous-system event. The thinking part of your toddler's brain — the prefrontal cortex — is biologically incapable of overriding strong emotion until at least age 5, and is still maturing into the mid-twenties.",
        "Dr Dan Siegel calls this the 'flipped lid'. When a toddler is in tantrum, their downstairs brain has taken over and their upstairs brain is offline. Reasoning, consequences, and lectures literally cannot be processed in this state.",
        "The only thing that works in the moment is co-regulation. Your calm body lends regulation to their dysregulated body. Drop your voice, soften your face, slow your breathing.",
        "The 3-step script: (1) 'You are safe.' (2) 'I am right here.' (3) Silence. Stay close, do not lecture. Wait for the wave to pass. The average tantrum lasts 3 to 5 minutes if you do not pour fuel on it.",
        "Repair after, not during. Once your toddler is calm, hug them and say one short sentence: 'That was big. We figured it out together.' That is the lesson they remember — not the lecture you gave at peak storm.",
      ],
      hi: [
        "गुस्सा या tantrum बुरा व्यवहार नहीं है — यह nervous system की घटना है। बच्चे के दिमाग का सोचने वाला हिस्सा (prefrontal cortex) कम से कम 5 साल तक तेज़ भावनाओं को रोकने में सक्षम नहीं होता।",
        "Dr Dan Siegel इसे 'flipped lid' कहते हैं। Tantrum के दौरान बच्चे का भावनात्मक दिमाग काबिज़ हो जाता है और सोचने वाला हिस्सा बंद हो जाता है। इस अवस्था में समझाना, डांटना या सज़ा — कुछ भी काम नहीं करता।",
        "उस वक्त सिर्फ co-regulation काम करती है। आपका शांत शरीर उनके बेचैन शरीर को शांति देता है। आवाज़ धीमी करें, चेहरा नरम रखें, धीरे-धीरे सांस लें।",
        "3 कदम का script: (1) 'तुम सुरक्षित हो।' (2) 'मैं यहीं हूं।' (3) चुप्पी। पास रहें, भाषण मत दें। तूफान गुज़रने दें। औसत tantrum 3-5 मिनट में खत्म हो जाता है अगर आग में तेल न डालें।",
        "बाद में जोड़ें, बीच में नहीं। शांत होने पर गले लगाएं और एक छोटा वाक्य बोलें: 'यह बहुत मुश्किल था। हमने साथ मिलाकर इसे पार किया।' यही वह lesson है जो बच्चा याद रखता है।",
      ],
      hinglish: [
        "Tantrum bura behavior nahi hai — yeh nervous system ki event hai. Toddler ke brain ka sochne wala hissa (prefrontal cortex) biological roop se kam se kam 5 saal tak strong emotions ko rok nahi sakta.",
        "Dr Dan Siegel ise 'flipped lid' kehte hain. Tantrum ke waqt brain ka emotional hissa control le leta hai aur sochne wala hissa band ho jaata hai. Is halat mein samjhana, daantna ya result dikhana — kuch bhi kaam nahi karta.",
        "Us waqt sirf co-regulation kaam karti hai. Aapka calm body unke dysregulated body ko shanti deta hai. Awaaz dheemi karein, chehra naram rakhein, dheere-dheere saans lein.",
        "3-step script: (1) 'Tum safe ho.' (2) 'Main yahan hoon.' (3) Chup'pi. Paas rahein, lecture mat dein. Toofan guzarne dein. Zyaadatar tantrum 3-5 minute mein khatam ho jaata hai agar aag mein tel na dalein.",
        "Baad mein connect karein, beech mein nahi. Bachcha shant hone par gale lagayein aur ek chhota waqya bolein: 'Yeh bahut bada tha. Humne milke ise handle kiya.' Yahi woh lesson hai jo baccha yaad rakhta hai.",
      ],
    },
  }),
  L({
    id: "toddler-no-phase",
    title: {
      en: "The 'No' Phase: Decoding the Tiny Tyrant",
      hi: "'ना' का दौर: छोटे ज़िद्दी को समझें",
      hinglish: "'Na' Phase: Chhote Ziddi Ko Samjhein",
    },
    description: {
      en: "Why your 2-year-old says no to everything — and the choice trick that ends it.",
      hi: "2 साल का बच्चा हर बात पर 'ना' क्यों कहता है — और choice trick जो काम करती है।",
      hinglish: "2 saal ka baccha har baat pe 'na' kyun kehta hai — aur choice trick jo kaam karti hai.",
    },
    durationMin: 3, ageBucket: "2-4", emoji: "🙅", expert: "Based on Erikson & Janet Lansbury",
    paragraphs: {
      en: [
        "The 'no' phase is not defiance. It is the developmental stage Erik Erikson called Autonomy vs Shame and Doubt. Your toddler is discovering, for the first time, that they are a separate person with their own will.",
        "Saying no is how they practise being themselves. If you crush every no, you can damage this critical sense of agency. If you give in to every no, the home becomes chaos. The middle path is the choice trick.",
        "Replace yes/no questions with two-option choices, both of which you accept. Not 'do you want to wear shoes?' but 'do you want the red shoes or the blue shoes?'. Not 'time for bath' but 'do you want to walk or hop to the bath?'.",
        "Inside the choice, the toddler still feels powerful. Outside the choice, you still set the limit. Both needs are met.",
        "Save your no for the things that truly matter — safety, cruelty, big values. If you are saying no twenty times a day, your toddler will tune you out by lunch.",
      ],
      hi: [
        "'ना' का दौर जिद नहीं है — यह Erikson का Autonomy vs Shame & Doubt का विकासात्मक चरण है। आपका बच्चा पहली बार यह महसूस कर रहा है कि वह एक अलग इंसान है जिसकी अपनी इच्छाएं हैं।",
        "'ना' कहना उनका खुद को अभिव्यक्त करने का तरीका है। हर 'ना' को दबाने से उनकी स्वतंत्रता की भावना कमज़ोर होती है। हर 'ना' मान लेने से घर अस्त-व्यस्त हो जाता है। बीच का रास्ता है choice trick।",
        "हाँ/ना वाले सवाल छोड़ें और दो विकल्प दें — दोनों आपको मंजूर हों। 'जूते पहनोगे?' की जगह 'लाल जूते या नीले जूते?'। 'नहाने चलो' की जगह 'चलकर जाओगे या उछलकर?'।",
        "Choice के अंदर बच्चा ताकतवर महसूस करता है। Choice के बाहर आप अपनी सीमा बनाए रखते हैं। दोनों की जरूरत पूरी होती है।",
        "अपना 'ना' सिर्फ असल जरूरी बातों के लिए बचाएं — सुरक्षा, मूल्य। अगर दिन में बीस बार 'ना' कह रहे हैं, तो बच्चा आपको सुनना बंद कर देगा।",
      ],
      hinglish: [
        "'Na' phase zaidi nahi hai — yeh Erikson ka Autonomy vs Shame & Doubt development stage hai. Aapka toddler pehli baar discover kar raha hai ki woh ek alag insaan hai jiske apne wishes hain.",
        "'Na' kehna unka khud ko express karne ka tarika hai. Har 'na' dabane se unki independence feeling weak hoti hai. Har 'na' maan lene se ghar chaos ban jaata hai. Middle path hai choice trick.",
        "Haan/na wale questions chhod'den aur do options dein — dono aapko accept ho. 'Joote pahno?' ki jagah 'Lal joote ya neele joote?'. 'Nahane chalo' ki jagah 'Chal'ke jaoge ya uchhal'ke?'.",
        "Choice ke andar toddler powerful feel karta hai. Choice ke bahar aap apni limit maintain karte hain. Dono ki zarurat puri hoti hai.",
        "Apna 'na' sirf asli zaroori cheezein ke liye bachayein — safety, bade values. Agar din mein bees baar 'na' keh rahe hain, toh baccha aapko sunna band kar dega.",
      ],
    },
  }),
  L({
    id: "toddler-potty-readiness",
    title: {
      en: "Potty Training: The Readiness Checklist",
      hi: "पॉटी ट्रेनिंग: तैयारी की जांच-सूची",
      hinglish: "Potty Training: Readiness ki Checklist",
    },
    description: {
      en: "Why timing matters more than method, and how to know your child is truly ready.",
      hi: "तरीके से ज्यादा समय क्यों मायने रखता है, और बच्चे की तैयारी कैसे पहचानें।",
      hinglish: "Technique se zyaada timing kyun important hai, aur baccha ready hai ye kaise pehchanein.",
    },
    durationMin: 3, ageBucket: "2-4", emoji: "🚽", expert: "Based on AAP & T. Berry Brazelton",
    paragraphs: {
      en: [
        "Potty training fails most often when the child is not yet ready. The American Academy of Pediatrics is clear: readiness, not age, is the trigger.",
        "Look for these signs together: stays dry for 2 hours or more, predictable bowel movements, can pull pants up and down, shows interest in the toilet, can follow simple instructions, hides to poop, dislikes a wet or dirty nappy.",
        "If five of these seven are present, your child is ready. If fewer, wait. Pushing early is the #1 cause of regressions and battles.",
        "When you start: clear three days. Switch to underwear, not pull-ups. Pull-ups feel like a nappy and confuse the body's signal.",
        "Accidents are not failures — they are data. Stay neutral: 'Pee goes in the potty. Let us clean up together.' No shame, no big celebration either. The body learns fastest in a calm, low-stakes environment.",
      ],
      hi: [
        "पॉटी ट्रेनिंग सबसे ज़्यादा तब विफल होती है जब बच्चा तैयार नहीं होता। American Academy of Pediatrics स्पष्ट है: उम्र नहीं, तैयारी जरूरी है।",
        "ये संकेत देखें: 2 घंटे या ज्यादा सूखा रहना, नियमित मल त्याग, पैंट खुद उतारना-पहनना, टॉयलेट में दिलचस्पी, सरल निर्देश मानना, पूप के लिए छुपना, गीले डायपर से नाराजगी।",
        "सातों में से पांच संकेत हों तो बच्चा तैयार है। कम हों तो इंतजार करें। जल्दी शुरू करना regression और लड़ाइयों का सबसे बड़ा कारण है।",
        "जब शुरू करें: तीन दिन खाली रखें। Underwear पहनाएं, pull-ups नहीं। Pull-ups डायपर जैसे लगते हैं और body का signal confuse करते हैं।",
        "गलतियां विफलता नहीं हैं — ये सूचनाएं हैं। शांत रहें: 'पेशाब potty में होता है। चलो साफ करते हैं।' न शर्मिंदगी, न बड़ा जश्न। शरीर शांत माहौल में सबसे जल्दी सीखता है।",
      ],
      hinglish: [
        "Potty training sabse zyaada tab fail hoti hai jab baccha ready nahi hota. American Academy of Pediatrics clear hai: umra nahi, readiness zaruri hai.",
        "Ye signs dekhen: 2 ghante ya zyaada dry rehna, regular bowel movements, pant khud utaarna-pahanna, toilet mein interest, simple instructions maanna, poop ke liye chhupp'na, geele diaper se naraz hona.",
        "Saat mein se paanch signs hon toh baccha ready hai. Kam hon toh wait karein. Jaldi shuru karna regression aur fights ka #1 reason hai.",
        "Jab shuru karein: teen din clear rakhein. Underwear pahnayen, pull-ups nahi. Pull-ups diaper jaisi lagti hai aur body ka signal confuse karti hai.",
        "Galtiyan failure nahi hain — ye data hain. Neutral rahein: 'Susu potty mein hoti hai. Chalo saaf karte hain.' Na sharmindagi, na bada celebration. Body calm low-stakes environment mein sabse jaldi seekhti hai.",
      ],
    },
  }),
  L({
    id: "toddler-screen-time",
    title: {
      en: "Screen Time Under 5: What the Research Actually Says",
      hi: "5 साल से कम बच्चों के लिए Screen Time: Research क्या कहती है",
      hinglish: "5 Saal se Kam Bacchon ke Liye Screen Time: Research Kya Kehti Hai",
    },
    description: {
      en: "WHO guidelines, why under-2 should not have screens, and how to recover from too much.",
      hi: "WHO के दिशा-निर्देश, 2 साल से कम को screen क्यों नहीं, और बहुत ज्यादा screen से कैसे उबरें।",
      hinglish: "WHO guidelines, 2 saal se kam ko screen kyun nahi, aur bahut zyaada screen se kaise recover karein.",
    },
    durationMin: 3, ageBucket: "2-4", emoji: "📱", expert: "Based on WHO & AAP",
    paragraphs: {
      en: [
        "The World Health Organisation recommends zero screen time for children under 2, and no more than 1 hour per day of high-quality, co-viewed content for children 2 to 4. Most of us are far above this — and the research shows real cost.",
        "Under 2, screens compete with the experiences that build the brain: face-to-face talk, tummy time, manipulating real objects. Even background TV reduces parent-child speech by up to 40%.",
        "From 2 to 4, the issue is not just screen time but what it replaces. Every hour on a screen is an hour not spent in the activities — outdoor play, reading, free play, conversation — that actually predict school readiness.",
        "If you have drifted into too much screen time, do not panic. Replace, do not just remove. Stock a basket of high-engagement alternatives: blocks, play dough, outdoor time, sticker books. Boredom is the door to creativity.",
        "Rule of thumb: screens are a tool, not a babysitter. Co-view when possible. Choose slow-paced, language-rich content. Hard cut-off 30 minutes before bed — blue light and stimulation both wreck sleep.",
      ],
      hi: [
        "WHO 2 साल से कम बच्चों के लिए शून्य screen time और 2-4 साल के लिए प्रतिदिन अधिकतम 1 घंटा उच्च-गुणवत्ता का सह-देखा content सुझाता है। ज्यादातर हम इससे बहुत आगे हैं — और शोध असली नुकसान दिखाता है।",
        "2 साल से कम में screen वे अनुभव छीन लेती है जो दिमाग बनाते हैं: आमने-सामने की बातचीत, tummy time, असली चीज़ें पकड़ना। Background TV भी parent-child speech 40% तक घटा देता है।",
        "2-4 साल में समस्या सिर्फ screen time नहीं है बल्कि वह क्या replace करती है। Screen पर हर घंटा, outdoor play, पढ़ाई, free play, बातचीत से छीन लिया जाता है।",
        "अगर screen time बढ़ गई है तो घबराएं नहीं। सिर्फ हटाएं नहीं, बदलें। Blocks, play dough, बाहर खेलना जैसे विकल्प रखें। ऊब रचनात्मकता का दरवाज़ा है।",
        "याद रखें: screen एक tool है, babysitter नहीं। हो सके तो साथ देखें। Slow-paced, भाषा-समृद्ध content चुनें। सोने से 30 मिनट पहले screen बंद — blue light और excitement दोनों नींद बर्बाद करते हैं।",
      ],
      hinglish: [
        "WHO 2 saal se kam ke liye zero screen time aur 2-4 saal ke liye roz zyaadatar 1 ghante tak high-quality co-viewed content suggest karta hai. Zyaadatar hum isse kaafi zyaada de rahe hain — aur research real cost dikhati hai.",
        "2 saal se kam mein screen un experiences se compete karti hai jo brain banate hain: face-to-face baat, tummy time, asli cheezein pakad'na. Background TV bhi parent-child speech 40% tak ghata deta hai.",
        "2-4 saal mein problem sirf screen time nahi hai balki woh kya replace karti hai. Screen par har ghanta, outdoor play, reading, free play, conversation se chhin jaata hai.",
        "Agar screen time badh gayi hai toh ghabrayein nahi. Sirf hatayein nahi, badlein. Blocks, play dough, bahar khelna jaisi alternatives rakhein. Bore hona creativity ka darwaza hai.",
        "Yaad rakhein: screen ek tool hai, babysitter nahi. Ho sake toh saath dekhein. Slow-paced, language-rich content chunein. Sone se 30 minute pehle screen band karein — blue light aur stimulation dono neend barbad karte hain.",
      ],
    },
  }),

  // ─── 5–7 yrs ─────────────────────────────────────────────────────
  L({
    id: "early-school-emotional-regulation",
    title: {
      en: "Building Emotional Regulation in the Early School Years",
      hi: "स्कूल शुरू होने पर भावनात्मक नियंत्रण कैसे सिखाएं",
      hinglish: "Early School Years mein Emotional Regulation Kaise Sikhayein",
    },
    description: {
      en: "Naming feelings, the calm-down corner, and why labels reduce intensity.",
      hi: "भावनाओं के नाम, calm-down corner, और लेबल क्यों intensity कम करते हैं।",
      hinglish: "Feelings ke naam, calm-down corner, aur labels intensity kyun kam karte hain.",
    },
    durationMin: 4, ageBucket: "5-7", emoji: "🌈", expert: "Based on Dr Marc Brackett & RULER approach",
    paragraphs: {
      en: [
        "Between 5 and 7, children are developing the ability to name and reflect on their own feelings — a skill called emotional granularity. Children with high emotional granularity are less aggressive, less anxious, and do better academically. The good news: this skill is teachable.",
        "Step 1: build the vocabulary. Beyond happy, sad, angry — teach frustrated, disappointed, jealous, embarrassed, proud, nervous. Use feelings charts on the fridge. Name your own feelings out loud.",
        "Step 2: validate before you correct. 'You are so frustrated that the tower fell. That makes sense — you worked hard on it.' Validation reduces intensity. Correction without validation amplifies it.",
        "Step 3: build a calm-down corner together. A small space with cushions, a few books, maybe a stuffed animal. Not a punishment zone — a regulation tool. Visit it together when calm so it becomes familiar.",
        "Most importantly: model it. Children learn regulation by watching you regulate, not by being told to calm down. When you mess up, the repair ('I shouted, that was not okay, I am sorry') teaches more than a hundred lectures.",
      ],
      hi: [
        "5-7 साल के बीच बच्चे अपनी भावनाओं को पहचानने और नाम देने की क्षमता विकसित करते हैं — इसे emotional granularity कहते हैं। ज्यादा emotional granularity वाले बच्चे कम आक्रामक, कम चिंतित और पढ़ाई में बेहतर होते हैं।",
        "पहला कदम: शब्दावली बनाएं। खुश, दुखी, गुस्से से आगे — निराश, jealous, शर्मिंदा, गर्व, नर्वस सिखाएं। Fridge पर feelings chart लगाएं। अपनी भावनाएं ज़ोर से बोलें।",
        "दूसरा कदम: सुधारने से पहले validate करें। 'तुम बहुत निराश हो कि tower गिर गया। यह समझ में आता है — तुमने मेहनत की थी।' Validation intensity कम करता है। बिना validation के correction उसे बढ़ाता है।",
        "तीसरा कदम: calm-down corner बनाएं। Cushions, किताबें, stuffed animal — punishment zone नहीं, regulation tool। शांत वक्त में साथ जाएं ताकि जगह परिचित लगे।",
        "सबसे जरूरी: खुद करके दिखाएं। बच्चे regulation आपको देखकर सीखते हैं, बताने से नहीं। जब आप गलती करें तो repair करें — 'मैंने चिल्लाया, यह ठीक नहीं था, माफ करना' — यह सौ lectures से ज्यादा सिखाता है।",
      ],
      hinglish: [
        "5-7 saal mein bacche apni feelings ko naam dene ki ability develop karte hain — ise emotional granularity kehte hain. Zyaada emotional granularity wale bacche kam aggressive, kam anxious aur padhai mein behtar hote hain. Acchi khabar: yeh skill sikhaayi ja sakti hai.",
        "Step 1: vocabulary banayein. Khush, dukhi, gusse se aage — nirash, jealous, sharminda, garv, nervous seekhayein. Fridge par feelings chart lagayein. Apni feelings zor se bolein.",
        "Step 2: correct karne se pehle validate karein. 'Tum bahut nirash ho ki tower gir gaya. Yeh samajh mein aata hai — tumne mehnat ki thi.' Validation intensity kam karta hai. Bina validation ke correction use badhata hai.",
        "Step 3: calm-down corner banayein. Cushions, kitaabein, stuffed animal — punishment zone nahi, regulation tool. Shant waqt mein saath jayen taaki jagah familiar lage.",
        "Sabse zaroori: khud karke dikhayein. Bacche regulation aapko dekhkar seekhte hain, batane se nahi. Jab aap galti karein toh repair karein — 'Mujhe gussa aa gaya tha, yeh theek nahi tha, maafi chahta hoon' — yeh sau lectures se zyaada sikhata hai.",
      ],
    },
  }),
  L({
    id: "early-school-friendship",
    title: {
      en: "Helping Your Child Make and Keep Friends",
      hi: "बच्चे को दोस्त बनाने और रखने में मदद करें",
      hinglish: "Bacche ko Dost Banaane aur Rakhne mein Madad Karein",
    },
    description: {
      en: "The friendship skills that predict lifelong wellbeing — and how to coach them.",
      hi: "दोस्ती के वे कौशल जो जीवन भर की खुशी की भविष्यवाणी करते हैं — और उन्हें कैसे सिखाएं।",
      hinglish: "Dosti ke skills jo lifetime wellbeing predict karte hain — aur unhe kaise coach karein.",
    },
    durationMin: 3, ageBucket: "5-7", emoji: "👫", expert: "Based on Dr Eileen Kennedy-Moore",
    paragraphs: {
      en: [
        "Friendships in the 5 to 7 range are short, intense, and full of conflict. This is normal — your child is learning the skills of negotiation, empathy, and repair in real time.",
        "Coach four core skills: joining play (asking 'can I play?' is the wrong opener — better is to watch, then add value), sharing (start with turn-taking, not splitting), conflict repair ('I am sorry I grabbed it. Can we start over?'), and reading social cues (faces and body language).",
        "Resist the urge to fix every fight. Children build social skill by stumbling through conflict. Step in only for safety, cruelty, or when both children are stuck. Your role is sportscaster, not judge.",
        "Watch for signs of social struggle: comes home alone often, no one to sit with at lunch, says 'nobody likes me'. Do not panic — but do open a calm conversation. Sometimes it is a skill to learn, sometimes a peer-group mismatch.",
        "Quality over quantity. One genuine friendship at this age is worth more than being part of a popular crowd. Help your child invest in it — playdates, small gestures, remembering birthdays.",
      ],
      hi: [
        "5-7 साल में दोस्तियां छोटी, गहरी और झगड़ों से भरी होती हैं। यह सामान्य है — बच्चा negotiation, empathy और repair के skills असल समय में सीख रहा है।",
        "चार मुख्य skills coach करें: खेल में शामिल होना ('क्या मैं खेल सकता हूं?' गलत opener है — पहले देखें, फिर value add करें), sharing (turn-taking से शुरू करें), झगड़े की repair ('माफ करो, मैंने खींच लिया। फिर से शुरू करें?'), और social cues पढ़ना।",
        "हर झगड़ा fix करने की इच्छा रोकें। बच्चे conflict से ही social skill बनाते हैं। सिर्फ सुरक्षा, क्रूरता या stuck होने पर दखल दें। आपकी भूमिका referee नहीं, commentator की है।",
        "सामाजिक संघर्ष के संकेत देखें: अक्सर अकेले घर आना, lunch में साथ बैठने वाला न हो, 'कोई मुझे पसंद नहीं करता'। घबराएं नहीं — शांत बातचीत खोलें। कभी skill की कमी, कभी peer-group mismatch होता है।",
        "संख्या से ज्यादा गुणवत्ता। इस उम्र में एक सच्ची दोस्ती popular crowd का हिस्सा होने से ज्यादा कीमती है। बच्चे को उसमें निवेश करने में मदद करें।",
      ],
      hinglish: [
        "5-7 saal mein dosti chhoti, intense aur jhagdon se bhari hoti hai. Yeh normal hai — baccha negotiation, empathy aur repair ke skills real time mein seekh raha hai.",
        "Chaar core skills coach karein: khel mein shamil hona ('kya main khel sakta hoon?' galat opener hai — pehle dekhen, phir value add karein), sharing (turn-taking se shuru karein), jhagrade ki repair ('sorry, maine kheench liya. Phir se shuru karein?'), aur social cues padhna.",
        "Har jhagrade ko fix karne ki ichha rokein. Bacche conflict se hi social skill banate hain. Sirf safety, cruelty ya stuck hone par dakhalna dein. Aapki role referee nahi, commentator ki hai.",
        "Social struggle ke signs dekhein: aksar akele ghar aana, lunch mein koi saath na ho, 'koi mujhe pasand nahi karta'. Ghabrayein nahi — shaant baatcheet shuru karein. Kabhi skill ki kami, kabhi peer-group mismatch hota hai.",
        "Sankhya se zyaada quality. Is umra mein ek sacchi dosti popular crowd ka hissa hone se zyaada keemat'i hai. Bacche ko usme invest karne mein madad karein — playdates, chhote gestures, janmdin yaad rakhna.",
      ],
    },
  }),
  L({
    id: "early-school-homework",
    title: {
      en: "Homework Without Tears: A Calm 4-Step System",
      hi: "बिना रोए होमवर्क: शांत 4-कदम प्रणाली",
      hinglish: "Homework Bina Jhagde ke: Shant 4-Step System",
    },
    description: {
      en: "End the daily battle with a structure that respects your child's brain.",
      hi: "रोज़ की लड़ाई खत्म करें एक ऐसे structure के साथ जो बच्चे के दिमाग का सम्मान करे।",
      hinglish: "Roz ki ladaai khatam karein ek aisi structure ke saath jo bacche ke brain ka respect kare.",
    },
    durationMin: 3, ageBucket: "5-7", emoji: "✏️", expert: "Based on Dr Stuart Shanker, self-reg",
    paragraphs: {
      en: [
        "Most homework battles are not motivation problems — they are dysregulation problems. After a full school day, your child's executive function tank is empty. Sitting them down immediately is a recipe for war.",
        "Step 1: snack and movement first. 30 to 45 minutes of free play, outdoor time, or a snack rebuilds the regulation needed to focus. Skip this and the next 60 minutes will be hell.",
        "Step 2: same place, same time. The brain loves predictability. A consistent homework spot with the materials ready cuts setup friction by 80%.",
        "Step 3: micro-chunks with the timer. 10 to 15 minutes work, 5 minutes break, repeat. The 5-minute break is not optional — it is what makes the next chunk possible.",
        "Step 4: be a co-regulator, not an enforcer. Sit nearby, not over their shoulder. Ask 'what is the next step?' not 'why did you not do it?'. Your role is to lend calm focus, not to answer the questions.",
      ],
      hi: [
        "ज्यादातर homework की लड़ाइयां motivation की नहीं — dysregulation की समस्याएं हैं। पूरे स्कूल दिन के बाद बच्चे का executive function tank खाली होता है। तुरंत बिठाना युद्ध का नुस्खा है।",
        "Step 1: पहले snack और movement। 30-45 मिनट खेलना, बाहर जाना या snack लेना — यह focus के लिए ज़रूरी regulation वापस लाता है। यह छोड़ा तो अगले 60 मिनट मुश्किल होंगे।",
        "Step 2: एक ही जगह, एक ही समय। दिमाग predictability पसंद करता है। नियमित homework spot setup friction 80% कम कर देता है।",
        "Step 3: timer के साथ छोटे टुकड़े। 10-15 मिनट काम, 5 मिनट ब्रेक, दोहराएं। 5 मिनट का ब्रेक optional नहीं है — यही अगले chunk को possible बनाता है।",
        "Step 4: enforcer नहीं, co-regulator बनें। पास बैठें, कंधे के ऊपर नहीं। 'अगला कदम क्या है?' पूछें, 'यह क्यों नहीं किया?' नहीं। आपकी भूमिका शांत focus उधार देना है, सवाल हल करना नहीं।",
      ],
      hinglish: [
        "Zyaadatar homework ki ladaiyan motivation ki nahi — dysregulation ki problems hain. Poore school din ke baad bacche ka executive function tank khaali hota hai. Turant bithana war ka nuskha hai.",
        "Step 1: pehle snack aur movement. 30-45 minute khelna, bahar jaana ya snack — yeh focus ke liye zaroori regulation wapas laata hai. Yeh chhoda toh agle 60 minute mushkil honge.",
        "Step 2: ek hi jagah, ek hi waqt. Brain predictability pasand karta hai. Consistent homework spot setup friction 80% kam kar deta hai.",
        "Step 3: timer ke saath chhote tukde. 10-15 minute kaam, 5 minute break, dobara. 5 minute ka break optional nahi hai — yahi agla chunk possible banata hai.",
        "Step 4: enforcer nahi, co-regulator banein. Paas baithein, kandhe ke oopar nahi. 'Agla kadam kya hai?' puchein, 'yeh kyun nahi kiya?' nahi. Aapki role shaant focus udhar dena hai, sawaal hal karna nahi.",
      ],
    },
  }),
  L({
    id: "early-school-growth-mindset",
    title: {
      en: "Praise Effort, Not Smart: Building a Growth Mindset",
      hi: "Smart की नहीं, मेहनत की तारीफ करें: Growth Mindset कैसे बनाएं",
      hinglish: "Smart ki Nahi, Mehnat ki Tarif Karein: Growth Mindset Kaise Banayein",
    },
    description: {
      en: "Carol Dweck's research, in plain language, with the exact phrases that work.",
      hi: "Carol Dweck की research, सरल भाषा में, और काम आने वाले सटीक वाक्यांश।",
      hinglish: "Carol Dweck ki research, simple mein, aur exact phrases jo kaam aate hain.",
    },
    durationMin: 3, ageBucket: "5-7", emoji: "🌱", expert: "Based on Dr Carol Dweck",
    paragraphs: {
      en: [
        "Praising 'You are so smart' actually backfires. Stanford researcher Carol Dweck has shown that children praised for being smart become risk-averse — they avoid challenges that might prove them not-smart. Children praised for effort take on harder challenges and persist longer.",
        "Replace identity praise with process praise. Not 'you are a great artist' but 'I see how carefully you mixed those colours'. Not 'you are so clever' but 'you tried three different ways before that worked'.",
        "Use the word 'yet'. 'I cannot do this' becomes 'I cannot do this yet'. That tiny word reframes failure as a stage, not a verdict.",
        "Talk about your own struggles out loud. 'I am working on being patient — I messed up earlier and I am trying again.' Children learn that effort and failure are part of growth, not a sign that something is wrong with them.",
        "Be careful with results-only feedback. A child who only hears praise for an A on the test learns that the grade is what matters. Praise the practice, the strategy, the persistence — and the grade takes care of itself.",
      ],
      hi: [
        "'तुम बहुत होशियार हो' कहना उल्टा पड़ता है। Stanford researcher Carol Dweck ने दिखाया है कि होशियारी के लिए तारीफ पाने वाले बच्चे risk से डरते हैं — वे ऐसी चुनौतियों से बचते हैं जो उन्हें 'कम होशियार' साबित कर सकती हैं।",
        "Identity praise को process praise से बदलें। 'तुम बड़े artist हो' नहीं, बल्कि 'मैंने देखा तुमने रंगों को कितनी सावधानी से मिलाया'। 'तुम बहुत चालाक हो' नहीं, 'तुमने तीन अलग तरीके आजमाए जब तक यह काम नहीं आया'।",
        "'अभी तक' शब्द का उपयोग करें। 'मुझे नहीं आता' बन जाता है 'मुझे अभी तक नहीं आता'। यह छोटा शब्द विफलता को एक मंज़िल के रूप में reframe करता है।",
        "अपनी मुश्किलें ज़ोर से बोलें। 'मैं धैर्य रखने पर काम कर रहा हूं — आज गलती हुई और फिर कोशिश कर रहा हूं।' बच्चे सीखते हैं कि मेहनत और गलती growth का हिस्सा हैं।",
        "सिर्फ result की तारीफ से बचें। जो बच्चा सिर्फ A grade की तारीफ सुनता है, वह सोचने लगता है कि grade ही सब कुछ है। Practice, strategy और persistence की तारीफ करें — grade खुद आ जाएगा।",
      ],
      hinglish: [
        "'Tum bahut hoshiyaar ho' kehna ulta padta hai. Stanford researcher Carol Dweck ne dikhaya hai ki hoshiyaari ki tarif wale bacche risk se darte hain — woh aisi challenges se bachte hain jo unhe 'kam hoshiyaar' sabit kar sakti hain.",
        "Identity praise ko process praise se badlein. 'Tum bade artist ho' nahi, 'mujhe dikha tum'ne colours ko kitni carefully mix kiya'. 'Tum bahut chalak ho' nahi, 'tum'ne teen alag tarike aazmaaye jab tak yeh kaam nahi aaya'.",
        "'Abhi tak' word use karein. 'Mujhe nahi aata' ban jaata hai 'Mujhe abhi tak nahi aata'. Yeh chhota sa word failure ko ek stage ke roop mein reframe karta hai, verdict nahi.",
        "Apni mushkilein zor se bolein. 'Main patience par kaam kar raha hoon — aaj galti hui aur phir koshish kar raha hoon.' Bacche seekhte hain ki mehnat aur galti growth ka hissa hai.",
        "Sirf result ki tarif se bachein. Jo baccha sirf A grade ki tarif sunta hai, woh sochne lagta hai ki grade hi sab kuch hai. Practice, strategy aur persistence ki tarif karein — grade khud aa jayega.",
      ],
    },
  }),

  // ─── 8–10 yrs ────────────────────────────────────────────────────
  L({
    id: "tween-independence",
    title: {
      en: "Letting Go: Building Independence in the Tween Years",
      hi: "जाने दें: Tween सालों में आज़ादी कैसे दें",
      hinglish: "Jaane Dein: Tween Years mein Azadi Kaise Dein",
    },
    description: {
      en: "Why over-helping hurts, and the 'one notch more' weekly experiment.",
      hi: "ज्यादा मदद क्यों नुकसान करती है, और 'एक कदम और' का साप्ताहिक प्रयोग।",
      hinglish: "Zyaada help kyun nuksan karti hai, aur 'ek kadam aur' ka weekly experiment.",
    },
    durationMin: 4, ageBucket: "8-10", emoji: "🪜", expert: "Based on Dr Lenore Skenazy",
    paragraphs: {
      en: [
        "Between 8 and 10, children desperately need to feel competent. Their growing brain craves real-world challenges. Over-helping — packing the bag, signing the diary, fighting their school battles — sends a quiet message: 'I do not believe you can'.",
        "Try the 'one notch more' experiment. Once a week, hand back one task you have been doing for them. Walking to the gate alone. Making their own breakfast. Calling grandma on the phone. Each notch is a vote of confidence.",
        "Expect mistakes — and protect them. A forgotten lunch, a missed homework, a bad grade. These small failures are the cheapest tuition your child will ever pay. Rescue them, and you steal the lesson.",
        "Resist the rescue urge. When they complain, your script is: 'That sounds hard. What do you think you will do?'. You are coaching the problem-solver, not solving the problem.",
        "Independence is built in tiny doses, weekly. By 12, the child you were hovering over at 8 will either be the one who launches with confidence or the one who freezes when you are not there. Start the notches now.",
      ],
      hi: [
        "8-10 साल में बच्चे सक्षम महसूस करने की गहरी ज़रूरत रखते हैं। उनका बढ़ता दिमाग असल चुनौतियां चाहता है। ज़्यादा मदद करना — बैग pack करना, diary sign करना, स्कूल की लड़ाइयां लड़ना — एक शांत संदेश देता है: 'मुझे विश्वास नहीं कि तुम कर सकते हो'।",
        "'एक कदम और' का प्रयोग करें। हर हफ्ते एक काम जो आप उनके लिए करते थे, वापस दे दें। अकेले gate तक चलना। खुद breakfast बनाना। दादी को फोन करना। हर कदम विश्वास का वोट है।",
        "गलतियों की उम्मीद रखें — और उन्हें बचाएं। भूली हुई lunch, छूटा homework, बुरा grade। ये छोटी विफलताएं सबसे सस्ती पाठशाला हैं। बचा लेंगे तो lesson चुरा लेंगे।",
        "बचाने की इच्छा रोकें। शिकायत पर आपका script: 'यह मुश्किल लगता है। तुम क्या करोगे?' आप problem-solver को coach कर रहे हैं, problem solve नहीं।",
        "आज़ादी हर हफ्ते थोड़ी-थोड़ी बनती है। 12 साल तक, जिस बच्चे पर आप 8 साल में hover कर रहे थे — वह या तो आत्मविश्वास से उड़ान भरेगा या अकेले थम जाएगा। अभी शुरू करें।",
      ],
      hinglish: [
        "8-10 saal mein bacche capable feel karne ki gehri zarurat rakhte hain. Unka badhta brain real challenges chahta hai. Zyaada help karna — bag pack karna, diary sign karna, school ki ladaiyan lad'na — ek shaant message deta hai: 'Mujhe vishwas nahi ki tum kar sakte ho'.",
        "'Ek kadam aur' ka experiment karein. Har hafte ek kaam jo aap unke liye karte the, wapas de dein. Akele gate tak chalna. Khud breakfast banana. Dadi ko phone karna. Har kadam vishwas ka vote hai.",
        "Galtiyon ki umeed rakhein — aur unhe bacha'ne se bachein. Bhooli hui lunch, chhuta homework, bura grade. Ye chhoti failures sabse sasti paathshaala hain. Bachaa lenge toh lesson chura lenge.",
        "Bachane ki ichha rokein. Shikaayat par aapka script: 'Yeh mushkil lagta hai. Tum kya karoge?' Aap problem-solver ko coach kar rahe hain, problem solve nahi kar rahe.",
        "Azadi har hafte thodi-thodi banti hai. 12 saal tak, jis bacche par aap 8 saal mein hover kar rahe the — woh ya toh confidence se udaan bharega ya akele tham jayega. Abhi start karein.",
      ],
    },
  }),
  L({
    id: "tween-sibling-fights",
    title: {
      en: "Sibling Fights: Stop Being the Referee",
      hi: "भाई-बहन के झगड़े: Referee बनना बंद करें",
      hinglish: "Bhai-Behen ke Jhagde: Referee Banna Band Karein",
    },
    description: {
      en: "Faber & Mazlish's sportscasting method — describe, do not judge.",
      hi: "Faber & Mazlish का sportscasting तरीका — बताएं, निर्णय न लें।",
      hinglish: "Faber & Mazlish ka sportscasting method — describe karein, judge nahi.",
    },
    durationMin: 3, ageBucket: "8-10", emoji: "🥊", expert: "Based on Adele Faber & Elaine Mazlish",
    paragraphs: {
      en: [
        "If you are pulled into 12 sibling fights a day, you are training your children to need a referee. The fights will not go away — they will multiply, because the referee has become part of the game.",
        "The shift is from referee to sportscaster. A referee judges and decides. A sportscaster describes the action. 'I see two children both want the same iPad. There is only one iPad. Hmm, this is a tough problem.'",
        "Resist the urge to investigate ('who started it?'). You will get two opposite answers and you cannot prove either. Instead, refuse the role: 'It does not matter who started it. The question is — how do we end it?'",
        "Coach skills, not verdicts. Teach 'I-statements' ('I felt mad when you took it without asking') instead of accusations. Teach the repair ritual: name what you did, name the impact, propose a fix.",
        "Most importantly: protect 1:1 time with each child. Sibling rivalry is rarely about toys or fairness — it is about the bucket of parental attention. A predictable 15 minutes of 1:1 a day, per child, halves most sibling conflict over a few weeks.",
      ],
      hi: [
        "अगर आप रोज़ 12 झगड़ों में खींचे जाते हैं, तो आप बच्चों को referee की ज़रूरत सिखा रहे हैं। झगड़े नहीं जाएंगे — बढ़ेंगे, क्योंकि referee अब game का हिस्सा बन गया है।",
        "Referee से sportscaster बनें। Referee निर्णय करता है। Sportscaster describe करता है। 'मैं देख रहा हूं दोनों बच्चे एक ही iPad चाहते हैं। एक ही iPad है। हम्म, यह मुश्किल problem है।'",
        "'किसने शुरू किया?' न पूछें — दो अलग जवाब मिलेंगे और कोई साबित नहीं। बजाय इसके, role refuse करें: 'किसने शुरू किया यह मायने नहीं रखता। सवाल यह है — कैसे खत्म होगा?'",
        "Verdict नहीं, skills coach करें। 'I-statements' सिखाएं ('मुझे बुरा लगा जब तुमने बिना पूछे लिया') accusations की जगह। Repair ritual सिखाएं: क्या किया, क्या असर, क्या solution।",
        "सबसे जरूरी: हर बच्चे के साथ अलग 1:1 time बचाएं। Sibling rivalry खिलौनों या इंसाफ के बारे में कम होती है — यह माता-पिता के ध्यान के बारे में है। रोज़ हर बच्चे के साथ 15 मिनट का नियमित समय ज्यादातर sibling conflict आधा कर देता है।",
      ],
      hinglish: [
        "Agar aap roz 12 jhagdon mein khainche jaate hain, toh aap bacchon ko referee ki zarurat sikha rahe hain. Jhagde nahi jayenge — badhenge, kyunki referee ab game ka hissa ban gaya hai.",
        "Referee se sportscaster banein. Referee decide karta hai. Sportscaster describe karta hai. 'Main dekh raha hoon dono bacche ek hi iPad chahte hain. Ek hi iPad hai. Hmm, yeh mushkil problem hai.'",
        "'Kisne shuru kiya?' mat poochein — do alag jawab milenge aur koi prove nahi hoga. Bajaye, role refuse karein: 'Kisne shuru kiya yeh mayne nahi rakhta. Sawaal yeh hai — kaise khatam hoga?'",
        "Verdict nahi, skills coach karein. 'I-statements' sikhayen ('Mujhe bura laga jab tum'ne bina pooche liya') accusations ki jagah. Repair ritual sikhayen: kya kiya, kya asar, kya solution.",
        "Sabse zaroori: har bacche ke saath alag 1:1 time bachayein. Sibling rivalry khilonon ya insaaf ke baare mein kam hoti hai — yeh mata-pita ke dhyan ke baare mein hai. Roz har bacche ke saath 15 minute ka regular time zyaadatar sibling conflict aadha kar deta hai.",
      ],
    },
  }),
  L({
    id: "tween-screen-balance",
    title: {
      en: "Screens, Phones and YouTube: Drawing the Lines That Stick",
      hi: "Screens, फोन और YouTube: टिकाऊ सीमाएं कैसे तय करें",
      hinglish: "Screens, Phone aur YouTube: Tikau Limits Kaise Tay Karein",
    },
    description: {
      en: "What the research says, and how to negotiate limits without daily war.",
      hi: "Research क्या कहती है, और रोज़ की लड़ाई के बिना limits कैसे तय करें।",
      hinglish: "Research kya kehti hai, aur roz ki ladai ke bina limits kaise negotiate karein.",
    },
    durationMin: 4, ageBucket: "8-10", emoji: "📺", expert: "Based on Dr Jean Twenge & Common Sense Media",
    paragraphs: {
      en: [
        "Between 8 and 10, screen use explodes — and so do conflicts about it. The research is consistent: more than 2 hours a day of recreational screens is associated with worse sleep, lower wellbeing, and lower school performance.",
        "Lines that work are clear, predictable, and co-created. A vague 'not too much' is unenforceable. A specific 'weekdays 30 min after homework, weekends 90 min, never in the bedroom, screens off 60 min before bed' is enforceable.",
        "Build the contract together. A child who helped write the rule fights it less. Ask: 'When do you think screens get in the way of sleep, schoolwork, friends, mood? What is a fair limit?'",
        "Phones in the bedroom is the single biggest mistake. Sleep deteriorates, anxiety rises, and night-time scrolling is where most problems start. Use a charging dock in the kitchen for the whole family — including parents.",
        "Be the model. Children watch your screen habits more than they listen to your screen rules. A no-phones-at-meals rule that you also follow is worth a hundred lectures.",
      ],
      hi: [
        "8-10 साल में screen का उपयोग बहुत बढ़ जाता है — और इस पर झगड़े भी। Research स्पष्ट है: प्रतिदिन 2 घंटे से ज्यादा recreational screens खराब नींद, कम wellbeing और कम academic performance से जुड़ी हैं।",
        "जो rules काम करते हैं वे स्पष्ट, predictable और साथ मिलकर बनाए गए होते हैं। 'ज्यादा नहीं' वाला vague rule लागू नहीं होता। 'Weekdays homework के बाद 30 मिनट, weekends 90 मिनट, कमरे में नहीं, सोने से 60 मिनट पहले बंद' — यह लागू होता है।",
        "Contract साथ मिलकर बनाएं। जिस बच्चे ने rule बनाने में हिस्सा लिया वह कम लड़ता है। पूछें: 'तुम्हें लगता है screen कब नींद, पढ़ाई, दोस्तों और mood में आड़े आती है? क्या fair limit है?'",
        "कमरे में फोन सबसे बड़ी गलती है। नींद खराब होती है, anxiety बढ़ती है, और रात की scrolling ज्यादातर problems की शुरुआत है। पूरे परिवार के लिए किचन में charging dock रखें — parents समेत।",
        "खुद मिसाल बनें। बच्चे आपकी screen habits देखते हैं ज्यादा, rules सुनते हैं कम। खाने पर no-phones का rule जो आप भी follow करते हों — सौ lectures से ज्यादा असर करता है।",
      ],
      hinglish: [
        "8-10 saal mein screen ka use bahut badh jaata hai — aur iske baare mein jhagde bhi. Research clear hai: roz 2 ghante se zyaada recreational screens kharaab neend, kam wellbeing aur kam academic performance se judi hain.",
        "Jo rules kaam karte hain woh clear, predictable aur saath milkar banaye hote hain. 'Zyaada nahi' wala vague rule apply nahi hota. 'Weekdays homework ke baad 30 minute, weekends 90 minute, kamre mein nahi, sone se 60 minute pehle band' — yeh apply hota hai.",
        "Contract saath milkar banayein. Jis bacche ne rule banana mein hissa liya woh kam ladhta hai. Poochein: 'Tumhe lagta hai screen kab neend, padhai, doston aur mood mein aad'e aati hai? Kya fair limit hai?'",
        "Kamre mein phone sabse badi galti hai. Neend kharaab hoti hai, anxiety badhti hai, aur raat ki scrolling zyaadatar problems ki shuruwat hai. Poore parivaar ke liye kitchen mein charging dock rakhein — parents samet.",
        "Khud misaal banein. Bacche aapki screen habits dekhte hain zyaada, rules sunte hain kam. Khaane par no-phones ka rule jo aap bhi follow karte hon — sau lectures se zyaada asar karta hai.",
      ],
    },
  }),
  L({
    id: "tween-talking-to-them",
    title: {
      en: "How to Talk So Your 8 to 10 Year Old Will Actually Listen",
      hi: "8-10 साल के बच्चे से बात करना जिससे वे सुनें",
      hinglish: "8-10 Saal ke Bacche se Baat Karna Jisse Woh Sunein",
    },
    description: {
      en: "Side-by-side, not face-to-face. The car-conversation rule, and the 5-second pause.",
      hi: "Side-by-side, आमने-सामने नहीं। Car conversation का नियम और 5 सेकंड का रुकाव।",
      hinglish: "Side-by-side, aamnae-saamne nahi. Car conversation rule aur 5-second pause.",
    },
    durationMin: 3, ageBucket: "8-10", emoji: "💬", expert: "Based on Dr Lisa Damour",
    paragraphs: {
      en: [
        "Tweens are starting to pull away — that is healthy. But they still desperately want to feel known. The trick is changing how you talk, not how often.",
        "Side-by-side beats face-to-face. The car, the kitchen, on a walk — this is where tweens open up. Direct eye contact across a table feels like an interrogation to a 9-year-old.",
        "The 5-second pause: when your child says something hard, do not respond for 5 full seconds. Most parents jump in with advice, judgement, or a question. The pause is what tells your child you actually heard.",
        "Ask better questions. Not 'how was school?' (you will get 'fine'), but 'what was the best part?', 'what was the most boring part?', 'who did you sit with at lunch today?'.",
        "Drop one-word reactions to bombs. When your child tells you something shocking, your face decides whether they ever tell you again. Practise the neutral 'mm, tell me more' — even when your insides are screaming.",
      ],
      hi: [
        "Tweens दूरी बनाने लगते हैं — यह स्वस्थ है। लेकिन वे अभी भी पहचाने जाने की गहरी ज़रूरत रखते हैं। तरकीब है बात करने का तरीका बदलना, बार-बार बात करना नहीं।",
        "Side-by-side, आमने-सामने से बेहतर है। Car, kitchen, walk पर — यहीं tweens खुलते हैं। Table के आर-पार सीधी आंखें मिलाना 9 साल के बच्चे को interrogation जैसा लगता है।",
        "5 सेकंड का रुकाव: जब बच्चा कुछ मुश्किल कहे, 5 पूरे सेकंड जवाब न दें। ज्यादातर parents तुरंत सलाह, निर्णय या सवाल करते हैं। रुकाव बताता है कि आपने सुना।",
        "बेहतर सवाल पूछें। 'स्कूल कैसा था?' नहीं (जवाब होगा 'ठीक'), बल्कि 'सबसे अच्छा हिस्सा क्या था?', 'सबसे बोरिंग क्या था?', 'आज lunch में किसके साथ बैठे?'।",
        "चौंकाने वाली बात पर एक शब्द में जवाब न दें। जब बच्चा कुछ shocking बताए तो आपका चेहरा तय करता है कि वह फिर बताएगा या नहीं। 'अच्छा, और बताओ' — यह practice करें।",
      ],
      hinglish: [
        "Tweens door hona shuru karte hain — yeh healthy hai. Lekin woh abhi bhi jaane-pehchane jaane ki gehri zarurat rakhte hain. Trick hai baat karne ka tarika badalna, baar-baar baat karna nahi.",
        "Side-by-side, aamnae-saamne se behtar hai. Car, kitchen, walk par — yahan tweens khulte hain. Table ke aar-paar seedhi aankhein milana 9 saal ke bacche ko interrogation jaisa lagta hai.",
        "5-second pause: jab baccha kuch mushkil kahe, 5 poore second jawab na dein. Zyaadatar parents turant salah, niraay ya sawaal karte hain. Rukaav bataata hai ki aap'ne suna.",
        "Behtar sawaal puchein. 'School kaisa tha?' nahi (jawab hoga 'theek'), balki 'sabse achha hissa kya tha?', 'sabse boring kya tha?', 'aaj lunch mein kiske saath baithe?'.",
        "Chaukane wali baat par ek shabd mein jawab na dein. Jab baccha kuch shocking bataye toh aapka chehra tay karta hai ki woh phir batayega ya nahi. 'Achha, aur batao' — yeh practice karein.",
      ],
    },
  }),

  // ─── 10+ yrs (tween / teen) ──────────────────────────────────────
  L({
    id: "teen-brain-101",
    title: {
      en: "Inside the Teen Brain — What Every Parent Should Know",
      hi: "Teen के दिमाग के अंदर — हर माता-पिता को यह जानना चाहिए",
      hinglish: "Teen ke Brain ke Andar — Har Parent ko Yeh Jaanna Chahiye",
    },
    description: {
      en: "Why your teen makes wild decisions — and why this is biology, not bad character.",
      hi: "Teen अजीब फैसले क्यों करता है — और यह biology है, बुरे किरदार का नहीं।",
      hinglish: "Teen wild decisions kyun karta hai — aur yeh biology hai, bura character nahi.",
    },
    durationMin: 4, ageBucket: "10+", emoji: "🧠", expert: "Based on Dr Frances Jensen & Dr B.J. Casey",
    paragraphs: {
      en: [
        "The teen brain is not a finished adult brain making bad decisions. It is a unique biological stage. The limbic system (emotion, reward, social) develops fully by around 14. The prefrontal cortex (judgement, planning, impulse control) is not done until the mid-twenties.",
        "This 10-year gap is the entire story. A 13-year-old can want something with the full force of an adult drive system, but only a fraction of the adult braking system. This is not a flaw — it is what makes adolescents the great explorers, learners and risk-takers our species needs.",
        "What this means for you: lectures land worse, consequences delivered later land better, and emotional reactivity is biological. When your teen 'overreacts', their amygdala is genuinely louder than yours.",
        "Stay regulated yourself. A teen meltdown plus a parent meltdown equals a relationship crack. Your calm body is still doing co-regulation, even at 14.",
        "Pick your battles. Hair, clothes, music, room — let it slide. Safety, cruelty, school engagement, mental health — hold the line. This is the parental version of the choice trick: give them autonomy where it costs little, hold firm where it matters.",
      ],
      hi: [
        "Teen का दिमाग पूरी तरह विकसित adult brain नहीं है जो गलत फैसले ले रहा है। यह एक अनोखा biological चरण है। Limbic system (भावनाएं, इनाम, सामाजिक) 14 साल तक पूरी तरह बन जाता है। Prefrontal cortex (निर्णय, योजना, आवेग नियंत्रण) mid-twenties तक पूरा नहीं होता।",
        "यह 10 साल का gap ही पूरी कहानी है। 13 साल का किशोर किसी चीज़ को adult drive से चाह सकता है, लेकिन adult braking system का सिर्फ एक अंश उसके पास है। यह कमी नहीं — यही उन्हें महान खोजकर्ता और learner बनाता है।",
        "इसका मतलब: lectures कम काम करते हैं, बाद में दी गई consequences ज्यादा; emotional reactivity biological है। जब teen 'ज्यादा react' करे, तो उनकी amygdala वाकई आपसे तेज़ आवाज़ में काम कर रही है।",
        "खुद शांत रहें। Teen का meltdown + parent का meltdown = relationship में दरार। आपका शांत शरीर अभी भी co-regulation कर रहा है, 14 साल की उम्र में भी।",
        "लड़ाइयां चुनें। बाल, कपड़े, संगीत, कमरा — जाने दें। सुरक्षा, क्रूरता, पढ़ाई, mental health — यहां टिकें। जहां कम कीमत हो वहां autonomy दें, जहां जरूरी हो वहां दृढ़ रहें।",
      ],
      hinglish: [
        "Teen ka brain poori tarah developed adult brain nahi hai jo galat decisions le raha hai. Yeh ek anokha biological stage hai. Limbic system (emotions, reward, social) 14 saal tak poori tarah ban jaata hai. Prefrontal cortex (judgment, planning, impulse control) mid-twenties tak poora nahi hota.",
        "Yeh 10 saal ka gap hi poori kahani hai. 13 saal ka teen kisi cheez ko adult drive se chah sakta hai, lekin adult braking system ka sirf ek fraction uske paas hai. Yeh kami nahi — yahi unhe explorer aur learner banata hai.",
        "Iska matlab: lectures kam kaam karte hain, baad mein di gayi consequences zyaada; emotional reactivity biological hai. Jab teen 'zyaada react' kare, toh unki amygdala sachchi aapke brain se zyaada loud hai.",
        "Khud shaant rahein. Teen ka meltdown + parent ka meltdown = relationship mein daraar. Aapka shaant body abhi bhi co-regulation kar raha hai, 14 saal mein bhi.",
        "Ladaiyan chunein. Baal, kapde, sangeet, kamra — jaane dein. Safety, cruelty, padhai, mental health — yahan tikein. Jahan kam keemat ho wahan autonomy dein, jahan zaroori ho wahan drid rahein.",
      ],
    },
  }),
  L({
    id: "teen-social-media",
    title: {
      en: "Social Media and Teen Mental Health: The Honest Truth",
      hi: "Social Media और Teen का Mental Health: सच्चाई",
      hinglish: "Social Media aur Teen ka Mental Health: Sach Baat",
    },
    description: {
      en: "What the data shows, what to actually do, and why a delayed phone is a gift.",
      hi: "Data क्या दिखाता है, वास्तव में क्या करें, और phone देर से देना क्यों gift है।",
      hinglish: "Data kya dikhata hai, actually kya karein, aur phone baad mein dena kyun gift hai.",
    },
    durationMin: 4, ageBucket: "10+", emoji: "📲", expert: "Based on Dr Jonathan Haidt & Dr Jean Twenge",
    paragraphs: {
      en: [
        "Since 2012, rates of teen anxiety, depression and self-harm have risen sharply across many countries — particularly in girls. The strongest culprit, in the research of Dr Jonathan Haidt and others, is the smartphone with social media.",
        "The mechanism: social comparison on a 24/7 scale, sleep displaced by night-time scrolling, real-world play and friendship displaced by feeds, and addictive design loops engineered by trillion-dollar companies.",
        "Four norms now backed by significant research: no smartphone before high school, no social media before 16, phone-free schools, and far more independence and free play in the real world.",
        "If your child already has a phone — do not panic, recalibrate. Move charging out of the bedroom. Set the screens-off time 60 minutes before bed. Use built-in screen time limits. Have a once-a-week phone-down family ritual.",
        "Most importantly: replace, do not just remove. The teens who do best in the 'no phone' families are the ones whose parents fill that time with sport, friends, hobbies, jobs and unstructured outdoor time. The phone is not the only need — the need underneath is connection.",
      ],
      hi: [
        "2012 के बाद से, कई देशों में teens में anxiety, depression और self-harm की दरें तेज़ी से बढ़ी हैं — खास तौर पर लड़कियों में। Dr Jonathan Haidt जैसे researchers के शोध में सबसे बड़ा कारण है: social media वाला smartphone।",
        "तंत्र यह है: 24/7 सामाजिक तुलना, रात की scrolling से नींद की क्षति, असली खेल और दोस्ती की जगह feeds, और खरबों कमाने वाली कंपनियों के addictive design loops।",
        "Research-backed चार नियम: high school से पहले smartphone नहीं, 16 से पहले social media नहीं, phone-free schools, और असली दुनिया में ज्यादा स्वतंत्रता और खेल।",
        "अगर बच्चे के पास phone है — घबराएं नहीं, recalibrate करें। Charging bedroom से बाहर करें। सोने से 60 मिनट पहले screen बंद। Built-in screen limits use करें। हफ्ते में एक बार phone-down ritual रखें।",
        "सबसे जरूरी: सिर्फ हटाएं नहीं, बदलें। 'No phone' परिवारों में जो teens सबसे अच्छे रहते हैं — उनके parents उस समय को खेल, दोस्त, hobby, काम और बाहरी गतिविधियों से भरते हैं।",
      ],
      hinglish: [
        "2012 ke baad se, kai deshon mein teens mein anxiety, depression aur self-harm ki darein tezi se badhi hain — khaas taur par ladhkiyon mein. Dr Jonathan Haidt jaisa research mein sabse bada reason hai: social media wala smartphone.",
        "Mechanism yeh hai: 24/7 social comparison, raat ki scrolling se neend ki khatiya, asli khelna aur dosti ki jagah feeds, aur kharbon kamaane wali companies ke addictive design loops.",
        "Research-backed chaar norms: high school se pehle smartphone nahi, 16 se pehle social media nahi, phone-free schools, aur asli duniya mein zyaada azadi aur khelna.",
        "Agar bacche ke paas phone hai — ghabrayein nahi, recalibrate karein. Charging bedroom se bahar karein. Sone se 60 minute pehle screen band. Built-in screen limits use karein. Hafte mein ek baar phone-down family ritual rakhein.",
        "Sabse zaroori: sirf hatayen nahi, badlein. 'No phone' parivaron mein jo teens sabse achhe rehte hain — unke parents us time ko sport, dost, hobby, kaam aur bahari activities se bharte hain.",
      ],
    },
  }),
  L({
    id: "teen-staying-connected",
    title: {
      en: "Staying Connected When They Want to Pull Away",
      hi: "जब वे दूर जाना चाहें तब जुड़े रहना",
      hinglish: "Jab Woh Door Jaana Chahein Tab Jude Rehna",
    },
    description: {
      en: "The 1:1 ritual, the car rule, and why showing up boring beats showing up fixing.",
      hi: "1:1 ritual, car rule, और boring रहना क्यों fixing से बेहतर है।",
      hinglish: "1:1 ritual, car rule, aur boring dikhna kyun fixing se behtar hai.",
    },
    durationMin: 3, ageBucket: "10+", emoji: "🤝", expert: "Based on Dr Lisa Damour & Dr Laurence Steinberg",
    paragraphs: {
      en: [
        "Teens are biologically wired to pull away from parents and toward peers. This is healthy — it is how they prepare to launch. Your job is not to fight it. Your job is to remain the safe base they return to.",
        "Protect a 1:1 ritual that is not about school, behaviour or chores. A weekly walk, a Saturday breakfast, the drive to a class. Keep it sacred and keep it light.",
        "Be available, not intrusive. Sit in the kitchen when they are doing homework. Drive them places. The boring background presence is when teens drop the real things.",
        "When they share something hard — listen, do not fix. Adolescents who feel heard come back. Adolescents who feel lectured stop telling you anything by 14.",
        "Repair publicly when you mess up. 'I overreacted last night and I am sorry. I should have listened.' Teens have a finely-tuned hypocrisy detector. The parent who can apologise keeps their authority.",
      ],
      hi: [
        "Teens biologically माता-पिता से दूर और दोस्तों की तरफ जाने के लिए wired हैं। यह स्वस्थ है — यही launch की तैयारी है। आपका काम इससे लड़ना नहीं, बल्कि वह safe base बने रहना है जहां वे वापस आते हैं।",
        "1:1 ritual बचाएं जो school, behavior या काम के बारे में न हो। Weekly walk, शनिवार का breakfast, class तक drive। इसे पवित्र और हल्का रखें।",
        "Available रहें, intrusive नहीं। जब वे homework कर रहे हों, kitchen में बैठें। उन्हें कहीं छोड़ने जाएं। Boring background presence वही जगह है जहां teens असली बातें share करते हैं।",
        "जब वे मुश्किल बात share करें — सुनें, fix न करें। जो teens सुने हुए महसूस करते हैं, वे वापस आते हैं। जिन्हें lecture मिलता है, वे 14 साल में बताना बंद कर देते हैं।",
        "गलती पर माफी मांगें। 'कल मैं ज्यादा react कर गया था और माफी चाहता हूं। मुझे सुनना चाहिए था।' Teens में hypocrisy detector बहुत sharp होता है। माफी मांग सकने वाला parent अपनी authority बनाए रखता है।",
      ],
      hinglish: [
        "Teens biologically mata-pita se door aur doston ki taraf jaane ke liye wired hain. Yeh healthy hai — yahi launch ki taiyaari hai. Aapka kaam isse lad'na nahi, balki woh safe base bane rehna hai jahan woh wapas aate hain.",
        "1:1 ritual bachayein jo school, behavior ya kaam ke baare mein na ho. Weekly walk, Saturday ka breakfast, class tak drive. Ise sacred aur halka rakhein.",
        "Available rahein, intrusive nahi. Jab woh homework kar rahe hon, kitchen mein baithein. Unhein kahin chodne jayein. Boring background presence wahi jagah hai jahan teens asli baatein share karte hain.",
        "Jab woh mushkil baat share karein — sunein, fix na karein. Jo teens sune hue feel karte hain, woh wapas aate hain. Jinhe lecture milta hai, woh 14 saal mein batana band kar dete hain.",
        "Galti par maafi maangein. 'Kal main zyaada react kar gaya tha aur maafi chahta hoon. Mujhe sunna chahiye tha.' Teens mein hypocrisy detector bahut sharp hota hai. Maafi maang sakne wala parent apni authority banaye rakhta hai.",
      ],
    },
  }),
  L({
    id: "teen-mental-health-signs",
    title: {
      en: "When to Worry: Spotting Real Mental Health Concerns",
      hi: "चिंता कब करें: असली Mental Health समस्याओं को पहचानें",
      hinglish: "Chinta Kab Karein: Asli Mental Health Problems Ko Pehchanein",
    },
    description: {
      en: "Normal teen moods vs warning signs, and exactly what to do next.",
      hi: "सामान्य teen मूड बनाम warning signs, और आगे क्या करें।",
      hinglish: "Normal teen mood vs warning signs, aur aage kya karein.",
    },
    durationMin: 4, ageBucket: "10+", emoji: "💛", expert: "Based on AAP & WHO adolescent mental health guidelines",
    paragraphs: {
      en: [
        "Teen moods can be intense, fast-changing and confusing — and most of the time this is normal. But about 1 in 5 adolescents experiences a real mental-health condition. Knowing the line is one of the most important parenting skills of this decade.",
        "Normal: bad days, irritability, slammed doors, periods of wanting to be alone. These come and go and do not stop your teen from school, friends, food, sleep, or things they once enjoyed.",
        "Warning signs that warrant a professional conversation: persistent low mood for more than 2 weeks, withdrawal from friends and activities they used to love, big sleep or appetite changes, falling grades, talking about being a burden, hopelessness, or any mention of self-harm or suicide.",
        "What to do. Open a calm, private conversation. 'I have noticed you seem really weighed down. I love you and I want to understand. Can you tell me what is going on?'. Listen. Do not minimise. Do not promise to keep it a secret.",
        "Get help early. The first call is your paediatrician — they can screen and refer. Therapy works. Most teen mental-health conditions are highly treatable when caught early. Asking for help is a strength, not a failure of parenting.",
      ],
      hi: [
        "Teen के मूड तीव्र, जल्दी बदलने वाले और confusing हो सकते हैं — और ज़्यादातर समय यह सामान्य है। लेकिन लगभग 5 में से 1 किशोर वास्तविक mental health समस्या का अनुभव करता है। इस रेखा को जानना इस दशक की सबसे महत्वपूर्ण parenting skills में से एक है।",
        "सामान्य: बुरे दिन, चिड़चिड़ापन, दरवाज़ा पटकना, अकेले रहने के दौर। ये आते-जाते रहते हैं और school, दोस्त, खाना, नींद या पहले पसंद की चीज़ें बंद नहीं करते।",
        "Warning signs जो professional बातचीत की ज़रूरत बताते हैं: 2 हफ्ते से ज्यादा लगातार उदासी, पहले पसंद की activities से दूरी, नींद या भूख में बड़ा बदलाव, grades गिरना, बोझ होने की बातें, निराशा, या self-harm/suicide का कोई ज़िक्र।",
        "क्या करें: शांत, निजी बातचीत खोलें। 'मैंने देखा है तुम बहुत बोझिल लग रहे हो। मैं तुमसे प्यार करता हूं और समझना चाहता हूं। क्या मुझे बता सकते हो क्या हो रहा है?' सुनें। छोटा न करें। गुप्त रखने का वादा न करें।",
        "जल्दी मदद लें। पहली call आपके paediatrician को करें — वे screen करेंगे और refer करेंगे। Therapy काम करती है। जब जल्दी पकड़ा जाए तो ज्यादातर teen mental health conditions बहुत treatable हैं।",
      ],
      hinglish: [
        "Teen ke moods tivra, jaldi badalne wale aur confusing ho sakte hain — aur zyaadatar waqt yeh normal hai. Lekin lagbhag 5 mein se 1 adolescent asli mental health problem ka anubhav karta hai. Is rekha ko jaanna is dasak ki sabse important parenting skills mein se ek hai.",
        "Normal: bure din, chidchidaapan, darwaza patakna, akele rehne ke daur. Yeh aate-jaate rehte hain aur school, dost, khaana, neend ya pehle pasand ki cheezein band nahi karte.",
        "Warning signs jo professional baatcheet ki zarurat batate hain: 2 hafte se zyaada lagaataar udaasi, pehle pasand ki activities se doori, neend ya bhoookh mein bada badlaav, grades girna, bojh hone ki baatein, niraasha, ya self-harm/suicide ka koi zikr.",
        "Kya karein: shaant, niji baatcheet kholen. 'Mujhe dikha hai tum bahut bojhil lag rahe ho. Main tumse pyaar karta hoon aur samajhna chahta hoon. Kya mujhe bata sakte ho kya ho raha hai?' Sunein. Chhota na karein. Gupt rakhne ka waada na karein.",
        "Jaldi madad lein. Pehli call aapke paediatrician ko karein — woh screen karenge aur refer karenge. Therapy kaam karti hai. Jab jaldi pakda jaaye toh zyaadatar teen mental health conditions bahut treatable hain.",
      ],
    },
  }),
];

export const AGE_LABELS: Record<AgeBucket, Record<LangCode, string>> = {
  "0-2": { en: "0–2 years (infant)", hi: "0–2 साल (शिशु)", hinglish: "0–2 saal (infant)" },
  "2-4": { en: "2–4 years (toddler)", hi: "2–4 साल (toddler)", hinglish: "2–4 saal (toddler)" },
  "5-7": { en: "5–7 years (early school)", hi: "5–7 साल (शुरुआती स्कूल)", hinglish: "5–7 saal (early school)" },
  "8-10": { en: "8–10 years (tween)", hi: "8–10 साल (tween)", hinglish: "8–10 saal (tween)" },
  "10+": { en: "10+ years (tween / teen)", hi: "10+ साल (teen)", hinglish: "10+ saal (teen)" },
};

export function getAgeLabel(bucket: AgeBucket, lang: string): string {
  const l: LangCode = lang === "hi" ? "hi" : lang === "hinglish" ? "hinglish" : "en";
  return AGE_LABELS[bucket][l];
}

export function lessonsForAge(age: AgeBucket): Lesson[] {
  return LESSONS.filter((l) => l.ageBucket === age);
}
