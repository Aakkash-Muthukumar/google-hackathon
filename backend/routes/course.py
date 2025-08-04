from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import json
import os
import datetime
import uuid
from services.ai_service import generate_lesson_content

router = APIRouter(prefix="/course", tags=["courses"])

# Data models
class Lesson(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    order: int
    xpReward: int
    content: Optional[str] = None
    completed: Optional[bool] = False
    progress: Optional[int] = 0
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class Course(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    difficulty: str
    language: Optional[str] = None
    topics: List[str]
    estimatedHours: int
    lessons: List[Lesson]
    progress: Optional[int] = 0
    totalXP: Optional[int] = 0
    dailyStreak: Optional[int] = 0
    completed: Optional[bool] = False
    thumbnail: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

# Data file path
COURSES_FILE = "data/courses.json"

def load_courses():
    """Load courses from JSON file"""
    if os.path.exists(COURSES_FILE):
        with open(COURSES_FILE, 'r') as f:
            return json.load(f)
    return []

def save_courses(courses):
    """Save courses to JSON file"""
    os.makedirs(os.path.dirname(COURSES_FILE), exist_ok=True)
    with open(COURSES_FILE, 'w') as f:
        json.dump(courses, f, indent=2)

@router.get("/")
async def get_all_courses():
    """Get all courses"""
    try:
        courses = load_courses()
        return {"courses": courses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load courses: {str(e)}")

@router.get("/{course_id}")
async def get_course(course_id: str):
    """Get a specific course by ID"""
    try:
        courses = load_courses()
        course = next((c for c in courses if c.get("id") == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        return course
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load course: {str(e)}")

@router.post("/")
async def create_course(course: Course):
    """Create a new course with lessons (without AI content initially)"""
    try:
        courses = load_courses()
        
        # Generate course ID
        course.id = str(uuid.uuid4())
        current_time = datetime.datetime.now().isoformat()
        course.createdAt = current_time
        course.updatedAt = current_time
        
        # Set default values
        course.progress = 0
        course.completed = False
        course.dailyStreak = 0
        
        # Process lessons
        total_xp = 0
        for i, lesson in enumerate(course.lessons):
            # Generate lesson ID
            lesson.id = f"{course.id}_lesson_{i + 1}"
            lesson.completed = False
            lesson.content = ""  # Empty content initially, will be generated on-demand
            lesson.createdAt = current_time
            lesson.updatedAt = current_time
            total_xp += lesson.xpReward
        
        course.totalXP = total_xp
        
        # Convert to dict for storage
        course_dict = course.dict()
        courses.append(course_dict)
        save_courses(courses)
        
        return course_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create course: {str(e)}")

@router.put("/{course_id}")
async def update_course(course_id: str, course: Course):
    """Update an existing course"""
    try:
        courses = load_courses()
        course_index = next((i for i, c in enumerate(courses) if c.get("id") == course_id), None)
        
        if course_index is None:
            raise HTTPException(status_code=404, detail="Course not found")
        
        course.id = course_id
        course.updatedAt = str(datetime.datetime.now())
        courses[course_index] = course.dict()
        save_courses(courses)
        
        return course
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update course: {str(e)}")

@router.delete("/{course_id}")
async def delete_course(course_id: str):
    """Delete a course"""
    try:
        courses = load_courses()
        course_index = next((i for i, c in enumerate(courses) if c.get("id") == course_id), None)
        
        if course_index is None:
            raise HTTPException(status_code=404, detail="Course not found")
        
        deleted_course = courses.pop(course_index)
        save_courses(courses)
        
        return {"message": "Course deleted successfully", "course": deleted_course}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete course: {str(e)}")

# Request model for lesson generation
class GenerateLessonRequest(BaseModel):
    lesson_title: str
    lesson_description: str
    programming_language: str
    difficulty: str = "beginner"

@router.post("/generate-lesson")
async def generate_lesson(request: GenerateLessonRequest):
    """Generate lesson content using AI"""
    try:
        content = generate_lesson_content(
            lesson_title=request.lesson_title,
            lesson_description=request.lesson_description,
            programming_language=request.programming_language,
            difficulty=request.difficulty
        )
        
        return {
            "success": True,
            "content": content,
            "lesson_title": request.lesson_title,
            "lesson_description": request.lesson_description
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate lesson: {str(e)}")

@router.post("/{course_id}/lessons/{lesson_id}/generate-content")
async def generate_lesson_content_for_course(course_id: str, lesson_id: str):
    """Generate content for a specific lesson in a course"""
    try:
        courses = load_courses()
        course = next((c for c in courses if c.get("id") == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        lesson = next((l for l in course.get("lessons", []) if l.get("id") == lesson_id), None)
        
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        # Generate content using AI
        content = generate_lesson_content(
            lesson_title=lesson["title"],
            lesson_description=lesson["description"],
            programming_language=course.get("language", "python"),  # Default to python if no language specified
            difficulty=course["difficulty"]
        )
        
        # Update lesson with generated content
        lesson["content"] = content
        lesson["updatedAt"] = datetime.datetime.now().isoformat()
        
        # Save updated course
        save_courses(courses)
        
        return {
            "success": True,
            "content": content,
            "lesson": lesson
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate lesson content: {str(e)}")

@router.delete("/{course_id}/lessons/{lesson_id}")
async def delete_lesson(course_id: str, lesson_id: str):
    """Delete a specific lesson from a course"""
    try:
        courses = load_courses()
        course = next((c for c in courses if c.get("id") == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        lessons = course.get("lessons", [])
        lesson_index = next((i for i, l in enumerate(lessons) if l.get("id") == lesson_id), None)
        
        if lesson_index is None:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        # Remove the lesson
        deleted_lesson = lessons.pop(lesson_index)
        
        # Recalculate total XP
        course["totalXP"] = sum(lesson.get("xpReward", 0) for lesson in lessons)
        
        # Update course
        course["updatedAt"] = datetime.datetime.now().isoformat()
        
        # Save updated courses
        save_courses(courses)
        
        return {
            "message": "Lesson deleted successfully",
            "lesson": deleted_lesson,
            "course": course
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete lesson: {str(e)}")