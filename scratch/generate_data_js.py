import json

# Load parsed video IDs
with open("playlist_videos.json", "r") as f:
    videos = json.load(f)

# Define titles for the first 50 days
day_titles = {
    1: "Intro to Programming & Python",
    2: "Power of Python & Demo",
    3: "Modules and Pip in Python",
    4: "Our First Python Program",
    5: "Comments, Escape Sequences & Print",
    6: "Variables and Data Types",
    7: "Exercise 1: Calculator using Python",
    8: "Exercise 1 Solution & Calculator",
    9: "Typecasting in Python",
    10: "Taking User Input in Python",
    11: "Strings in Python",
    12: "String Slicing & Operations",
    13: "String Methods",
    14: "If Else Conditionals",
    15: "Exercise 2: Good Morning Sir",
    16: "Match Case Statements",
    17: "For Loops in Python",
    18: "While Loops",
    19: "Break and Continue",
    20: "Functions in Python",
    21: "Function Arguments",
    22: "Introduction to Lists",
    23: "List Methods",
    24: "Tuples in Python",
    25: "Operations on Tuples",
    26: "Exercise 3: KBC Game",
    27: "KBC Exercise Solution",
    28: "f-strings in Python",
    29: "Docstrings in Python",
    30: "Recursion in Python",
    31: "Sets in Python",
    32: "Set Methods",
    33: "Dictionaries in Python",
    34: "Dictionary Methods",
    35: "For Loop with Else",
    36: "Exception Handling",
    37: "Finally Keyword",
    38: "Custom Errors",
    39: "KBC Solution",
    40: "Short Hand If Else",
    41: "Enumerate Function",
    42: "Virtual Environments",
    43: "How Import Works",
    44: "if __name__ == '__main__'",
    45: "OS Module in Python",
    46: "OS Module: Rename & Folders",
    47: "Exercise 4: Code Solutions",
    48: "Local Variables vs Global",
    49: "File IO in Python",
    50: "read(), readline() & write()"
}

# Generate modules array
modules = []
for idx, item in enumerate(videos):
    day_num = idx + 1
    v_id = item['videoId']
    
    # Get title
    if day_num in day_titles:
        title = f"Day {day_num}: {day_titles[day_num]}"
    else:
        title = f"Day {day_num}: Python Tutorial - Lesson {day_num}"
        
    desc = f"Video lesson Day {day_num} of the #100DaysOfCode Python course. Watch and follow along with Harry."
    
    modules.append({
        'id': f'py-{day_num}',
        'title': title,
        'desc': desc,
        'checked': False,
        'videoId': v_id
    })

# Format standard quiz questions and careers
quiz_questions = [
    {
      "id": 1,
      "text": "What kind of projects or tasks excite you the most?",
      "options": [
        { "text": "Writing code, solving math puzzles, or building software.", "category": "tech" },
        { "text": "Designing layouts, creating art, or editing videos.", "category": "creative" },
        { "text": "Analyzing markets, budgeting, or planning business strategies.", "category": "business" },
        { "text": "Conducting lab experiments, studying plants/animals, or researching chemistry.", "category": "science" }
      ]
    },
    {
      "id": 2,
      "text": "How do you prefer to solve problems?",
      "options": [
        { "text": "Through logical algorithms, debugging, and step-by-step logic.", "category": "tech" },
        { "text": "By brainstorming creative visuals, storytelling, and user-centric designs.", "category": "creative" },
        { "text": "By looking at financial sheets, marketing statistics, and business growth charts.", "category": "business" },
        { "text": "By researching medical studies, analyzing data, and applying scientific methods.", "category": "science" }
      ]
    },
    {
      "id": 3,
      "text": "Which environment would you feel most comfortable working in?",
      "options": [
        { "text": "A tech workspace, collaborating with engineers on digital products.", "category": "tech" },
        { "text": "An agency, studio, or remote creative workspace focused on brand design.", "category": "creative" },
        { "text": "A corporate office, startup hub, or investment firm managing projects.", "category": "business" },
        { "text": "A laboratory, healthcare clinic, or field research environment.", "category": "science" }
      ]
    },
    {
      "id": 4,
      "text": "Which of the following classes sounds most interesting to you?",
      "options": [
        { "text": "Introduction to Computer Science & Python programming.", "category": "tech" },
        { "text": "Visual Arts, Graphic Design, or Creative Writing.", "category": "creative" },
        { "text": "Entrepreneurship, Microeconomics, or Marketing 101.", "category": "business" },
        { "text": "Advanced Biology, Organic Chemistry, or Environmental Science.", "category": "science" }
      ]
    }
]

