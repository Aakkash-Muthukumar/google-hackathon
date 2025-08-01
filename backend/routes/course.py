from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import json
import os
import datetime
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

class Course(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    difficulty: str
    language: str
    topics: List[str]
    estimatedHours: int
    lessons: List[Lesson]
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
    """Create a new course"""
    try:
        courses = load_courses()
        
        # Generate ID (simple implementation)
        import uuid
        course.id = str(uuid.uuid4())
        course.createdAt = course.updatedAt = str(datetime.datetime.now())
        
        courses.append(course.dict())
        save_courses(courses)
        
        return course
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