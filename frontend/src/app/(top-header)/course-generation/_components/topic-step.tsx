import { motion } from "framer-motion";
import { Lightbulb, Bot } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import type { CourseGenerationInput } from "~/server/db/schemas";

interface TopicStepProps {
  data: CourseGenerationInput;
  onChange: (data: CourseGenerationInput) => void;
}

export function TopicStep({ data, onChange }: TopicStepProps) {
  const updateData = (updates: Partial<CourseGenerationInput>) => {
    onChange({ ...data, ...updates });
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
          <Lightbulb className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <h2 className="text-3xl font-bold">What do you want to learn?</h2>
        <p className="text-muted-foreground">
          Enter your topic and our AI will create a personalized course for you
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4">
            <Label className="text-lg font-medium">Course Topic</Label>
            <Input
              placeholder="e.g., Python for Beginners, Digital Marketing, UX Design..."
              value={data.title}
              onChange={(e) => updateData({ title: e.target.value })}
              className="text-lg p-4 h-14"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-medium">Description (Optional)</Label>
            <Textarea
              placeholder="Describe what you'd like to learn specifically..."
              value={data.description}
              onChange={(e) => updateData({ description: e.target.value })}
              rows={4}
              className="resize-none"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-primary/10 border border-primary/20 rounded-lg"
          >
            <div className="flex items-start space-x-3">
              <Bot className="w-5 h-5 text-primary mt-1" />
              <div className="space-y-2">
                <p className="text-sm font-medium">AI Suggestion:</p>
                <p className="text-sm text-muted-foreground">
                  Based on your learning preferences, we'll create a practical course with hands-on exercises
                  and real-world examples to maximize your learning experience.
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
} 