careers = [
    {
      "id": "software-engineer",
      "title": "Software Engineer",
      "category": "tech",
      "salary": "$95,000 - $160,000",
      "growth": "High (25% growth forecast)",
      "difficulty": "Medium-Hard",
      "shortDesc: "Design, build, and maintain software applications and computer systems.",
      "desc": "Software Engineers apply engineering principles to build software solutions. They write code, test applications, debug issues, and collaborate with teams to solve real-world problems through technology.",
      "skillsRequired": ["Problem Solving", "Data Structures", "JavaScript/Python/Java", "Git Version Control", "System Architecture"],
      "pathway": [
        "Learn core programming concepts (HTML, CSS, JavaScript or Python).",
        "Build personal coding projects and learn git.",
        "Obtain a degree in Computer Science or complete web engineering certifications.",
        "Apply for junior developer roles or software engineering internships."
      ],
      "resources": [
        { "title": "MDN Web Docs", "url": "https://developer.mozilla.org" },
        { "title": "freeCodeCamp", "url": "https://www.freecodecamp.org" }
      ]
    },
    {
      "id": "ai-specialist",
      "title": "AI & Machine Learning Engineer",
      "category": "tech",
      "salary": "$110,000 - $190,000",
      "growth": "Exponential (36% growth forecast)",
      "difficulty": "Hard",
      "shortDesc": "Build algorithms and models that allow computers to learn from data and make decisions.",
      "desc": "AI Specialists develop neural networks, machine learning algorithms, and data pipelines to train intelligent models. They work on applications ranging from large language models to self-driving cars.",
      "skillsRequired": ["Mathematics & Statistics", "Python Programming", "TensorFlow/PyTorch", "Data Modeling", "Deep Learning"],
      "pathway": [
        "Master algebra, calculus, and probability.",
        "Learn Python and libraries like NumPy, Pandas, and Scikit-Learn.",
        "Build classification, regression, and natural language models.",
        "Participate in Kaggle competitions and specialize in Neural Networks."
      ],
      "resources": [
        { "title": "Kaggle Machine Learning Courses", "url": "https://www.kaggle.com/learn" },
        { "title": "Fast.ai Practical Deep Learning", "url": "https://www.fast.ai" }
      ]
    },
    {
      "id": "ux-designer",
      "title": "UX/UI Designer",
      "category": "creative",
      "salary": "$75,000 - $130,000",
      "growth": "Medium-High (16% growth forecast)",
      "difficulty": "Medium",
      "shortDesc": "Design intuitive, user-friendly digital interfaces for websites and mobile applications.",
      "desc": "UX/UI Designers focus on how digital products look and feel. They conduct user research, construct wireframes and interactive prototypes, and refine visual layouts to guarantee a seamless user experience.",
      "skillsRequired": ["User Research", "Wireframing/Prototyping", "Figma", "Visual Design", "Typography & Color Theory"],
      "pathway": [
        "Learn the fundamentals of UX research and design thinking.",
        "Master design tools like Figma or Adobe XD.",
        "Create case studies demonstrating user research and visual prototypes.",
        "Build a professional portfolio website showcasing your best case studies."
      ],
      "resources": [
        { "title": "Figma Community Tutorials", "url": "https://www.figma.com/resources" },
        { "title": "Google UX Design Certificate", "url": "https://www.coursera.org" }
      ]
    },
    {
      "id": "digital-marketer",
      "title": "Digital Marketer",
      "category": "business",
      "salary": "$60,000 - $110,000",
      "growth": "Medium (10% growth forecast)",
      "difficulty": "Easy-Medium",
      "shortDesc": "Promote brands, products, and services online using SEO, social media, and ads.",
      "desc": "Digital Marketers create and execute online advertising campaigns. They use search engine optimization (SEO), social media outreach, content writing, and web analytics to increase customer engagement and brand growth.",
      "skillsRequired": ["SEO & SEM", "Content Strategy", "Google Analytics", "Copywriting", "Social Media Ads"],
      "pathway": [
        "Learn the basics of SEO and digital advertising platforms.",
        "Get certified in Google Ads and Google Analytics.",
        "Practice running campaigns on social media for personal projects.",
        "Build experience in email marketing, growth hacking, and copywriting."
      ],
      "resources": [
        { "title": "Google Digital Garage", url: "https://learndigital.withgoogle.com" },
        { "title": "HubSpot Academy Marketing", url: "https://academy.hubspot.com" }
      ]
    }
]

skills = [
    {
        "id": "python-beginners",
        "title": "Python for Beginners (100 Days of Code)",
        "category": "tech",
        "time": "100 Lessons (30 mins/day)",
        "rating": "4.9",
        "image": "🐍",
        "modules": modules
    }
]

bot_responses = {
    "default": "I'm your AI Career Advisor! You can ask me things like 'How to start in coding?', 'What skills are needed for UX Design?', or 'Tell me about Python courses'. What are you curious about today?",
    "keywords": [
      {
        "keys": ["code", "coding", "software", "program", "developer", "programmer"],
        "response": "To get started in Software Development, I recommend learning Python first! The 'Python for Beginners (100 Days of Code)' course in the Skills Hub is the perfect step-by-step Hindi tutorial playlist by CodeWithHarry."
      },
      {
        "keys": ["python", "harry", "100 days"],
        "response": "CodeWithHarry's 100 Days of Python course is fantastic. It covers fundamentals like print statements and variables, data structures, and advances all the way to OOP, file handling, and multithreading!"
      },
      {
        "keys": ["design", "ui", "ux", "figma", "creative"],
        "response": "UI/UX Designers make digital interfaces user-friendly. Although we focus on Python programming in this course, you can study visual design principles and color theory to complement your tech skills!"
      },
      {
        "keys": ["salary", "money", "pay"],
        "response": "Python developers are in extremely high demand, with entry-level software engineer salaries starting around $90k+ and data science roles going up to $150k+."
      }
    ]
}

# Construct the data.js file
data_js_content = f"""const data = {{
  quizQuestions: {json.dumps(quiz_questions, indent=2)},
  careers: {json.dumps(careers, indent=2)},
  skills: {json.dumps(skills, indent=2)},
  botResponses: {json.dumps(bot_responses, indent=2)}
}};
window.appData = data;
"""

with open("../../Downloads/test_project_antigravity/data.js", "w") as f:
    f.write(data_js_content)

print("Successfully generated and saved data.js with 100 Python playlist video IDs!")
