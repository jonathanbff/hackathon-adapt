import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import { useRouter } from "next/navigation";
import type { CourseGenerationInput } from "~/server/db/schemas";

interface GenerationProgressProps {
  courseData: CourseGenerationInput;
}

interface AIAgent {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  isActive: boolean;
  message: string;
}

const aiAgents: AIAgent[] = [
  {
    id: "structure-architect",
    name: "Architect AI",
    avatar: "🏗️",
    specialty: "Course Structure",
    isActive: false,
    message: "Creating the perfect learning pathway for you!",
  },
  {
    id: "content-creator",
    name: "Professor AI",
    avatar: "🎓",
    specialty: "Content Creation",
    isActive: false,
    message: "Generating engaging content based on your profile!",
  },
  {
    id: "video-curator",
    name: "Video Curator AI",
    avatar: "🎬",
    specialty: "Video Content",
    isActive: false,
    message: "Finding the best educational videos for your topics!",
  },
  {
    id: "assessment-designer",
    name: "Evaluator AI",
    avatar: "📊",
    specialty: "Assessments",
    isActive: false,
    message: "Creating assessments to test your knowledge!",
  },
];

const generationSteps = [
  { name: "Course Structure", description: "Building learning pathway" },
  { name: "Module Content", description: "Creating detailed modules" },
  { name: "Video Integration", description: "Finding relevant videos" },
  { name: "Assessments", description: "Generating quizzes and tests" },
  { name: "Finalization", description: "Preparing your course" },
];

export function GenerationProgress({ courseData }: GenerationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const router = useRouter();

  useEffect(() => {
    const generateCourse = async () => {
      for (let i = 0; i < generationSteps.length; i++) {
        setCurrentStep(i);
        
        const agentIndex = i % aiAgents.length;
        setActiveAgents([aiAgents[agentIndex].id]);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setProgress(((i + 1) / generationSteps.length) * 100);
        setCompletedSteps(prev => [...prev, i]);
        setActiveAgents([]);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setTimeout(() => {
        router.push("/course-structure");
      }, 1500);
    };

    generateCourse();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-32 h-32 mx-auto bg-primary rounded-full flex items-center justify-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-16 h-16 text-primary-foreground" />
              </motion.div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Generating Your Course</h1>
            <p className="text-xl text-muted-foreground mb-2">"{courseData.title}"</p>
            <p className="text-muted-foreground">
              Our AI agents are working together to create your personalized learning experience
            </p>
          </motion.div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Bot className="w-5 h-5 mr-2" />
                  AI Agents
                </h3>
                <div className="space-y-3">
                  {aiAgents.map((agent) => {
                    const isActive = activeAgents.includes(agent.id);
                    return (
                      <motion.div
                        key={agent.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          isActive ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                        }`}
                        animate={{
                          scale: isActive ? 1.02 : 1,
                        }}
                      >
                        <div className="text-2xl">{agent.avatar}</div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-sm">{agent.name}</p>
                            {isActive && (
                              <Loader2 className="w-3 h-3 animate-spin text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{agent.specialty}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Generation Steps</h3>
                <div className="space-y-3">
                  {generationSteps.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = completedSteps.includes(index);
                    
                    return (
                      <motion.div
                        key={index}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          isActive ? 'bg-primary/10 border border-primary/20' : 
                          isCompleted ? 'bg-green-50 border border-green-200' : 'bg-muted/50'
                        }`}
                        animate={{
                          scale: isActive ? 1.02 : 1,
                        }}
                      >
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : isActive ? (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">{step.name}</p>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-primary/5 border border-primary/20 rounded-lg"
          >
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">Hierarchical Generation</Badge>
              <Badge variant="outline">Fast Structure</Badge>
              <Badge variant="outline">On-Demand Content</Badge>
              <Badge variant="outline">YouTube Integration</Badge>
              <Badge variant="outline">Vector Search</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Using Groq AI for fast inference • Creating {courseData.structure.modules} modules • 
              {courseData.structure.lessonsPerModule} lessons per module
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 