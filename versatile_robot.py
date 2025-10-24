#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ربات همه کاره - Versatile Robot
یک ربات چندمنظوره با قابلیت‌های مختلف
"""

import os
import sys
import json
import time
import random
import math
import datetime
import re
from typing import Dict, List, Any, Optional
import subprocess

class VersatileRobot:
    """ربات همه کاره با قابلیت‌های مختلف"""
    
    def __init__(self):
        self.name = "ربات همه کاره"
        self.version = "1.0.0"
        self.language = "فارسی"
        self.user_data = {}
        self.conversation_history = []
        
        # پیام خوشامدگویی
        self.welcome_message = f"""
🤖 {self.name} v{self.version}
سلام! من یک ربات همه کاره هستم و می‌تونم کارهای مختلفی انجام بدم:

📝 چت و گفتگو
🧮 محاسبات ریاضی
📁 مدیریت فایل‌ها
⏰ نمایش زمان و تاریخ
🎮 بازی‌ها و سرگرمی
🔍 جستجوی اطلاعات
📊 آمار و گزارش‌گیری

برای شروع، دستور مورد نظر خود را تایپ کنید یا 'help' بنویسید.
        """
    
    def start(self):
        """شروع ربات"""
        print(self.welcome_message)
        
        while True:
            try:
                user_input = input("\n👤 شما: ").strip()
                
                if not user_input:
                    continue
                
                # ذخیره تاریخچه گفتگو
                self.conversation_history.append({
                    'user': user_input,
                    'timestamp': datetime.datetime.now().isoformat()
                })
                
                # پردازش دستور
                response = self.process_command(user_input)
                print(f"\n🤖 {self.name}: {response}")
                
                # خروج از برنامه
                if user_input.lower() in ['خروج', 'exit', 'quit', 'bye']:
                    print("\n👋 خداحافظ! امیدوارم کمکتون کرده باشم.")
                    break
                    
            except KeyboardInterrupt:
                print("\n\n👋 خداحافظ!")
                break
            except Exception as e:
                print(f"\n❌ خطا: {str(e)}")
    
    def process_command(self, command: str) -> str:
        """پردازش دستورات کاربر"""
        command = command.lower().strip()
        
        # دستورات چت
        if any(word in command for word in ['سلام', 'hello', 'hi', 'صبح بخیر', 'عصر بخیر']):
            return self.chat_response(command)
        
        # دستورات محاسباتی
        elif any(word in command for word in ['محاسبه', 'حساب', 'calculate', 'جمع', 'تفریق', 'ضرب', 'تقسیم']):
            return self.calculate(command)
        
        # دستورات مدیریت فایل
        elif any(word in command for word in ['فایل', 'file', 'لیست', 'list', 'ایجاد', 'create', 'حذف', 'delete']):
            return self.file_manager(command)
        
        # دستورات زمان
        elif any(word in command for word in ['زمان', 'time', 'تاریخ', 'date', 'ساعت']):
            return self.time_info()
        
        # دستورات بازی
        elif any(word in command for word in ['بازی', 'game', 'حدس', 'guess', 'سکه', 'coin']):
            return self.entertainment(command)
        
        # دستورات اطلاعات
        elif any(word in command for word in ['اطلاعات', 'info', 'آمار', 'statistics', 'وضعیت']):
            return self.get_info()
        
        # دستورات کمکی
        elif command in ['help', 'کمک', 'راهنما']:
            return self.show_help()
        
        # پاسخ پیش‌فرض
        else:
            return self.chat_response(command)
    
    def chat_response(self, message: str) -> str:
        """پاسخ‌های چت ربات"""
        responses = {
            'سلام': ['سلام! چطور می‌تونم کمکتون کنم؟', 'سلام عزیز! چه کاری برات انجام بدم؟'],
            'hello': ['Hello! How can I help you today?', 'Hi there! What can I do for you?'],
            'چطوری': ['خوبم ممنون! شما چطورید؟', 'عالی! امیدوارم شما هم خوب باشید.'],
            'ممنون': ['خواهش می‌کنم!', 'قابلی نداشت!'],
            'خداحافظ': ['خداحافظ! امیدوارم کمکتون کرده باشم.', 'بای! همیشه در خدمتتون هستم.']
        }
        
        for key, responses_list in responses.items():
            if key in message.lower():
                return random.choice(responses_list)
        
        # پاسخ‌های عمومی
        general_responses = [
            "جالب! بیشتر توضیح بدید.",
            "درسته! چیز دیگه‌ای هم هست که بتونم کمکتون کنم؟",
            "متوجه شدم. چطور می‌تونم بهتر کمکتون کنم؟",
            "خوب! آیا سوال دیگه‌ای دارید؟"
        ]
        
        return random.choice(general_responses)
    
    def calculate(self, expression: str) -> str:
        """محاسبات ریاضی"""
        try:
            # حذف کلمات اضافی
            expression = re.sub(r'[^\d+\-*/().\s]', '', expression)
            expression = expression.strip()
            
            if not expression:
                return "لطفاً یک عبارت ریاضی وارد کنید. مثال: 2+3*4"
            
            # محاسبه امن
            allowed_chars = set('0123456789+-*/().')
            if not all(c in allowed_chars or c.isspace() for c in expression):
                return "عبارت ریاضی نامعتبر است."
            
            result = eval(expression)
            return f"نتیجه: {result}"
            
        except Exception as e:
            return f"خطا در محاسبه: {str(e)}"
    
    def file_manager(self, command: str) -> str:
        """مدیریت فایل‌ها"""
        try:
            if 'لیست' in command or 'list' in command:
                files = os.listdir('.')
                if not files:
                    return "پوشه خالی است."
                
                file_list = []
                for file in files[:10]:  # نمایش 10 فایل اول
                    if os.path.isfile(file):
                        size = os.path.getsize(file)
                        file_list.append(f"📄 {file} ({size} bytes)")
                    else:
                        file_list.append(f"📁 {file}/")
                
                return "فایل‌های موجود:\n" + "\n".join(file_list)
            
            elif 'ایجاد' in command or 'create' in command:
                filename = input("نام فایل را وارد کنید: ").strip()
                if filename:
                    with open(filename, 'w', encoding='utf-8') as f:
                        f.write(f"فایل ایجاد شده توسط {self.name} در {datetime.datetime.now()}")
                    return f"فایل '{filename}' با موفقیت ایجاد شد."
                else:
                    return "نام فایل نامعتبر است."
            
            elif 'حذف' in command or 'delete' in command:
                filename = input("نام فایل برای حذف را وارد کنید: ").strip()
                if filename and os.path.exists(filename):
                    os.remove(filename)
                    return f"فایل '{filename}' حذف شد."
                else:
                    return "فایل یافت نشد یا نامعتبر است."
            
            else:
                return "دستورات موجود: لیست، ایجاد، حذف"
                
        except Exception as e:
            return f"خطا در مدیریت فایل: {str(e)}"
    
    def time_info(self) -> str:
        """اطلاعات زمان و تاریخ"""
        now = datetime.datetime.now()
        
        # تاریخ شمسی (تقریبی)
        persian_months = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ]
        
        time_info = f"""
