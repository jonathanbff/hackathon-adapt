import { motion } from "framer-motion";
import { Palette } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import type { CourseGenerationInput } from "~/server/db/schemas";

interface AiPreferencesStepProps {
  data: CourseGenerationInput;
  onChange: (data: CourseGenerationInput) => void;
}

const toneOptions = [
  { id: "professional", label: "Professional", description: "Formal and technical" },
  { id: "friendly", label: "Friendly", description: "Conversational and accessible" },
  { id: "energetic", label: "Energetic", description: "Motivating and enthusiastic" },
];

const interactivityOptions = [
  { id: "high", label: "High", description: "Many quizzes and exercises" },
  { id: "medium", label: "Medium", description: "Some interactive checkpoints" },
  { id: "low", label: "Low", description: "Focus on main content" },
];

export function AiPreferencesStep({ data, onChange }: AiPreferencesStepProps) {
  const updatePreferences = (key: keyof typeof data.aiPreferences, value: string) => {
    onChange({
      ...data,
      aiPreferences: {
        ...data.aiPreferences,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="w-24 h-24 mx-auto bg-primary rounded-full flex items-center justify-center"
        >
          <Palette className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <h2 className="text-3xl font-bold">AI Personalization</h2>
        <p className="text-muted-foreground">
          Configure how AI should create your content
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <Label className="text-lg font-medium mb-4 block">Content Tone</Label>
            <div className="grid grid-cols-3 gap-3">
              {toneOptions.map((tone) => (
                <Card 
                  key={tone.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all",
                    {
                      "border-primary bg-primary/10": data.aiPreferences.tone === tone.id,
                      "border-border hover:border-primary/50": data.aiPreferences.tone !== tone.id,
                    }
                  )}
                  onClick={() => updatePreferences("tone", tone.id)}
                >
                  <div className="text-center space-y-1">
                    <p className="font-medium">{tone.label}</p>
                    <p className="text-xs text-muted-foreground">{tone.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Label className="text-lg font-medium mb-4 block">Interactivity Level</Label>
            <div className="grid grid-cols-3 gap-3">
              {interactivityOptions.map((level) => (
                <Card 
                  key={level.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all",
                    {
                      "border-primary bg-primary/10": data.aiPreferences.interactivity === level.id,
                      "border-border hover:border-primary/50": data.aiPreferences.interactivity !== level.id,
                    }
                  )}
                  onClick={() => updatePreferences("interactivity", level.id)}
                >
                  <div className="text-center space-y-1">
                    <p className="font-medium">{level.label}</p>
                    <p className="text-xs text-muted-foreground">{level.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 