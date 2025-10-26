#!/usr/bin/env python3
"""
Simple Spelling Error Checker Agent

This agent checks for spelling errors in text files using the pyspellchecker library.
It can process individual files or multiple files and provides detailed error reports.
"""

import argparse
import sys
from pathlib import Path
from spellchecker import SpellChecker
import re

class SpellingCheckerAgent:
    def __init__(self):
        self.spell = SpellChecker()
        self.errors_found = 0
        self.total_words = 0
        
    def clean_word(self, word):
        """Remove punctuation and convert to lowercase for checking"""
        return re.sub(r'[^\w]', '', word.lower())
    
    def check_text(self, text):
        """Check spelling in a given text string"""
        words = text.split()
        misspelled = []
        
        for word in words:
            cleaned_word = self.clean_word(word)
            if cleaned_word and not self.spell.known([cleaned_word]):
                # Check if it's not a number
                if not cleaned_word.isdigit():
                    misspelled.append({
                        'word': word,
                        'cleaned': cleaned_word,
                        'suggestions': list(self.spell.candidates(cleaned_word))[:5]
                    })
                    self.errors_found += 1
            self.total_words += 1
            
        return misspelled
    
    def check_file(self, file_path):
        """Check spelling in a file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                return self.check_text(content)
        except FileNotFoundError:
            print(f"Error: File '{file_path}' not found.")
            return []
        except Exception as e:
            print(f"Error reading file '{file_path}': {e}")
            return []
    
    def generate_report(self, file_path, misspelled_words):
        """Generate a detailed spelling error report"""
        print(f"\n{'='*60}")
        print(f"SPELLING CHECK REPORT: {file_path}")
        print(f"{'='*60}")
        
        if not misspelled_words:
            print("✅ No spelling errors found!")
            return
        
        print(f"❌ Found {len(misspelled_words)} spelling error(s):")
        print()
        
        for i, error in enumerate(misspelled_words, 1):
            print(f"{i}. '{error['word']}'")
            if error['suggestions']:
                suggestions = ", ".join(error['suggestions'])
                print(f"   Suggestions: {suggestions}")
            else:
                print("   No suggestions available")
            print()
    
    def run(self, file_paths):
        """Main execution method"""
        print("🔍 Starting spelling check...")
        print()
        
        for file_path in file_paths:
            misspelled = self.check_file(file_path)
            self.generate_report(file_path, misspelled)
        
        print(f"\n{'='*60}")
        print(f"SUMMARY: {self.errors_found} errors found in {self.total_words} words checked")
        print(f"{'='*60}")

def main():
    parser = argparse.ArgumentParser(description='Check spelling errors in text files')
    parser.add_argument('files', nargs='+', help='Text files to check')
    parser.add_argument('--version', action='version', version='Spelling Checker Agent 1.0')
    
    args = parser.parse_args()
    
    # Check if files exist
    valid_files = []
    for file_path in args.files:
        if Path(file_path).exists():
            valid_files.append(file_path)
        else:
            print(f"Warning: File '{file_path}' does not exist, skipping...")
    
    if not valid_files:
        print("Error: No valid files provided.")
        sys.exit(1)
    
    # Run the spelling checker
    agent = SpellingCheckerAgent()
    agent.run(valid_files)

if __name__ == "__main__":
    main()