import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from services.ai_service import ask_gemma

class CourseService:
    def __init__(self):
        self.data_file = "data/courses.json"
        self._ensure_data_file()
    
    def _ensure_data_file(self):
        """Ensure the courses data file exists"""
        if not os.path.exists(self.data_file):
            with open(self.data_file, 'w') as f:
                json.dump([], f)
    
    def _load_courses(self) -> List[Dict[str, Any]]:
        """Load courses from JSON file"""
        try:
            with open(self.data_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _save_courses(self, courses: List[Dict[str, Any]]):
        """Save courses to JSON file"""
        with open(self.data_file, 'w') as f:
            json.dump(courses, f, indent=2, default=str)
    
    def get_all_courses(self) -> List[Dict[str, Any]]:
        """Get all courses"""
        return self._load_courses()
    
    def get_course_by_id(self, course_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific course by ID"""
        courses = self._load_courses()
        for course in courses:
            if course.get('id') == course_id:
                return course
        return None
    
    def create_course(self, course_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new course with AI-generated lesson content"""
        courses = self._load_courses()
        
        # Generate unique ID
        course_id = str(len(courses) + 1)
        
        # Create course structure
        course = {
            'id': course_id,
            'title': course_data['title'],
            'description': course_data['description'],
            'difficulty': course_data['difficulty'],
            'progress': 0,
            'totalXP': 0,
            'dailyStreak': 0,
            'topics': course_data['topics'],
            'estimatedHours': course_data['estimatedHours'],
            'completed': False,
            'thumbnail': course_data.get('thumbnail'),
            'lessons': [],
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        # Create lessons without AI content initially
        lessons = []
        for i, lesson_data in enumerate(course_data['lessons']):
            lesson_id = f"{course_id}_lesson_{i + 1}"
            
            lesson = {
                'id': lesson_id,
                'title': lesson_data['title'],
                'description': lesson_data['description'],
                'content': '',  # Will be generated on-demand
                'order': lesson_data['order'],
                'completed': False,
                'progress': 0,  # Initialize progress to 0
                'xpReward': lesson_data['xpReward'],
                'createdAt': datetime.now().isoformat(),
                'updatedAt': datetime.now().isoformat()
            }
            lessons.append(lesson)
        
        course['lessons'] = lessons
        course['totalXP'] = sum(lesson['xpReward'] for lesson in lessons)
        
        courses.append(course)
        self._save_courses(courses)
        
        return course
    
    def update_course(self, course_id: str, course_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing course"""
        courses = self._load_courses()
        
        for i, course in enumerate(courses):
            if course.get('id') == course_id:
                # Update fields
                for key, value in course_data.items():
                    if key != 'id':  # Don't allow ID changes
                        course[key] = value
                
                # Recalculate course progress based on lesson progress
                if course.get('lessons'):
                    total_progress = sum(l.get('progress', 0) for l in course['lessons'])
                    total_lessons = len(course['lessons'])
                    course['progress'] = int(total_progress / total_lessons) if total_lessons > 0 else 0
                    course['completed'] = course['progress'] == 100
                
                course['updatedAt'] = datetime.now().isoformat()
                courses[i] = course
                self._save_courses(courses)
                return course
        
        return None
    
    def delete_course(self, course_id: str) -> bool:
        """Delete a course"""
        courses = self._load_courses()
        
        for i, course in enumerate(courses):
            if course.get('id') == course_id:
                del courses[i]
                self._save_courses(courses)
                return True
        
        return False
    
    def update_lesson_progress(self, course_id: str, lesson_id: str, progress: int, completed: Optional[bool] = None) -> Optional[Dict[str, Any]]:
        """Update lesson progress and completion status"""
        course = self.get_course_by_id(course_id)
        if not course:
            return None
        
        for lesson in course['lessons']:
            if lesson['id'] == lesson_id:
                # Update progress (0-100)
                lesson['progress'] = max(0, min(100, progress))
                lesson['updatedAt'] = datetime.now().isoformat()
                
                # Update completion status if provided
                if completed is not None:
                    lesson['completed'] = completed
                
                # Update course progress based on average of all lesson progress
                total_progress = sum(l.get('progress', 0) for l in course['lessons'])
                total_lessons = len(course['lessons'])
                course['progress'] = int(total_progress / total_lessons) if total_lessons > 0 else 0
                course['completed'] = course['progress'] == 100
                course['updatedAt'] = datetime.now().isoformat()
                
                self.update_course(course_id, course)
                return course
        
        return None
    
    def generate_lesson_content(self, course_id: str, lesson_id: str) -> Optional[Dict[str, Any]]:
        """Generate lesson content using AI (on-demand)"""
        course = self.get_course_by_id(course_id)
        if not course:
            return None
        
        for lesson in course['lessons']:
            if lesson['id'] == lesson_id:
                                # Generate content if it doesn't exist
                if not lesson.get('content'):
                    ai_prompt = f"""
                    Create comprehensive lesson content for any course.
                    
                    Course: {course['title']}
                    Subject Area: {course.get('topics', ['General'])}
                    Difficulty: {course['difficulty']}
                    
                    Lesson: {lesson['title']}
                    Description: {lesson['description']}
                    
                    IMPORTANT: Adapt the content to the subject matter. If this is a programming course, include code examples. 
                    If this is an art course, focus on techniques, examples, and visual descriptions. 
                    If this is a math course, include formulas, calculations, and step-by-step solutions.
                    If this is a science course, include explanations, experiments, and scientific concepts.
                    
                    Please provide:
                    1. Detailed lesson content with explanations appropriate to the subject
                    2. Relevant examples (code, art techniques, math problems, scientific concepts, etc.)
                    3. Practice exercises or activities
                    4. Key takeaways
                    
                    Format the response in a structured way that's easy to follow.
                    Use appropriate terminology and examples for the subject matter.
                    """
                    
                    try:
                        # Collect AI response
                        ai_response = ""
                        for chunk in ask_gemma(ai_prompt):
                            ai_response += chunk
                        lesson['content'] = ai_response
                        lesson['updatedAt'] = datetime.now().isoformat()
                        
                        self.update_course(course_id, course)
                        return course
                    except Exception as e:
                        return None
                else:
                    return course
        
        return None

    def regenerate_lesson_content(self, course_id: str, lesson_id: str) -> Optional[Dict[str, Any]]:
        """Regenerate lesson content using AI"""
        course = self.get_course_by_id(course_id)
        if not course:
            return None
        
        for lesson in course['lessons']:
            if lesson['id'] == lesson_id:
                # Generate new content
                ai_prompt = f"""
                Create comprehensive lesson content for a programming course.
                
                Course: {course['title']}
                Language: {course.get('language', 'python')}
                Difficulty: {course['difficulty']}
                
                Lesson: {lesson['title']}
                Description: {lesson['description']}
                
                Please provide:
                1. Detailed lesson content with explanations
                2. Code examples
                3. Practice exercises
                4. Key takeaways
                
                Format the response in a structured way that's easy to follow.
                """
                
                try:
                    # Collect AI response
                    ai_response = ""
                    for chunk in ask_gemma(ai_prompt):
                        ai_response += chunk
                    lesson['content'] = ai_response
                    lesson['updatedAt'] = datetime.now().isoformat()
                    
                    self.update_course(course_id, course)
                    return course
                except Exception as e:
                    return None
        
        return None 