import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, Circle, Zap, Play, Wand2, Loader2, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Course, Lesson } from '@/lib/types';
import { courseAPI } from '@/lib/api';

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingLessons, setGeneratingLessons] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(false);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await courseAPI.getById(courseId);
        if (response && typeof response === 'object' && 'id' in response) {
          setCourse(response as Course);
          
          // Calculate overall course progress
          const courseData = response as Course;
          if (courseData.lessons && courseData.lessons.length > 0) {
            const totalProgress = courseData.lessons.reduce((sum, lesson) => sum + (lesson.progress || 0), 0);
            const averageProgress = Math.round(totalProgress / courseData.lessons.length);
            
            // Update course with calculated progress
            const updatedCourse = {
              ...courseData,
              progress: averageProgress
            };
            setCourse(updatedCourse);
          }
        } else {
          setError('Course not found');
        }
      } catch (err) {
        console.error('Error loading course:', err);
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  // Refresh course data when returning from lesson
  useEffect(() => {
    const handleFocus = () => {
      if (courseId) {
        const refreshCourse = async () => {
          try {
            const response = await courseAPI.getById(courseId);
            if (response && typeof response === 'object' && 'id' in response) {
              const courseData = response as Course;
              if (courseData.lessons && courseData.lessons.length > 0) {
                const totalProgress = courseData.lessons.reduce((sum, lesson) => sum + (lesson.progress || 0), 0);
                const averageProgress = Math.round(totalProgress / courseData.lessons.length);
                
                const updatedCourse = {
                  ...courseData,
                  progress: averageProgress
                };
                setCourse(updatedCourse);
              }
            }
          } catch (err) {
            console.error('Error refreshing course:', err);
          }
        };
        refreshCourse();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [courseId]);

  const handleLessonClick = (lesson: Lesson) => {
    navigate(`/course/${courseId}/lesson/${lesson.id}`);
  };

  const handleGenerateLessonContent = async (lesson: Lesson) => {
    if (!course || !courseId) return;
    
    try {
      setGeneratingLessons(prev => new Set(prev).add(lesson.id));
      
      // Use the new on-demand content generation endpoint
      const response = await courseAPI.generateLessonContent(courseId, lesson.id);
      
      if (response.success && response.content) {
        // Update the lesson with generated content
        const updatedLesson = { ...lesson, content: response.content };
        
        // Update the course's lessons array
        const updatedCourse = {
          ...course,
          lessons: course.lessons?.map(l => 
            l.id === lesson.id ? updatedLesson : l
          ) || []
        };
        setCourse(updatedCourse);
      }
    } catch (err) {
      console.error('Error generating lesson content:', err);
      setError('Failed to generate lesson content');
    } finally {
      setGeneratingLessons(prev => {
        const newSet = new Set(prev);
        newSet.delete(lesson.id);
        return newSet;
      });
    }
  };

  const handleDeleteCourse = async () => {
    if (!course || !courseId) return;
    
    try {
      setDeletingCourse(true);
      await courseAPI.delete(courseId);
      
      toast({
        title: "Course removed successfully",
        description: `"${course.title}" has been removed from your learning path. You can always add it back later!`,
      });
      
      // Navigate back to courses list
      navigate('/courses');
      
    } catch (err) {
      console.error('Error deleting course:', err);
      toast({
        title: "Failed to remove course",
        description: "There was an error removing the course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingCourse(false);
      setShowDeleteDialog(false);
    }
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">Course Not Found</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => navigate('/courses')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {course.language && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
              {course.language}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => setShowDeleteDialog(true)}
                disabled={deletingCourse}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Course Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Course Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{course.progress}%</span>
          </div>
          <Progress value={course.progress} className="h-2" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>{course.totalXP} XP earned</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span>{course.lessons?.length || 0} lessons</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lessons */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Lessons</h2>
        <div className="grid gap-4">
          {course.lessons?.map((lesson, index) => (
            <Card 
              key={lesson.id} 
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleLessonClick(lesson)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      {lesson.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="text-muted-foreground">{lesson.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="outline">Lesson {lesson.order}</Badge>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span>{lesson.xpReward} XP</span>
                      </div>
                      {lesson.progress > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${getProgressColor(lesson.progress || 0)}`}
                              style={{ width: `${lesson.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{lesson.progress || 0}%</span>
                        </div>
                      )}
                      {lesson.completed && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!lesson.content && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateLessonContent(lesson);
                        }}
                        disabled={generatingLessons.has(lesson.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {generatingLessons.has(lesson.id) ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            Generate
                          </>
                        )}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {(!course.lessons || course.lessons.length === 0) && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Lessons Yet</h3>
          <p className="text-muted-foreground">
            This course doesn't have any lessons yet. Check back later!
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Delete Course Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gradient-card border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Remove this course from your learning path?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-3">
              <p>
                You're about to remove <span className="font-semibold text-foreground">"{course?.title}"</span> from your courses.
              </p>
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-warning-foreground">⚠️ This action will:</p>
                <ul className="text-sm space-y-1 ml-4 list-disc text-warning-foreground">
                  <li>Remove all course progress and data</li>
                  <li>Delete all lesson completions</li>
                  <li>Remove earned XP from this course</li>
                </ul>
              </div>
              <p className="text-sm">
                Don't worry though - you can always add the course back later and start fresh! 
                Your overall learning progress in other courses won't be affected.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              className="hover:bg-muted transition-colors duration-200"
              disabled={deletingCourse}
            >
              Keep Course
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90 transition-colors duration-200"
              onClick={handleDeleteCourse}
              disabled={deletingCourse}
            >
              {deletingCourse ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Course'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}