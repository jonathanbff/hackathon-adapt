import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Sparkles, BookOpen, Lightbulb } from "lucide-react";

export default function CourseGenerationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create AI Course</h1>
        <p className="text-muted-foreground">
          Generate personalized courses with artificial intelligence
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Quick Course Generation
            </CardTitle>
            <CardDescription>
              Generate a complete course from a simple topic or description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Let our AI create a structured course with modules, lessons, and assessments based on your topic.
            </p>
            <Button className="w-full">
              Start Generation
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              From Your Documents
            </CardTitle>
            <CardDescription>
              Create courses based on your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Transform your existing documents into interactive courses with AI-powered content structuring.
            </p>
            <Button variant="outline" className="w-full">
              Use Documents
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recent Generations
          </CardTitle>
          <CardDescription>
            View and manage your recent course generation requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent generations. Create your first AI-powered course to get started!
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 