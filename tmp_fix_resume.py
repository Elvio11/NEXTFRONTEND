import asyncio
import os
import gzip
import json
from dotenv import load_dotenv
load_dotenv()
from skills.storage_client import put

async def main():
    user_id = "11111111-1111-1111-1111-111111111111"
    resume = {
        "user_id": user_id,
        "name": "Arjun Kumar",
        "email": "arjun.kumar@example.com",
        "phone": "+91 98765 43210",
        "summary": "Full Stack Developer with 4 years of experience in Python, React, and AWS. Passionate about building scalable cloud applications.",
        "skills": ["Python", "JavaScript", "React", "Node.js", "PostgreSQL", "AWS", "Docker", "Git"],
        "top_5_skills": ["Python", "React", "Node.js", "PostgreSQL", "AWS"],
        "experience_years": 4,
        "current_title": "Senior Software Engineer",
        "work_experience": [
            {
                "title": "Senior Software Engineer",
                "company": "Tech Solutions Pvt Ltd",
                "dates": "Jan 2021 - Present",
                "bullets": [
                    "Led the development of a microservices-based application using FastAPI and Docker.",
                    "Improved API performance by 40% through redis caching and query optimization.",
                    "Mentored junior developers and conducted code reviews."
                ]
            },
            {
                "title": "Software Engineer",
                "company": "Innovate Software",
                "dates": "June 2019 - Dec 2020",
                "bullets": [
                    "Developed responsive web interfaces using React and Redux.",
                    "Built RESTful APIs using Express.js and MongoDB.",
                    "Implemented CI/CD pipelines using GitLab CI."
                ]
            }
        ],
        "education": [
            {
                "degree": "B.Tech in Computer Science",
                "institution": "IIT Bombay",
                "year": "2019"
            }
        ],
        "certifications": ["AWS Certified Solutions Architect", "TensorFlow Developer Certificate"]
    }
    
    key = f"parsed-resumes/{user_id}.json.gz"
    data = gzip.compress(json.dumps(resume).encode("utf-8"))
    await put(key, data)
    print(f"Uploaded dummy resume for {user_id} to {key}")

if __name__ == "__main__":
    asyncio.run(main())
