# Multi-Task Project Collection

This repository contains five different projects demonstrating various programming concepts and solutions.

## 📋 Projects Overview

### 1. 🔍 Spelling Error Checker Agent (`spelling_checker.py`)
A Python-based agent that checks for spelling errors in text files using the `pyspellchecker` library.

**Features:**
- Command-line interface for checking multiple files
- Detailed error reports with suggestions
- Support for various text encodings
- Word cleaning and filtering
- Summary statistics

**Usage:**
```bash
python spelling_checker.py file1.txt file2.txt
python spelling_checker.py --help
```

**Dependencies:**
- `pyspellchecker==0.7.2`

### 2. 📅 Task Organizer Agent (`task_organizer.py`)
A comprehensive task management system that organizes tasks based on priority and deadline.

**Features:**
- Task creation with priority levels (Low, Medium, High, Urgent)
- Deadline management and overdue detection
- Status tracking (Pending, In Progress, Completed, Cancelled)
- Multiple sorting options (priority, deadline, combined)
- JSON-based data persistence
- Detailed reporting system
- Command-line interface

**Usage:**
```bash
# Add a task
python task_organizer.py --add "Complete project" "Finish the coding task" --priority high --deadline "2024-01-15 18:00"

# List all tasks
python task_organizer.py --list

# Generate report
python task_organizer.py --report

# Mark task as completed
python task_organizer.py --complete 12345

# Show overdue tasks
python task_organizer.py --overdue
```

### 3. 🧮 Factorial Calculator (`factorial.py`)
A comprehensive Python module with multiple factorial calculation implementations.

**Features:**
- Multiple calculation methods (recursive, iterative, cached, built-in, gamma, approximation)
- Performance benchmarking
- Error handling and validation
- Command-line interface
- Demonstration mode

**Usage:**
```bash
# Calculate factorial
python factorial.py 10

# Use specific method
python factorial.py 10 --method iterative

# Run benchmark
python factorial.py 10 --benchmark

# Run demonstration
python factorial.py --demo
```

### 4. 🐛 JavaScript Bug Fix (`buggy_button.html` & `fixed_button.html`)
Demonstration of common JavaScript button bugs and their fixes.

**Buggy Version Features:**
- Missing event listeners
- Wrong element ID references
- Undefined function calls
- Premature DOM access
- Scope issues

**Fixed Version Features:**
- Proper DOM ready handling
- Error handling and validation
- Async operation simulation
- Form validation
- Loading states
- Global error handlers

**Usage:**
Open either HTML file in a web browser to see the bugs in action or the fixes working properly.

### 5. 🌐 Persian Contact Page (`persian_contact.html`)
A responsive HTML page with Persian title and contact form.

**Features:**
- RTL (Right-to-Left) layout for Persian text
- Responsive design for all screen sizes
- Contact information section
- Interactive contact form with validation
- Social media links
- Modern gradient design
- Form submission handling
- Real-time validation
- Success/error messaging

**Usage:**
Open `persian_contact.html` in a web browser to view the contact page.

## 🚀 Quick Start

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Individual Projects:**
   - Spelling Checker: `python spelling_checker.py sample.txt`
   - Task Organizer: `python task_organizer.py --help`
   - Factorial Calculator: `python factorial.py 10`
   - JavaScript Examples: Open HTML files in browser
   - Persian Contact Page: Open `persian_contact.html` in browser

## 📁 File Structure

```
/workspace/
├── README.md                    # This file
├── requirements.txt             # Python dependencies
├── spelling_checker.py          # Spelling error checker agent
├── task_organizer.py           # Task management agent
├── factorial.py                # Factorial calculator
├── buggy_button.html           # JavaScript bugs demonstration
├── fixed_button.html           # Fixed JavaScript version
└── persian_contact.html        # Persian contact page
```

## 🛠️ Technical Details

### Spelling Checker
- Uses `pyspellchecker` for spell checking
- Supports multiple file processing
- Provides word suggestions
- Handles various text encodings

### Task Organizer
- Object-oriented design with Task and TaskOrganizerAgent classes
- JSON serialization for data persistence
- Priority-based and deadline-based sorting
- Comprehensive reporting system

### Factorial Calculator
- Multiple implementation approaches
- Performance benchmarking
- Error handling for edge cases
- Support for large numbers with approximation

### JavaScript Examples
- Demonstrates common web development bugs
- Shows proper error handling techniques
- Includes modern JavaScript features
- Responsive design principles

### Persian Contact Page
- RTL layout support
- Modern CSS Grid and Flexbox
- Form validation and submission
- Responsive design for mobile devices

## 🎯 Key Learning Points

1. **Error Handling:** Proper error handling in both Python and JavaScript
2. **Data Persistence:** JSON-based storage for task management
3. **Performance:** Different algorithms for the same problem (factorial)
4. **User Experience:** Responsive design and form validation
5. **Internationalization:** RTL layout for Persian language support

## 📝 Notes

- All Python scripts include comprehensive error handling
- HTML files are self-contained with embedded CSS and JavaScript
- The task organizer uses a simple file-based storage system
- The factorial calculator includes both exact and approximation methods
- The Persian contact page demonstrates modern web development practices

## 🔧 Requirements

- Python 3.6+
- Modern web browser (for HTML examples)
- Internet connection (for downloading Python packages)

## 📄 License

This project is open source and available under the MIT License.