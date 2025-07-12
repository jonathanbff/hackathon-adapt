import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { BookOpen, Play, CheckCircle, Clock } from "lucide-react";

export default function CourseStructurePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Course is Ready!</h1>
          <p className="text-muted-foreground">
            Here's your personalized course structure. Click on any lesson to generate detailed content.
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Module 1: Introduction
                </CardTitle>
                <Badge variant="secondary">3 lessons</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Play className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium">Lesson 1: Getting Started</p>
                    <p className="text-sm text-muted-foreground">Introduction and basics</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">15 min</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Play className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium">Lesson 2: Core Concepts</p>
                    <p className="text-sm text-muted-foreground">Building foundational knowledge</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">20 min</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium">Lesson 3: Practice Exercise</p>
                    <p className="text-sm text-muted-foreground">Apply what you've learned</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">25 min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
            <p className="text-muted-foreground mb-4">
              This is a preview of your course structure. The actual course with full integration 
              to the backend trigger workflows will be implemented next.
            </p>
            <Button>
              <BookOpen className="w-4 h-4 mr-2" />
              Explore Full Course
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 