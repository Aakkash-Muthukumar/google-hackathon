import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateCourseRequest, CreateLessonRequest } from '@/lib/types';
import { courseAPI } from '@/lib/api';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: () => void;
}

export default function CreateCourseModal({ isOpen, onClose, onCourseCreated }: CreateCourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState<Partial<CreateCourseRequest>>({
    title: '',
    description: '',
    difficulty: 'beginner',
    topics: [],
    estimatedHours: 10,
    lessons: []
  });
  const [newTopic, setNewTopic] = useState('');
  const [newLesson, setNewLesson] = useState<Partial<CreateLessonRequest>>({
    title: '',
    description: '',
    order: 1,
    xpReward: 100
  });

  const difficulties = ['beginner', 'intermediate', 'advanced'];

  const addTopic = () => {
    if (newTopic.trim() && !courseData.topics?.includes(newTopic.trim())) {
      setCourseData(prev => ({
        ...prev,
        topics: [...(prev.topics || []), newTopic.trim()]
      }));
      setNewTopic('');
    }
  };

  const removeTopic = (topic: string) => {
    setCourseData(prev => ({
      ...prev,
      topics: prev.topics?.filter(t => t !== topic) || []
    }));
  };

  const addLesson = () => {
    if (newLesson.title) {
      const lesson: CreateLessonRequest = {
        title: newLesson.title,
        description: newLesson.description || '',
        order: (courseData.lessons?.length || 0) + 1,
        xpReward: 100
      };
      
      setCourseData(prev => ({
        ...prev,
        lessons: [...(prev.lessons || []), lesson]
      }));
      
      setNewLesson({
        title: '',
        description: '',
        order: (courseData.lessons?.length || 0) + 2,
        xpReward: 100
      });
    }
  };

  const removeLesson = (index: number) => {
    setCourseData(prev => ({
      ...prev,
      lessons: prev.lessons?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields - only title is required now
    if (!courseData.title?.trim()) {
      console.error('Course title is required');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare course data with proper structure
      const courseToCreate = {
        title: courseData.title.trim(),
        description: courseData.description?.trim() || `A comprehensive course on ${courseData.title.trim()}`,
        difficulty: courseData.difficulty || 'beginner',
        topics: courseData.topics || [],
        estimatedHours: courseData.estimatedHours || 10,
        lessons: courseData.lessons?.length > 0 ? courseData.lessons.map((lesson, index) => ({
          title: lesson.title.trim(),
          description: lesson.description?.trim() || '',
          order: lesson.order || index + 1,
          xpReward: lesson.xpReward || 100
        })) : [
          // Default lesson structure if no lessons provided
          {
            title: `Introduction to ${courseData.title.trim()}`,
            description: `Get started with the basics of ${courseData.title.trim()}`,
            order: 1,
            xpReward: 100
          },
          {
            title: `${courseData.title.trim()} Fundamentals`,
            description: `Learn the core concepts and principles`,
            order: 2,
            xpReward: 150
          },
          {
            title: `Advanced ${courseData.title.trim()}`,
            description: `Master advanced techniques and best practices`,
            order: 3,
            xpReward: 200
          }
        ]
      };

      console.log('Creating course with data:', courseToCreate);
      
      const result = await courseAPI.create(courseToCreate);
      console.log('Course created successfully:', result);
      
      onCourseCreated();
      onClose();
      
      // Reset form
      setCourseData({
        title: '',
        description: '',
        difficulty: 'beginner',
        topics: [],
        estimatedHours: 10,
        lessons: []
      });
    } catch (error) {
      console.error('Error creating course:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Create New Course</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Basic Course Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Course Title</label>
              <Input
                value={courseData.title}
                onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter course title"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select
                value={courseData.difficulty}
                onValueChange={(value) => setCourseData(prev => ({ ...prev, difficulty: value as "beginner" | "intermediate" | "advanced" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(diff => (
                    <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              value={courseData.description}
              onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your course (leave empty to auto-generate)"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              If left empty, a description will be generated based on the course title
            </p>
          </div>

          {/* Lessons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Lessons (Optional)</label>
                <p className="text-xs text-muted-foreground">
                  Add custom lessons or leave empty to auto-generate based on the course title
                </p>
              </div>
              <Button onClick={addLesson} size="sm" disabled={!newLesson.title}>
                <Plus className="w-4 h-4 mr-1" />
                Add Lesson
              </Button>
            </div>

            {/* Add Lesson Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Lesson</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lesson Title</label>
                  <Input
                    value={newLesson.title}
                    onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter lesson title"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea
                    value={newLesson.description}
                    onChange={(e) => setNewLesson(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this lesson"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Existing Lessons */}
            <div className="space-y-2">
              {courseData.lessons?.map((lesson, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{lesson.title}</h4>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground">{lesson.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">Lesson {lesson.order}</Badge>
                          <Badge variant="outline">{lesson.xpReward} XP</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLesson(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !courseData.title?.trim()}
          >
            {loading ? 'Creating...' : 'Create Course'}
          </Button>
        </div>
      </div>
    </div>
  );
} 