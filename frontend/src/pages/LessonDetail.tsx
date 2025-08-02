import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Wand2, Loader2, CheckCircle, Circle, BarChart3 } from 'lucide-react';
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
  const [lessonProgress, setLessonProgress] = useState(0);

  useEffect(() => {
    const loadCourseAndLesson = async () => {
      if (!courseId || !lessonId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Load course
        const courseResponse = await courseAPI.getById(courseId);
        if (courseResponse && typeof courseResponse === 'object' && 'id' in courseResponse) {
          setCourse(courseResponse as Course);
          
          // Find the specific lesson
          const foundLesson = (courseResponse as Course).lessons?.find(l => l.id === lessonId);
          if (foundLesson) {
            setLesson(foundLesson);
            // Set initial progress from lesson data
            setLessonProgress(foundLesson.progress || 0);
            console.log('Lesson loaded:', foundLesson.title, 'Content length:', foundLesson.content?.length || 0);
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
    if (!lesson || !course || !courseId || !lessonId) return;
    
    try {
      setGenerating(true);
      setError(null);
      
      // Use the new on-demand content generation endpoint
      const response = await courseAPI.generateLessonContent(courseId, lessonId);
      
      if (response && typeof response === 'object' && 'success' in response && response.success && 'content' in response) {
        // The backend has already saved the content, so we need to refresh the course data
        const refreshedCourse = await courseAPI.getById(courseId);
        if (refreshedCourse && typeof refreshedCourse === 'object' && 'id' in refreshedCourse) {
          setCourse(refreshedCourse as Course);
          
          // Find the updated lesson with the new content
          const updatedLesson = (refreshedCourse as Course).lessons?.find(l => l.id === lessonId);
          if (updatedLesson) {
            setLesson(updatedLesson);
          }
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

  const updateLessonProgress = async (progress: number) => {
    if (!lesson || !course || !courseId || !lessonId) return;
    
    try {
      const updatedLesson = { ...lesson, progress };
      setLesson(updatedLesson);
      setLessonProgress(progress);
      
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
      console.error('Error updating lesson progress:', err);
      setError('Failed to update lesson progress');
    }
  };

  const markLessonAsCompleted = async () => {
    await updateLessonProgress(100);
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (progress >= 75) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (progress >= 50) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-gray-400 to-gray-500';
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
          {course.language && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {course.language}
            </Badge>
          )}
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

      {/* Progress Checkpoints */}
      {lesson.content && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Lesson Progress
            </CardTitle>
            <CardDescription>
              Mark your progress as you work through this lesson
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Current Progress</span>
                <span className="text-muted-foreground">{lessonProgress}%</span>
              </div>
              <Progress value={lessonProgress} className="h-2" />
              <div 
                className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${getProgressColor(lessonProgress)}`}
                style={{ width: `${lessonProgress}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateLessonProgress(25)}
                disabled={lessonProgress >= 25}
                className="justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                25% Done
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateLessonProgress(50)}
                disabled={lessonProgress >= 50}
                className="justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                50% Done
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateLessonProgress(75)}
                disabled={lessonProgress >= 75}
                className="justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                75% Done
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateLessonProgress(100)}
                disabled={lessonProgress >= 100}
                className="justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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