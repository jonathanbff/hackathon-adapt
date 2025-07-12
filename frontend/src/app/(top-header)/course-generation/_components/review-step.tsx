import { motion } from "framer-motion";
import { CheckCircle, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import type { CourseGenerationInput } from "~/server/db/schemas";

interface ReviewStepProps {
  data: CourseGenerationInput;
}

export function ReviewStep({ data }: ReviewStepProps) {
  const formatGoals = (goals: string[]) => {
    const goalLabels: Record<string, string> = {
      career: "Advance Career",
      skill: "Develop Skill",
      hobby: "Personal Hobby",
      certification: "Certification",
      business: "Start Business",
      teaching: "Teach Others",
    };
    return goals.map(goal => goalLabels[goal] || goal);
  };

  const formatDuration = (duration: string) => {
    const durationLabels: Record<string, string> = {
      "1-week": "1 Week",
      "1-month": "1 Month",
      "3-months": "3 Months",
      "6-months": "6+ Months",
    };
    return durationLabels[duration] || duration;
  };

  const formatFormats = (formats: string[]) => {
    const formatLabels: Record<string, string> = {
      video: "Videos",
      audio: "Podcasts",
      text: "Text",
      interactive: "Interactive",
      practical: "Practical",
      visual: "Visual",
      presentation: "Slides",
      quiz: "Quizzes",
    };
    return formats.map(format => formatLabels[format] || format);
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
          <CheckCircle className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <h2 className="text-3xl font-bold">Review Your Course</h2>
        <p className="text-muted-foreground">
          Confirm the details before we generate your personalized course
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Topic</Label>
              <p className="font-medium">{data.title}</p>
              {data.description && (
                <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
              )}
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground">Goals</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {formatGoals(data.goals).map(goal => (
                  <Badge key={goal} variant="secondary">{goal}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground">Duration</Label>
              <p className="font-medium">{formatDuration(data.duration)}</p>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground">Content Formats</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {formatFormats(data.format).map(format => (
                  <Badge key={format} variant="outline">{format}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground">AI Preferences</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline">Tone: {data.aiPreferences.tone}</Badge>
                <Badge variant="outline">Interactivity: {data.aiPreferences.interactivity}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-primary/10 border border-primary/20 rounded-lg"
        >
          <div className="flex items-start space-x-4">
            <Bot className="w-8 h-8 text-primary mt-1" />
            <div className="space-y-2">
              <p className="font-medium">Your AI is ready!</p>
              <p className="text-sm text-muted-foreground">
                Based on your preferences, we'll create a personalized course with {data.format.length} content types
                optimized for your learning style. The course will be generated hierarchically - you'll see the structure
                immediately, and detailed content will be created as you progress.
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="outline">Personalized</Badge>
                <Badge variant="outline">Adaptive</Badge>
                <Badge variant="outline">Interactive</Badge>
                <Badge variant="outline">Fast Generation</Badge>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 