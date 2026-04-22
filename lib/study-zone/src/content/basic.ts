import type { SubjectPack, BasicSubjectId } from "../types";

export const BASIC_SUBJECTS: SubjectPack<BasicSubjectId>[] = [
  {
    id: "math",
    title: "Math",
    emoji: "➕",
    topics: [
      {
        id: "addition",
        title: "Addition",
        notes:
          "Addition means putting numbers together to find a total.\nWhen you add, you combine groups: 2 + 3 means 2 things plus 3 more things.\nThe '+' sign means add. The '=' sign shows the answer.\nExample: 2 + 3 = 5.",
        amyPrompt: "Explain addition simply for a child in class 1-5 with one fun real-life example.",
        questions: [
          { q: "2 + 3 = ?",   options: ["4", "5", "6", "7"], answer: 1, hint: "Count two then three more." },
          { q: "5 + 4 = ?",   options: ["8", "9", "10", "11"], answer: 1 },
          { q: "10 + 7 = ?",  options: ["15", "16", "17", "18"], answer: 2 },
          { q: "What sign means add?", options: ["-", "+", "×", "÷"], answer: 1 },
          { q: "1 + 1 = ?",   options: ["1", "2", "3", "0"], answer: 1 },
        ],
      },
      {
        id: "fractions",
        title: "Fractions",
        notes:
          "A fraction shows part of a whole.\nIf a pizza is cut into 4 equal pieces and you eat 1, you ate 1/4 of the pizza.\nThe top number (numerator) tells how many parts you have.\nThe bottom number (denominator) tells how many equal parts the whole was divided into.",
        amyPrompt: "Explain fractions in a simple way using a pizza or chocolate example for a class 3-5 child.",
        questions: [
          { q: "If a cake is cut into 8 equal pieces and you eat 1, what fraction did you eat?", options: ["1/4", "1/8", "1/2", "8/1"], answer: 1 },
          { q: "Which fraction is bigger: 1/2 or 1/4?", options: ["1/2", "1/4", "Same", "Cannot tell"], answer: 0 },
          { q: "What is the bottom number of a fraction called?", options: ["Numerator", "Denominator", "Whole", "Sum"], answer: 1 },
          { q: "Half of an apple is the same as ___?", options: ["1/2", "2/2", "1/4", "1"], answer: 0 },
        ],
      },
      {
        id: "multiplication",
        title: "Multiplication",
        notes:
          "Multiplication is a quick way to add the same number many times.\n3 × 4 means add 3 four times: 3 + 3 + 3 + 3 = 12.\nThe '×' sign means multiply.\nLearning tables makes multiplication faster.",
        amyPrompt: "Explain multiplication as repeated addition for a class 2-4 child with one example.",
        questions: [
          { q: "3 × 4 = ?", options: ["7", "10", "12", "14"], answer: 2 },
          { q: "5 × 5 = ?", options: ["10", "20", "25", "30"], answer: 2 },
          { q: "2 × 6 = ?", options: ["10", "12", "14", "16"], answer: 1 },
          { q: "1 × 9 = ?", options: ["0", "1", "9", "10"], answer: 2 },
        ],
      },
    ],
  },
  {
    id: "science",
    title: "Science",
    emoji: "🔬",
    topics: [
      {
        id: "plants",
        title: "Parts of a Plant",
        notes:
          "Plants have several main parts:\nRoots — hold the plant in soil and drink water.\nStem — carries water from roots to leaves.\nLeaves — make food for the plant using sunlight.\nFlower — makes seeds so new plants can grow.",
        amyPrompt: "List the main parts of a plant and what each one does, in language a class 1-3 child can understand.",
        questions: [
          { q: "Which part of a plant makes food?", options: ["Roots", "Stem", "Leaves", "Flower"], answer: 2 },
          { q: "Which part holds the plant in the soil?", options: ["Roots", "Leaves", "Flower", "Fruit"], answer: 0 },
          { q: "What helps plants make food?", options: ["Moonlight", "Sunlight", "Wind", "Snow"], answer: 1 },
          { q: "Where do new plants come from?", options: ["Stem", "Leaves", "Seeds", "Roots"], answer: 2 },
        ],
      },
      {
        id: "states-of-matter",
        title: "States of Matter",
        notes:
          "Everything around us is made of matter.\nMatter has three main states: solid, liquid, and gas.\nA solid (like a stone) keeps its shape.\nA liquid (like water) takes the shape of its container.\nA gas (like air) spreads out everywhere.",
        amyPrompt: "Explain solid, liquid and gas with one everyday example each, for a class 3-5 child.",
        questions: [
          { q: "Which is a liquid?", options: ["Wood", "Water", "Stone", "Ice"], answer: 1 },
          { q: "Which is a gas?", options: ["Milk", "Air", "Sugar", "Sand"], answer: 1 },
          { q: "Ice is a ___?", options: ["Solid", "Liquid", "Gas", "Plasma"], answer: 0 },
          { q: "How many main states of matter are there (basic)?", options: ["1", "2", "3", "5"], answer: 2 },
        ],
      },
    ],
  },
  {
    id: "english",
    title: "English",
    emoji: "📖",
    topics: [
      {
        id: "nouns",
        title: "Nouns",
        notes:
          "A noun is a naming word.\nIt names a person (Riya), a place (school), an animal (dog) or a thing (book).\nNouns can be common (dog) or proper (Tommy).",
        amyPrompt: "Explain nouns with simple examples for a class 1-3 child.",
        questions: [
          { q: "Which word is a noun?", options: ["Run", "Quickly", "Apple", "Happy"], answer: 2 },
          { q: "Which is a proper noun?", options: ["girl", "boy", "Sara", "school"], answer: 2 },
          { q: "A noun can name a ___?", options: ["sound only", "person, place, animal or thing", "color only", "feeling only"], answer: 1 },
          { q: "Pick the noun: 'The dog is barking loudly.'", options: ["barking", "loudly", "is", "dog"], answer: 3 },
        ],
      },
      {
        id: "verbs",
        title: "Verbs",
        notes:
          "A verb is an action or doing word.\nWords like run, eat, jump, write and read are verbs.\nVerbs tell us what someone or something is doing.",
        amyPrompt: "Explain verbs with three simple action examples for a class 1-3 child.",
        questions: [
          { q: "Which word is a verb?", options: ["Tree", "Jump", "Blue", "Soft"], answer: 1 },
          { q: "Pick the verb: 'She reads a book.'", options: ["She", "reads", "a", "book"], answer: 1 },
          { q: "Which one is NOT a verb?", options: ["Eat", "Sleep", "Apple", "Run"], answer: 2 },
          { q: "A verb is a ___ word.", options: ["naming", "doing", "describing", "joining"], answer: 1 },
        ],
      },
    ],
  },
  {
    id: "gk",
    title: "General Knowledge",
    emoji: "🌍",
    topics: [
      {
        id: "india-basics",
        title: "About India",
        notes:
          "India is a big country in Asia.\nThe capital of India is New Delhi.\nThe national flag has three colors: saffron, white and green, with a blue Ashoka chakra in the middle.\nThe national animal is the tiger and the national bird is the peacock.",
        amyPrompt: "Share 3 fun facts about India that a class 2-4 child would enjoy.",
        questions: [
          { q: "Capital of India?",     options: ["Mumbai", "New Delhi", "Chennai", "Kolkata"], answer: 1 },
          { q: "National animal of India?", options: ["Lion", "Elephant", "Tiger", "Peacock"], answer: 2 },
          { q: "National bird of India?",   options: ["Sparrow", "Parrot", "Peacock", "Crow"], answer: 2 },
          { q: "How many colors are on the Indian flag?", options: ["2", "3", "4", "5"], answer: 1 },
        ],
      },
      {
        id: "solar-system",
        title: "Solar System",
        notes:
          "The Sun is at the center of our solar system.\n8 planets move around the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.\nEarth is the only planet we know that has life.\nThe Moon is Earth's natural satellite.",
        amyPrompt: "Tell a class 2-5 child about the planets in a fun, easy way and a quick way to remember them.",
        questions: [
          { q: "How many planets are in our solar system?", options: ["7", "8", "9", "10"], answer: 1 },
          { q: "Which planet do we live on?",  options: ["Mars", "Earth", "Venus", "Jupiter"], answer: 1 },
          { q: "Which is the closest planet to the Sun?", options: ["Earth", "Venus", "Mercury", "Mars"], answer: 2 },
          { q: "What is at the center of the solar system?", options: ["Earth", "Moon", "Sun", "Jupiter"], answer: 2 },
        ],
      },
    ],
  },
];
