import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Trophy, Zap, Calendar, Star, MoreVertical, Trash2, Loader2 } from 'lucide-react';
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
import { useLanguage } from '@/hooks/useLanguage';
import { Course } from '@/lib/types';
import { courseAPI } from '@/lib/api';
import CreateCourseModal from '@/components/CreateCourseModal';

export default function Courses() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseAPI.getAll();
      if (response && typeof response === 'object' && 'courses' in response && Array.isArray(response.courses)) {
        // Calculate progress for each course
        const coursesWithProgress = response.courses.map((course: any) => {
          if (course.lessons && course.lessons.length > 0) {
            const totalProgress = course.lessons.reduce((sum: number, lesson: any) => sum + (lesson.progress || 0), 0);
            const averageProgress = Math.round(totalProgress / course.lessons.length);
            return {
              ...course,
              progress: averageProgress
            };
          }
          return course;
        });
        setCourses(coursesWithProgress);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const getDifficultyColor = (difficulty: Course['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/10 text-green-600 hover:bg-green-500/20';
      case 'intermediate':
        return 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20';
      case 'advanced':
        return 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20';
    }
  };

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setShowDeleteDialog(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    try {
      setDeletingCourseId(courseToDelete.id);
      await courseAPI.delete(courseToDelete.id);
      
      // Update local state immediately
      setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
      
      toast({
        title: "Course removed successfully",
        description: `"${courseToDelete.title}" has been removed from your learning path. You can always add it back later!`,
      });
      
    } catch (err) {
      console.error('Error deleting course:', err);
      toast({
        title: "Failed to remove course",
        description: "There was an error removing the course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingCourseId(null);
      setShowDeleteDialog(false);
      setCourseToDelete(null);
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
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            Enhance your programming skills with structured learning paths
          </p>
        </div>
        
        <Button 
          className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          Add Course
        </Button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card 
            key={course.id} 
            className="group hover:shadow-lg transition-all duration-300 hover:scale-105 hover-scale border-muted/50 bg-card/50 backdrop-blur"
          >
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <Badge variant="secondary" className={getDifficultyColor(course.difficulty)}>
                    {course.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {course.completed && (
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course);
                        }}
                        disabled={deletingCourseId === course.id}
                      >
                        {deletingCourseId === course.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove Course
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                  {course.language && (
                    <Badge variant="secondary" className="text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200">
                      {course.language}
                    </Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {course.description}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progress</span>
                  <span className="text-muted-foreground">{course.progress}%</span>
                </div>
                <div className="relative">
                  <Progress value={course.progress} className="h-2" />
                  <div 
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${getProgressColor(course.progress)}`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{course.totalXP} XP</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{course.dailyStreak} day streak</span>
                </div>
              </div>

              {/* Course Stats */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{course.lessons?.length || 0} lessons</span>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span>{course.totalXP} XP</span>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 transition-all duration-300"
                variant={course.completed ? "outline" : "default"}
                onClick={() => navigate(`/course/${course.id}`)}
              >
                {course.completed ? "Review Course" : "Continue Learning"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State for new users */}
      {courses.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto" />
          <h3 className="text-xl font-semibold">No courses yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start your learning journey by adding your first course. Choose from our curated 
            selection or create a custom learning path.
          </p>
          <Button 
            className="gap-2 bg-gradient-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Create Course
          </Button>
        </div>
      )}

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCourseCreated={() => {
          setShowCreateModal(false);
          // Reload courses by calling the loadCourses function
          loadCourses();
        }}
      />

      {/* Delete Course Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gradient-card border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Remove this course from your learning path?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-3">
              <p>
                You're about to remove <span className="font-semibold text-foreground">"{courseToDelete?.title}"</span> from your courses.
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
              disabled={deletingCourseId === courseToDelete?.id}
            >
              Keep Course
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90 transition-colors duration-200"
              onClick={confirmDeleteCourse}
              disabled={deletingCourseId === courseToDelete?.id}
            >
              {deletingCourseId === courseToDelete?.id ? (
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