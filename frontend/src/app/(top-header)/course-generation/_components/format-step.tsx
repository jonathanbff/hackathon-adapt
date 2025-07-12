import { motion } from "framer-motion";
import { Clock, Video, Headphones, BookOpen, Cpu, Code, Image, Presentation, CheckCircle } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import type { CourseGenerationInput } from "~/server/db/schemas";

interface FormatStepProps {
  data: CourseGenerationInput;
  onChange: (data: CourseGenerationInput) => void;
}

const durationOptions = [
  { id: "1-week", label: "1 Week", description: "Intensive course" },
  { id: "1-month", label: "1 Month", description: "Accelerated pace" },
  { id: "3-months", label: "3 Months", description: "Normal pace" },
  { id: "6-months", label: "6+ Months", description: "Relaxed pace" },
];

const formatOptions = [
  { id: "video", label: "Videos", icon: Video },
  { id: "audio", label: "Podcasts", icon: Headphones },
  { id: "text", label: "Text", icon: BookOpen },
  { id: "interactive", label: "Interactive", icon: Cpu },
  { id: "practical", label: "Practical", icon: Code },
  { id: "visual", label: "Visual", icon: Image },
  { id: "presentation", label: "Slides", icon: Presentation },
  { id: "quiz", label: "Quizzes", icon: CheckCircle },
];

export function FormatStep({ data, onChange }: FormatStepProps) {
  const updateDuration = (duration: string) => {
    onChange({ ...data, duration });
  };

  const toggleFormat = (formatId: string) => {
    const newFormat = data.format.includes(formatId)
      ? data.format.filter(f => f !== formatId)
      : [...data.format, formatId];
    
    onChange({ ...data, format: newFormat });
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
          <Clock className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <h2 className="text-3xl font-bold">Format and Duration</h2>
        <p className="text-muted-foreground">
          How would you like your course to be structured?
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardContent className="p-6">
            <Label className="text-lg font-medium mb-4 block">Course Duration</Label>
            <div className="grid grid-cols-4 gap-3">
              {durationOptions.map((duration) => (
                <motion.div
                  key={duration.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={cn(
                      "p-4 cursor-pointer transition-all",
                      {
                        "border-primary bg-primary/10": data.duration === duration.id,
                        "border-border hover:border-primary/50": data.duration !== duration.id,
                      }
                    )}
                    onClick={() => updateDuration(duration.id)}
                  >
                    <div className="text-center space-y-1">
                      <p className="font-medium">{duration.label}</p>
                      <p className="text-xs text-muted-foreground">{duration.description}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Label className="text-lg font-medium mb-4 block">Content Formats</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {formatOptions.map((format) => {
                const Icon = format.icon;
                const isSelected = data.format.includes(format.id);

                return (
                  <motion.div
                    key={format.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card 
                      className={cn(
                        "p-4 cursor-pointer transition-all",
                        {
                          "border-primary bg-primary/10": isSelected,
                          "border-border hover:border-primary/50": !isSelected,
                        }
                      )}
                      onClick={() => toggleFormat(format.id)}
                    >
                      <div className="text-center space-y-2">
                        <div className="text-primary">
                          <Icon className="w-5 h-5 mx-auto" />
                        </div>
                        <p className="text-sm font-medium">{format.label}</p>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 