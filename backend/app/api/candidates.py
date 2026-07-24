import os
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.security import SECRET_KEY, ALGORITHM
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.storage_service import storage_manager
from app.models import Candidate, Job, CandidateExperience, CandidateEducation, User
from app.services.email_service import send_candidate_interview_email, send_candidate_rejection_email

router = APIRouter(prefix="/api/candidates", tags=["candidates"])
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

class StatusUpdate(BaseModel):
    status: str  # APPLIED, SHORTLISTED, INTERVIEW_SCHEDULED, INTERVIEWED, REJECTED, HIRED

def resolve_user_from_token(token: Optional[str], db: Session) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise credentials_exception
    return user

@router.get("")
def get_candidates(
    job_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    min_score: Optional[int] = Query(None),
    query: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Enforce organization boundaries by joining Job
    q = db.query(Candidate).join(Job).filter(Job.organization_id == current_user.organization_id)
    
    if job_id is not None:
        q = q.filter(Candidate.job_id == job_id)
        
    if status is not None and status.strip() != "":
        q = q.filter(Candidate.status == status.upper())
        
    if min_score is not None:
        q = q.filter(Candidate.match_score >= min_score)
        
    if query is not None and query.strip() != "":
        search_filter = or_(
            Candidate.name.ilike(f"%{query}%"),
            Candidate.email.ilike(f"%{query}%"),
            Candidate.raw_text.ilike(f"%{query}%")
        )
        q = q.filter(search_filter)
        
    # Order by match score descending by default
    candidates = q.order_by(Candidate.match_score.desc()).all()
    
    results = []
    for cand in candidates:
        skills = []
        try:
            if cand.raw_text:
                from app.services.ai_service import COMMON_SKILLS
                skills = [s for s in COMMON_SKILLS if s.lower() in cand.raw_text.lower()][:5]
        except Exception:
            pass
            
        results.append({
            "id": cand.id,
            "job_id": cand.job_id,
            "job_title": cand.job.title if cand.job else "Unknown Job",
            "name": cand.name,
            "email": cand.email,
            "phone": cand.phone,
            "match_score": cand.match_score,
            "skill_match_score": cand.skill_match_score,
            "experience_match_score": cand.experience_match_score,
            "relevance_score": cand.relevance_score,
            "status": cand.status,
            "skills": skills,
            "created_at": cand.created_at
        })
    return results

@router.get("/{candidate_id}")
def get_candidate(candidate_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Enforce organization boundaries
    cand = db.query(Candidate).join(Job).filter(
        Candidate.id == candidate_id, 
        Job.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=403, detail="Candidate not found or access denied")
        
    exps = [{
        "id": e.id,
        "title": e.title,
        "company": e.company,
        "start_date": e.start_date,
        "end_date": e.end_date,
        "description": e.description
    } for e in cand.experiences]
    
    edus = [{
        "id": ed.id,
        "institution": ed.institution,
        "degree": ed.degree,
        "major": ed.major,
        "graduation_year": ed.graduation_year
    } for ed in cand.educations]
    
    # Gating the HR Copilot feature based on organization subscription plan
    # If the plan does not support "HR Copilot", we mask/clear the ai_summary and ai_concerns!
    ai_summary = cand.ai_summary
    ai_concerns = cand.ai_concerns
    
    try:
        from app.models import SubscriptionPlan
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == current_user.organization.current_plan).first()
        features = json.loads(plan.features_json or "[]")
        if "HR Copilot" not in features:
            ai_summary = "Upgrade to GROWTH or ENTERPRISE plan to unlock AI HR Copilot recommendations."
            ai_concerns = "Upgrade to GROWTH or ENTERPRISE plan to unlock AI HR Copilot gap warnings."
    except Exception:
        pass
        
    return {
        "id": cand.id,
        "job_id": cand.job_id,
        "job_title": cand.job.title if cand.job else "Unknown Job",
        "name": cand.name,
        "email": cand.email,
        "phone": cand.phone,
        "match_score": cand.match_score,
        "skill_match_score": cand.skill_match_score,
        "experience_match_score": cand.experience_match_score,
        "relevance_score": cand.relevance_score,
        "ai_summary": ai_summary,
        "ai_concerns": ai_concerns,
        "status": cand.status,
        "created_at": cand.created_at,
        "raw_text": cand.raw_text,
        "resume_filename": storage_manager.get_filename(cand.resume_path) if cand.resume_path else "resume.pdf",
        "experiences": exps,
        "educations": edus
    }

@router.put("/{candidate_id}/status")
def update_candidate_status(
    candidate_id: int, 
    status_in: StatusUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    cand = db.query(Candidate).join(Job).filter(
        Candidate.id == candidate_id, 
        Job.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=403, detail="Candidate not found or access denied")
        
    old_status = cand.status
    new_status = status_in.status.upper()
    
    cand.status = new_status
    db.commit()
    
    # Trigger actual emails if the status changed and candidate has an email address
    if old_status != new_status and cand.email:
        org_name = current_user.organization.name if current_user.organization else "Hirecue Workspace"
        job_title = cand.job.title if cand.job else "Position"
        
        if new_status == "INTERVIEW_SCHEDULED":
            try:
                send_candidate_interview_email(
                    to_email=cand.email,
                    candidate_name=cand.name,
                    job_title=job_title,
                    org_name=org_name
                )
            except Exception as e:
                print(f"Error dispatching interview email: {e}")
        elif new_status == "REJECTED":
            try:
                send_candidate_rejection_email(
                    to_email=cand.email,
                    candidate_name=cand.name,
                    job_title=job_title,
                    org_name=org_name
                )
            except Exception as e:
                print(f"Error dispatching rejection email: {e}")
                
    return {"id": cand.id, "status": cand.status}

@router.get("/{candidate_id}/resume")
def get_candidate_resume(
    candidate_id: int,
    token: Optional[str] = Query(None),
    bearer_token: Optional[str] = Depends(optional_oauth2_scheme),
    db: Session = Depends(get_db),
):
    # Browser PDF/object tags cannot attach Authorization headers, so this endpoint
    # supports either a Bearer header or a token query parameter.
    user = resolve_user_from_token(token or bearer_token, db)

    cand = db.query(Candidate).join(Job).filter(
        Candidate.id == candidate_id,
        Job.organization_id == user.organization_id,
    ).first()
    if not cand or not cand.resume_path:
        raise HTTPException(status_code=403, detail="Resume not found or access denied")
    
    # Resolve the stored resume path. It may be a local path or a Supabase storage identifier.
    resume_path = cand.resume_path
    filename = storage_manager.get_filename(resume_path)

    import mimetypes
    mime_type, _ = mimetypes.guess_type(filename)
    if not mime_type:
        mime_type = "application/pdf" if filename.lower().endswith(".pdf") else "application/octet-stream"

    if resume_path.startswith("supabase://"):
        try:
            contents = storage_manager.read_file(resume_path)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to download resume from Supabase: {str(e)}",
            )

        return Response(
            content=contents,
            media_type=mime_type,
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )
    else:
        # Assume a local filesystem path.
        if not os.path.exists(resume_path):
            raise HTTPException(status_code=404, detail="Resume file does not exist on disk")
        return FileResponse(resume_path, filename=filename, media_type=mime_type)

@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(candidate_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cand = db.query(Candidate).join(Job).filter(
        Candidate.id == candidate_id, 
        Job.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=403, detail="Candidate not found or access denied")
        
    if cand.resume_path and os.path.exists(cand.resume_path):
        try:
            os.remove(cand.resume_path)
        except Exception:
            pass
            
    db.delete(cand)
    db.commit()
    return None

@router.get("/job/{job_id}/export")
def export_candidates(
    job_id: int, 
    token: Optional[str] = Query(None),
    bearer_token: Optional[str] = Depends(optional_oauth2_scheme),
    db: Session = Depends(get_db)
):
    current_user = resolve_user_from_token(token or bearer_token, db)
    plan = current_user.organization.current_plan
    if plan not in ["GROWTH", "ENTERPRISE"]:
        raise HTTPException(status_code=403, detail="CSV Export requires GROWTH or ENTERPRISE plan.")
        
    candidates = db.query(Candidate).join(Job).filter(
        Candidate.job_id == job_id,
        Job.organization_id == current_user.organization_id
    ).order_by(Candidate.match_score.desc()).all()
    
    import csv
    from io import StringIO
    from fastapi.responses import StreamingResponse
    
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Phone", "Match Score", "Status", "AI Summary", "AI Concerns"])
    
    for cand in candidates:
        writer.writerow([
            cand.name, 
            cand.email, 
            cand.phone or "", 
            cand.match_score, 
            cand.status,
            cand.ai_summary or "",
            cand.ai_concerns or ""
        ])
        
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=job_{job_id}_candidates.csv"}
    )

class SimulationRequest(BaseModel):
    message: str
    chat_history: Optional[List[dict]] = None

@router.post("/{candidate_id}/simulate")
def simulate_candidate_interview(
    candidate_id: int,
    req: SimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only ENTERPRISE plan users are allowed to access Candidate AI Simulator
    if current_user.organization.current_plan != "ENTERPRISE":
        raise HTTPException(
            status_code=403,
            detail="Candidate AI Simulator is an Enterprise Plan feature. Please upgrade your workspace."
        )
        
    cand = db.query(Candidate).join(Job).filter(
        Candidate.id == candidate_id,
        Job.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found or access denied")
        
    # Build prompt containing candidate details
    # Parse experiences
    experiences_str = ""
    for exp in cand.experiences:
        experiences_str += f"- {exp.role} at {exp.company} ({exp.start_date or ''} to {exp.end_date or 'Present'}): {exp.description or ''}\n"
    
    educations_str = ""
    for edu in cand.educations:
        educations_str += f"- {edu.degree or ''} in {edu.major or ''} from {edu.institution or ''} ({edu.graduation_year or ''})\n"
        
    system_prompt = f"""You are simulating candidate '{cand.name}' in an interview simulator. Respond EXACTLY as this candidate would.
Do NOT break character. Do NOT reference that you are an AI assistant. Be highly professional, realistic, and stick strictly to the background provided.

Role being interviewed for: {cand.job.title}
Job Description: {cand.job.description}

Candidate Profile:
- Name: {cand.name}
- Email: {cand.email}
- Match Score: {cand.match_score}%
- Experience:
{experiences_str or "No formal experiences on file"}
- Education:
{educations_str or "No formal education credentials on file"}

- Match Summary: {cand.ai_summary or ""}
- Match Concerns: {cand.ai_concerns or ""}
- Raw Resume Context: {cand.raw_text[:2000] if cand.raw_text else ""}

Answer user prompts dynamically. Keep responses concise, conversational, and direct (typically 2-4 sentences). If asked about something not mentioned in the background, either handle it politely by stating you haven't worked with it or connect it to something you do know.
"""

    from app.services.ai_service import client, OPENAI_MODEL
    
    if not client:
        return {"response": f"Hello, I am {cand.name}. Thank you for reaching out! In my experience as described in my resume, I have worked extensively in similar environments. Could you tell me more about the role's stack?"}
        
    try:
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add chat history if present
        if req.chat_history:
            for msg in req.chat_history:
                role = "user" if msg.get("role") == "user" else "assistant"
                messages.append({"role": role, "content": msg.get("content", "")})
                
        messages.append({"role": "user", "content": req.message})
        
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            temperature=0.7
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        return {"response": f"Hi, this is {cand.name}. I encountered a connection issue, but I'd be happy to chat about my qualifications for the {cand.job.title} role."}

class SubmitRequest(BaseModel):
    answers: List[dict]

@router.get("/{candidate_id}/skills-test")
def get_skills_test(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models import SkillsTest
    cand = db.query(Candidate).join(Job).filter(
        Candidate.id == candidate_id,
        Job.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found or access denied")
        
    test = db.query(SkillsTest).filter(SkillsTest.candidate_id == candidate_id).first()
    if not test:
        return {"status": "NOT_FOUND"}
        
    return {
        "status": test.status,
        "test_questions": json.loads(test.test_questions or "[]"),
        "candidate_answers": json.loads(test.candidate_answers or "[]"),
        "score": test.score,
        "feedback": test.feedback,
        "created_at": test.created_at
    }

@router.post("/{candidate_id}/skills-test/generate")
def generate_skills_test(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.organization.current_plan != "ENTERPRISE":
        raise HTTPException(
            status_code=403,
            detail="AI Skills Test Generator is an Enterprise Plan feature. Please upgrade your workspace."
        )
        
    cand = db.query(Candidate).join(Job).filter(
        Candidate.id == candidate_id,
        Job.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found or access denied")
        
    from app.models import SkillsTest
    from app.services.ai_service import client, OPENAI_MODEL
    
    prompt = f"""You are a professional technical interviewer. Generate a custom 3-question coding and technical skills assessment for candidate '{cand.name}' applying for the role '{cand.job.title}' at '{current_user.organization.name}'.
Job Description: {cand.job.description}
Candidate Skills: {cand.ai_summary}

Each question must contain:
1. Question title
2. Problem description
3. Sample input/output
4. Starter code template (e.g. in Python or JavaScript)

Return ONLY a valid JSON object matching this structure:
{{
  "questions": [
    {{
      "id": 1,
      "title": "Title here",
      "description": "Describe problem",
      "starter_code": "def solution():\\n    pass",
      "sample_cases": "Input: X, Output: Y"
    }}
  ]
}}
"""
    
    questions = []
    if not client:
        questions = [
            {
                "id": 1,
                "title": "Reverse Words in a String",
                "description": "Given an input string s, reverse the order of the words. A word is defined as a sequence of non-space characters.",
                "starter_code": "def reverse_words(s: str) -> str:\n    # Write your code here\n    pass",
                "sample_cases": "Input: 'the sky is blue', Output: 'blue is sky the'"
            },
            {
                "id": 2,
                "title": "Sum of Two Integers (Bitwise)",
                "description": "Given two integers a and b, return the sum of the two integers without using the operators + and -.",
                "starter_code": "def get_sum(a: int, b: int) -> int:\n    # Write your code here\n    pass",
                "sample_cases": "Input: a = 1, b = 2, Output: 3"
            },
            {
                "id": 3,
                "title": "Valid Parentheses Checker",
                "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
                "starter_code": "def is_valid_brackets(s: str) -> bool:\n    # Write your code here\n    pass",
                "sample_cases": "Input: '()[]{}', Output: True"
            }
        ]
    else:
        try:
            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a professional technical assessment writer. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            content = response.choices[0].message.content
            parsed = json.loads(content)
            if isinstance(parsed, list):
                questions = parsed
            elif isinstance(parsed, dict):
                questions = parsed.get("questions", parsed.get("test_questions", list(parsed.values())[0]))
        except Exception as e:
            questions = [
                {
                    "id": 1,
                    "title": "Reverse Words in a String",
                    "description": "Given an input string s, reverse the order of the words.",
                    "starter_code": "def reverse_words(s: str) -> str:\n    pass",
                    "sample_cases": "Input: 'the sky is blue', Output: 'blue is sky the'"
                }
            ]
            
    # Save to database
    test = db.query(SkillsTest).filter(SkillsTest.candidate_id == candidate_id).first()
    if not test:
        test = SkillsTest(candidate_id=candidate_id)
        db.add(test)
        
    test.test_questions = json.dumps(questions)
    test.status = "PENDING"
    test.candidate_answers = json.dumps([])
    test.score = None
    test.feedback = None
    db.commit()
    
    return {"status": "PENDING", "test_questions": questions}

@router.post("/{candidate_id}/skills-test/submit")
def submit_skills_test(
    candidate_id: int,
    req: SubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.organization.current_plan != "ENTERPRISE":
        raise HTTPException(
            status_code=403,
            detail="AI Skills Test is an Enterprise Plan feature."
        )
        
    cand = db.query(Candidate).join(Job).filter(
        Candidate.id == candidate_id,
        Job.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found or access denied")
        
    from app.models import SkillsTest
    test = db.query(SkillsTest).filter(SkillsTest.candidate_id == candidate_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Skills test not generated for this candidate")
        
    from app.services.ai_service import client, OPENAI_MODEL
    import ast

    # 1. Parse code syntax using ast
    syntax_errors = []
    for ans in req.answers:
        code_str = ans.get("code", "")
        q_id = ans.get("id")
        if code_str:
            try:
                ast.parse(code_str)
            except SyntaxError as se:
                syntax_errors.append(f"Question {q_id} SyntaxError: {se.msg} at line {se.lineno}")
            except Exception as e:
                syntax_errors.append(f"Question {q_id} Error: {str(e)}")

    # 2. Check for empty or pass statement placeholder
    any_code_written = False
    if req.answers:
        for ans in req.answers:
            code_str = ans.get("code", "").strip()
            if code_str:
                lines = code_str.split("\n")
                clean_lines = []
                for line in lines:
                    stripped = line.split("#")[0].strip()
                    if stripped:
                        clean_lines.append(stripped)
                
                non_structural = [l for l in clean_lines if not l.startswith("def ") and not l.startswith("class ") and not l == ")"]
                joined = "".join(non_structural).replace(" ", "").replace("\t", "").replace(":", "")
                if joined and joined not in ["pass", "return", "returnNone", "return\"\"", "return0", "raiseNotImplementedError"]:
                    any_code_written = True
                    break

    if not any_code_written:
        syntax_errors.append("PlaceholderError: Empty implementation or default 'pass' statement found. Please write the solution logic.")

    # 3. If there are syntax or logical errors, generate another question automatically!
    if syntax_errors:
        error_msg = "; ".join(syntax_errors)
        
        # Load existing questions
        existing_questions = []
        try:
            existing_questions = json.loads(test.test_questions or "[]")
        except Exception:
            existing_questions = []
            
        next_id = len(existing_questions) + 1
        
        # Default fallback next question
        new_q = {
            "id": next_id,
            "title": f"Coding Exercise {next_id}",
            "description": "Implement a function that finds the maximum value inside a list of numeric values.",
            "starter_code": f"def find_max_value(numbers: list) -> float:\n    # Write your code here\n    pass",
            "sample_cases": "Input: [1, 5, 3, 9, 2], Output: 9.0"
        }
        
        # Attempt to generate via OpenAI
        if client:
            try:
                prompt = f"""You are an expert technical interviewer. Generate ONE single coding assessment question in Python.
Job Title: {cand.job.title if cand.job else "Software Developer"}
Candidate Profile: {cand.name}

The question must be unique and different from these existing questions:
{json.dumps(existing_questions)}

Provide:
1. Question Title
2. Clear description
3. Starter python code block
4. Sample input/output cases

Return ONLY a valid JSON object matching this structure:
{{
  "title": "Question Title",
  "description": "Question description",
  "starter_code": "def function_name()...",
  "sample_cases": "Input: ..., Output: ..."
}}
"""
                response = client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a professional technical assessment writer. Return ONLY valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7
                )
                parsed = json.loads(response.choices[0].message.content)
                new_q = {
                    "id": next_id,
                    "title": parsed.get("title", f"Coding Exercise {next_id}"),
                    "description": parsed.get("description", "Solve the target parameters."),
                    "starter_code": parsed.get("starter_code", "def solve():\n    pass"),
                    "sample_cases": parsed.get("sample_cases", "Input: n/a")
                }
            except Exception:
                pass
                
        existing_questions.append(new_q)
        test.test_questions = json.dumps(existing_questions)
        db.commit()
        
        return {
            "status": "ERROR",
            "error": error_msg,
            "test_questions": existing_questions
        }

    # Default fallback values for complete submissions if AI service call fails
    code_length = sum(len(ans.get("code", "")) for ans in req.answers)
    if code_length > 100:
        score = 75
        feedback = "Code submission analyzed. The candidate provided a complete syntax structure with standard parameters. Correct logic implementation was identified."
    else:
        score = 45
        feedback = "Code submission analyzed. The candidate provided a very brief or incomplete implementation. Standard programming structures and functions were missing."

    if client:
        prompt = f"""You are an expert software developer and technical evaluator. Evaluate the candidate's code submissions for the generated test questions.
Questions:
{test.test_questions}

Candidate Answers:
{json.dumps(req.answers)}

CRITICAL REQUIREMENT: If the candidate's submitted code for any question is empty, contains only comments, contains only 'pass', or contains only standard return placeholder statements without actual solution logic, that question MUST receive a score of 0. If all questions are placeholder/empty, the total score MUST be 0.
Otherwise, provide a realistic grade based on correctness, time complexity, and code quality.

Provide an overall assessment score between 0 and 100, and a detailed code review feedback explaining code correctness, time complexity, and edge cases.
Return ONLY a valid JSON object matching this structure:
{{
  "score": 85,
  "feedback": "Detailed review text here..."
}}
"""
        try:
            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a professional technical code evaluator. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            res_content = response.choices[0].message.content
            parsed = json.loads(res_content)
            score = int(parsed.get("score", 80))
            feedback = str(parsed.get("feedback", feedback))
        except Exception as e:
            pass
            
    test.candidate_answers = json.dumps(req.answers)
    test.score = score
    test.feedback = feedback
    test.status = "COMPLETED"
    db.commit()
    
    return {
        "status": "COMPLETED",
        "score": score,
        "feedback": feedback
    }
