import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { AgeGroup, SKILL_FOCUS_BY_GROUP, STORIES_BY_GROUP, PARENT_TASKS_BY_GROUP } from "@/lib/age-groups";
import { speak } from "@/lib/voice";

// ─────────────────────────────────────────────────────────────
// Skill Focus Section
// ─────────────────────────────────────────────────────────────
interface SkillFocusSectionProps {
  group: AgeGroup;
  childName: string;
}

export function SkillFocusSection({ group, childName }: SkillFocusSectionProps) {
  const skills = SKILL_FOCUS_BY_GROUP[group];
  const colors = ["bg-blue-50 border-blue-200", "bg-purple-50 border-purple-200", "bg-amber-50 border-amber-200", "bg-emerald-50 border-emerald-200"];

  return (
    <Card className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🧠</span>
          <div>
            <h3 className="font-quicksand text-base font-bold text-violet-900">
              Skills to Focus on for {childName}
            </h3>
            <p className="text-xs text-violet-700">Age-appropriate development activities for today</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {skills.map((s, i) => (
            <div key={s.skill} className={`rounded-2xl border-2 p-3 ${colors[i % colors.length]}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{s.emoji}</span>
                <span className="font-bold text-sm">{s.skill}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.activity}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 text-center">
          ✨ The AI will incorporate these focus areas when generating {childName}'s routine
        </p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Story Section
// ─────────────────────────────────────────────────────────────
interface StorySectionProps {
  group: AgeGroup;
  childName: string;
}


export function StorySection({ group, childName }: StorySectionProps) {
  const stories = STORIES_BY_GROUP[group];
  const [activeIdx, setActiveIdx] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const story = stories[activeIdx];

  const handleSpeak = () => {
    if (!story) return;
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    const text = `${story.title}. ${story.story}. Moral: ${story.moral}`;
    speak(text).catch(() => {});
    // Listen for end/error to flip speaking state
    const utterThis = () => {
      if (!("speechSynthesis" in window)) { setSpeaking(false); return; }
      const checkDone = setInterval(() => {
        if (!window.speechSynthesis.speaking) { setSpeaking(false); clearInterval(checkDone); }
      }, 500);
    };
    setTimeout(utterThis, 100);
  };

  if (!story) return null;

  return (
    <Card className="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📖</span>
          <div>
            <h3 className="font-quicksand text-base font-bold text-amber-900">
              Story Time for {childName}
            </h3>
            <p className="text-xs text-amber-700">Age-appropriate moral stories</p>
          </div>
        </div>

        {/* Story selector tabs */}
        {stories.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {stories.map((s, i) => (
              <button
                key={s.title}
                onClick={() => { setActiveIdx(i); setSpeaking(false); window.speechSynthesis?.cancel(); }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                  i === activeIdx
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"
                }`}
              >
                {s.emoji} {s.title}
              </button>
            ))}
          </div>
        )}

        {/* Story content */}
        <div className="bg-white rounded-2xl p-4 border border-amber-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-lg text-amber-900">
              {story.emoji} {story.title}
            </h4>
            <Button
              size="sm"
              variant="outline"
              className={`rounded-full h-8 px-3 transition-all ${speaking ? "bg-amber-100 border-amber-400 text-amber-700" : "border-amber-200 text-amber-700 hover:bg-amber-50"}`}
              onClick={handleSpeak}
            >
              {speaking ? (
                <><VolumeX className="h-3.5 w-3.5 mr-1" /> Stop</>
              ) : (
                <><Volume2 className="h-3.5 w-3.5 mr-1" /> Read Aloud</>
              )}
            </Button>
          </div>
          <p className="text-sm text-foreground leading-relaxed mb-4 italic">
            "{story.story}"
          </p>
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <p className="text-xs font-bold text-amber-800 mb-1">💡 Moral of the Story</p>
            <p className="text-sm text-amber-900 font-medium">{story.moral}</p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mt-3 text-center">
          📚 Read this story to {childName} tonight for a meaningful bedtime moment
        </p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Parent Tasks Section
// ─────────────────────────────────────────────────────────────
interface ParentTasksSectionProps {
  group: AgeGroup;
  childName: string;
}

export function ParentTasksSection({ group, childName }: ParentTasksSectionProps) {
  const tasks = PARENT_TASKS_BY_GROUP[group];
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggle = (i: number) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <Card className="rounded-3xl border-2 border-rose-200 bg-rose-50 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💝</span>
            <div>
              <h3 className="font-quicksand text-base font-bold text-rose-900">
                Your Parent Tasks
              </h3>
              <p className="text-xs text-rose-700">Things you can do for {childName} today</p>
            </div>
          </div>
          <div className="text-xs font-bold text-rose-800 bg-white rounded-full px-3 py-1 border border-rose-200">
            {doneCount}/{tasks.length} done
          </div>
        </div>
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <button
              key={t.task}
              onClick={() => toggle(i)}
              className={`w-full flex items-start gap-3 rounded-2xl p-3 border-2 transition-all text-left ${
                checked[i] ? "bg-rose-100 border-rose-300 opacity-75" : "bg-white border-rose-100 hover:border-rose-300"
              }`}
            >
              <div className={`mt-0.5 h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                checked[i] ? "bg-rose-500 border-rose-500" : "border-rose-300"
              }`}>
                {checked[i] && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-xl shrink-0 mt-0.5">{t.emoji}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${checked[i] ? "line-through text-muted-foreground" : "text-rose-900"}`}>{t.task}</p>
                <p className="text-xs text-rose-600 mt-0.5">⏱ {t.time}</p>
              </div>
            </button>
          ))}
        </div>
        {doneCount === tasks.length && doneCount > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm font-bold text-rose-700">🌟 Amazing! You're a star parent today!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