🕐 زمان فعلی: {now.strftime('%H:%M:%S')}
📅 تاریخ: {now.strftime('%Y/%m/%d')}
📆 روز هفته: {now.strftime('%A')}
⏰ منطقه زمانی: {now.tzname if hasattr(now, 'tzname') else 'UTC'}
        """
        
        return time_info.strip()
    
    def entertainment(self, command: str) -> str:
        """بازی‌ها و سرگرمی"""
        if 'سکه' in command or 'coin' in command:
            result = random.choice(['شیر', 'خط'])
            return f"🪙 پرتاب سکه: {result}"
        
        elif 'حدس' in command or 'guess' in command:
            number = random.randint(1, 100)
            return f"🎯 یک عدد بین 1 تا 100 انتخاب کردم. حدس بزنید!"
        
        elif 'جوک' in command or 'joke' in command:
            jokes = [
                "چرا ربات‌ها هیچوقت گرسنه نمی‌شوند؟ چون همیشه باتری دارند! 🔋",
                "یک ربات به ربات دیگه می‌گه: 'من فکر می‌کنم، پس هستم!' 🤖",
                "چرا ربات‌ها عاشق ریاضی هستند؟ چون همیشه منطقی فکر می‌کنند! 📊"
            ]
            return random.choice(jokes)
        
        else:
            return """
🎮 بازی‌های موجود:
- سکه: پرتاب سکه
- حدس: حدس زدن عدد
- جوک: شنیدن جوک
            """
    
    def get_info(self) -> str:
        """اطلاعات و آمار"""
        info = f"""
📊 اطلاعات {self.name}:
- نسخه: {self.version}
- زبان: {self.language}
- تعداد گفتگوها: {len(self.conversation_history)}
- زمان شروع: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- سیستم عامل: {os.name}
- پایتون: {sys.version.split()[0]}
        """
        return info.strip()
    
    def show_help(self) -> str:
        """نمایش راهنما"""
        help_text = """
📚 راهنمای استفاده:

💬 چت و گفتگو:
- سلام، چطوری، ممنون

🧮 محاسبات:
- محاسبه 2+3*4
- حساب 100/5

📁 مدیریت فایل:
- لیست فایل‌ها
- ایجاد فایل جدید
- حذف فایل

⏰ زمان:
- زمان فعلی
- تاریخ امروز

🎮 سرگرمی:
- پرتاب سکه
- حدس عدد
- جوک

ℹ️ اطلاعات:
- آمار ربات
- وضعیت سیستم

برای خروج: خروج، exit، quit
        """
        return help_text.strip()

def main():
    """تابع اصلی"""
    print("🚀 در حال راه‌اندازی ربات همه کاره...")
    time.sleep(1)
    
    robot = VersatileRobot()
    robot.start()

if __name__ == "__main__":
    main()