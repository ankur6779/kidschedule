import type { SubjectPack, AdvancedSubjectId } from "../types";
import {
  IMG_ALGEBRA, IMG_TRIANGLES, IMG_TRIGONOMETRY,
  IMG_FORCE_MOTION, IMG_CELLS, IMG_ACIDS_BASES,
  IMG_TENSES, IMG_ACTIVE_PASSIVE,
} from "./images";

export const ADVANCED_SUBJECTS: SubjectPack<AdvancedSubjectId>[] = [
  {
    id: "math",
    title: "Math",
    emoji: "📐",
    topics: [
      {
        id: "algebra-basics",
        title: "Algebra Basics",
        imageExample: IMG_ALGEBRA,
        notes:
          "Algebra uses letters (called variables) in place of unknown numbers.\nA variable like x can stand for any number we don't know yet.\nAn equation says that two expressions are equal, e.g. x + 3 = 7.\nTo solve, we do the same operation on both sides until x is alone.\nExample: x + 3 = 7  →  x = 7 − 3  →  x = 4.",
        amyPrompt: "Explain algebra basics — variables and solving simple equations — for a class 6-8 student with one worked example.",
        questions: [
          { q: "Solve x + 5 = 12", options: ["5", "7", "12", "17"], answer: 1 },
          { q: "If 2x = 10, then x = ?", options: ["2", "5", "10", "20"], answer: 1, hint: "Divide both sides by 2." },
          { q: "Which is a variable?", options: ["+", "5", "x", "="], answer: 2 },
          { q: "Solve x − 4 = 9", options: ["5", "9", "13", "36"], answer: 2 },
          { q: "If 3x + 1 = 10, then x = ?", options: ["2", "3", "4", "9"], answer: 1 },
        ],
      },
      {
        id: "geometry-triangles",
        title: "Triangles",
        imageExample: IMG_TRIANGLES,
        notes:
          "A triangle has 3 sides and 3 angles.\nThe sum of all three angles is always 180°.\nTypes by sides: equilateral (all equal), isosceles (two equal), scalene (all different).\nTypes by angles: acute (all <90°), right (one =90°), obtuse (one >90°).",
        amyPrompt: "Summarise the types of triangles and the angle-sum property for a class 6-8 student with a quick example.",
        questions: [
          { q: "Sum of angles in a triangle?", options: ["90°", "180°", "270°", "360°"], answer: 1 },
          { q: "A triangle with all sides equal is called?", options: ["Scalene", "Isosceles", "Equilateral", "Right"], answer: 2 },
          { q: "A triangle with one 90° angle is a ___ triangle.", options: ["Acute", "Right", "Obtuse", "Equilateral"], answer: 1 },
          { q: "If two angles are 60° and 70°, the third is?", options: ["40°", "50°", "60°", "70°"], answer: 1 },
        ],
      },
      {
        id: "trigonometry-basics",
        title: "Trigonometry Basics",
        imageExample: IMG_TRIGONOMETRY,
        notes:
          "Trigonometry studies the relationship between the angles and sides of a right triangle.\nFor a given angle θ in a right triangle:\n  sin θ = opposite / hypotenuse\n  cos θ = adjacent / hypotenuse\n  tan θ = opposite / adjacent\nKey values to remember: sin 30°=1/2, cos 60°=1/2, tan 45°=1.",
        amyPrompt: "Explain sin, cos, tan in a right triangle for a class 9-10 student with one worked example.",
        questions: [
          { q: "sin 30° = ?", options: ["0", "1/2", "√3/2", "1"], answer: 1 },
          { q: "tan 45° = ?", options: ["0", "1/2", "1", "√3"], answer: 2 },
          { q: "cos 0° = ?",  options: ["0", "1/2", "1", "√3/2"], answer: 2 },
          { q: "Which ratio = opposite / hypotenuse?", options: ["sin", "cos", "tan", "cot"], answer: 0 },
        ],
      },
    ],
  },
  {
    id: "science",
    title: "Science",
    emoji: "⚗️",
    topics: [
      {
        id: "force-motion",
        title: "Force and Motion",
        imageExample: IMG_FORCE_MOTION,
        notes:
          "A force is a push or a pull that can change the speed, direction or shape of an object.\nNewton's first law: an object stays at rest or moves at constant speed unless a force acts on it.\nNewton's second law: F = m × a (force = mass × acceleration).\nNewton's third law: every action has an equal and opposite reaction.",
        amyPrompt: "Explain Newton's three laws of motion with one daily-life example each for a class 8-10 student.",
        questions: [
          { q: "Force = mass × ?", options: ["Velocity", "Acceleration", "Distance", "Time"], answer: 1 },
          { q: "Unit of force?",   options: ["Joule", "Watt", "Newton", "Pascal"], answer: 2 },
          { q: "Whose laws describe motion?", options: ["Einstein", "Newton", "Galileo", "Darwin"], answer: 1 },
          { q: "Action and reaction are ___ in magnitude.", options: ["Equal", "Opposite", "Different", "Zero"], answer: 0 },
        ],
      },
      {
        id: "cells",
        title: "Cells — The Building Blocks",
        imageExample: IMG_CELLS,
        notes:
          "All living things are made of cells.\nCells were first observed by Robert Hooke in 1665.\nA plant cell has a cell wall, chloroplasts and a large vacuole.\nAn animal cell has no cell wall and usually no chloroplasts.\nThe nucleus controls all activities of the cell.",
        amyPrompt: "Compare plant and animal cells with their main parts for a class 8-9 student.",
        questions: [
          { q: "Who first observed cells?", options: ["Newton", "Darwin", "Hooke", "Mendel"], answer: 2 },
          { q: "Which structure is found only in plant cells?", options: ["Nucleus", "Cell wall", "Cytoplasm", "Mitochondria"], answer: 1 },
          { q: "What controls the cell's activities?", options: ["Cytoplasm", "Cell wall", "Nucleus", "Vacuole"], answer: 2 },
          { q: "Where does photosynthesis happen?", options: ["Nucleus", "Mitochondria", "Chloroplasts", "Vacuole"], answer: 2 },
        ],
      },
      {
        id: "acids-bases",
        title: "Acids, Bases & Salts",
        imageExample: IMG_ACIDS_BASES,
        notes:
          "Acids taste sour and turn blue litmus red (e.g. lemon, vinegar).\nBases taste bitter and turn red litmus blue (e.g. soap, baking soda).\nThe pH scale runs from 0 to 14: <7 is acidic, 7 is neutral, >7 is basic.\nWhen an acid reacts with a base, they form a salt and water (neutralisation).",
        amyPrompt: "Explain the pH scale and acid-base reactions for a class 7-10 student with everyday examples.",
        questions: [
          { q: "pH of a neutral substance?", options: ["0", "7", "10", "14"], answer: 1 },
          { q: "Acids turn ___ litmus ___.", options: ["red, blue", "blue, red", "green, yellow", "yellow, green"], answer: 1 },
          { q: "Acid + Base → ?", options: ["Acid + Water", "Salt + Water", "Gas + Water", "Salt only"], answer: 1 },
          { q: "Which is acidic?", options: ["Soap", "Lemon juice", "Pure water", "Baking soda"], answer: 1 },
        ],
      },
    ],
  },
  {
    id: "english",
    title: "English",
    emoji: "✍️",
    topics: [
      {
        id: "tenses",
        title: "Tenses Overview",
        imageExample: IMG_TENSES,
        notes:
          "Tense shows when something happens.\nPresent: I write a letter. (happening now / regularly)\nPast: I wrote a letter. (already happened)\nFuture: I will write a letter. (will happen later)\nEach tense has simple, continuous, perfect and perfect-continuous forms.",
        amyPrompt: "Explain past, present and future tenses with one example sentence each for a class 6-8 student.",
        questions: [
          { q: "'She wrote a poem' — which tense?", options: ["Present", "Past", "Future", "Continuous"], answer: 1 },
          { q: "Future of 'go'?", options: ["went", "going", "will go", "gone"], answer: 2 },
          { q: "'I am eating' — which tense?", options: ["Past simple", "Present continuous", "Future simple", "Past continuous"], answer: 1 },
          { q: "Past form of 'run'?", options: ["runned", "ran", "running", "run"], answer: 1 },
        ],
      },
      {
        id: "active-passive",
        title: "Active and Passive Voice",
        imageExample: IMG_ACTIVE_PASSIVE,
        notes:
          "Active voice: the subject does the action — 'Riya writes a letter.'\nPassive voice: the action is done to the subject — 'A letter is written by Riya.'\nUse passive when the doer is unknown or unimportant.\nFormation: form of 'be' + past participle of verb.",
        amyPrompt: "Explain how to convert active voice to passive voice with two examples for a class 7-9 student.",
        questions: [
          { q: "Convert to passive: 'He plays football.'", options: ["Football is played by him.", "Football was played by him.", "Football will be played by him.", "Football has played him."], answer: 0 },
          { q: "'The book was read by Anu.' — voice?", options: ["Active", "Passive", "Imperative", "Interrogative"], answer: 1 },
          { q: "Active voice focuses on the ___?", options: ["Object", "Doer (subject)", "Action only", "Time"], answer: 1 },
          { q: "Passive needs which helper verb form?", options: ["have", "be", "do", "may"], answer: 1 },
        ],
      },
    ],
  },
];
