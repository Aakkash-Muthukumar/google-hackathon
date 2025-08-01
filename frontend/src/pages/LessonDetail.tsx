import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Wand2, Loader2, CheckCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Course, Lesson } from '@/lib/types';
import { courseAPI } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

export default function LessonDetail() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourseAndLesson = async () => {
      if (!courseId || !lessonId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Load course
        const courseResponse = await courseAPI.getById(courseId);
        if (courseResponse && typeof courseResponse === 'object') {
          setCourse(courseResponse);
          
          // Find the specific lesson
          const foundLesson = courseResponse.lessons?.find(l => l.id === lessonId);
          if (foundLesson) {
            setLesson(foundLesson);
          } else {
            setError('Lesson not found');
          }
        } else {
          setError('Course not found');
        }
      } catch (err) {
        console.error('Error loading course/lesson:', err);
        setError('Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };

    loadCourseAndLesson();
  }, [courseId, lessonId]);

  const handleGenerateContent = async () => {
    if (!lesson || !course) return;
    
    try {
      setGenerating(true);
      setError(null);
      
      const response = await courseAPI.generateLesson({
        lesson_title: lesson.title,
        lesson_description: lesson.description,
        programming_language: course.language,
        difficulty: course.difficulty
      });
      
      if (response.success && response.content) {
        // Update the lesson with generated content
        const updatedLesson = { ...lesson, content: response.content };
        setLesson(updatedLesson);
        
        // Update the course's lessons array
        if (course) {
          const updatedCourse = {
            ...course,
            lessons: course.lessons?.map(l => 
              l.id === lessonId ? updatedLesson : l
            ) || []
          };
          setCourse(updatedCourse);
          
          // Save the updated course to the backend
          await courseAPI.update(courseId, updatedCourse);
        }
      } else {
        setError('Failed to generate lesson content');
      }
    } catch (err) {
      console.error('Error generating lesson content:', err);
      setError('Failed to generate lesson content');
    } finally {
      setGenerating(false);
    }
  };

  const markLessonAsCompleted = async () => {
    if (!lesson || !course) return;
    
    try {
      const updatedLesson = { ...lesson, completed: true };
      setLesson(updatedLesson);
      
      // Update the course's lessons array
      const updatedCourse = {
        ...course,
        lessons: course.lessons?.map(l => 
          l.id === lessonId ? updatedLesson : l
        ) || []
      };
      setCourse(updatedCourse);
      
      // Save the updated course to the backend
      await courseAPI.update(courseId, updatedCourse);
    } catch (err) {
      console.error('Error marking lesson as completed:', err);
      setError('Failed to mark lesson as completed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !course || !lesson) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">Lesson Not Found</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => navigate(`/course/${courseId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/course/${courseId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
          <p className="text-muted-foreground">{lesson.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {course.language}
          </Badge>
          {lesson.completed ? (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          ) : (
            <Badge variant="outline">
              <Circle className="w-3 h-3 mr-1" />
              In Progress
            </Badge>
          )}
        </div>
      </div>

      {/* Course Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {course.title}
          </CardTitle>
          <CardDescription>{course.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Difficulty:</span>
              <Badge variant="outline">{course.difficulty}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">XP Reward:</span>
              <span className="text-yellow-600 font-medium">{lesson.xpReward} XP</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Content */}
      <div className="space-y-4">
        {!lesson.content ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Generate Lesson Content
              </CardTitle>
              <CardDescription>
                Click the button below to generate comprehensive lesson content using AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGenerateContent} 
                disabled={generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Lesson Content
                  </>
                )}
              </Button>
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lesson Content</CardTitle>
                <div className="flex items-center gap-2">
                  {!lesson.completed && (
                    <Button 
                      onClick={markLessonAsCompleted}
                      variant="outline"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Completed
                    </Button>
                  )}
                  <Button 
                    onClick={handleGenerateContent} 
                    disabled={generating}
                    variant="outline"
                    size="sm"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{lesson.content}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/course/${courseId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Lesson {lesson.order} of {course.lessons?.length || 0}
          </span>
        </div>
      </div>
    </div>
  );
}