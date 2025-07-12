import { motion } from "framer-motion";
import { Upload, FileText, Video, Layers, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import type { CourseGenerationInput } from "~/server/db/schemas";

interface MaterialsStepProps {
  data: CourseGenerationInput;
  onChange: (data: CourseGenerationInput) => void;
}

const materialTypes = [
  {
    id: "documents",
    label: "Documents & PDFs",
    description: "Reference materials and content",
    icon: FileText,
  },
  {
    id: "videos",
    label: "Videos",
    description: "Video lessons and demonstrations",
    icon: Video,
  },
  {
    id: "roadmap",
    label: "Course Roadmap",
    description: "Custom structure and timeline",
    icon: Layers,
  },
];

export function MaterialsStep({ data, onChange }: MaterialsStepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="w-24 h-24 mx-auto bg-primary rounded-full flex items-center justify-center"
        >
          <Upload className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <h2 className="text-3xl font-bold">Course Materials</h2>
        <p className="text-muted-foreground">
          Add your own materials or let our AI create everything for you
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {materialTypes.map((type) => {
          const Icon = type.icon;
          
          return (
            <motion.div
              key={type.id}
              whileHover={{ scale: 1.02 }}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-4 hover:border-primary/50 transition-colors"
            >
              <Icon className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">{type.label}</p>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </motion.div>
          );
        })}

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="border-2 border-primary/50 bg-primary/5 rounded-xl p-8 text-center space-y-4 md:col-span-2"
        >
          <Sparkles className="h-12 w-12 mx-auto text-primary" />
          <div>
            <p className="font-medium">Let AI Create Everything</p>
            <p className="text-sm text-muted-foreground">
              Our AI will create all content based on your preferences
            </p>
          </div>
          <Badge variant="secondary">Recommended</Badge>
        </motion.div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          💡 You can add materials now or let our AI create content based on your profile
        </p>
      </div>
    </div>
  );
} 