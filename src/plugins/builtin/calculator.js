/**
 * پلاگین ماشین حساب
 * Calculator Plugin
 */

class CalculatorPlugin {
    constructor() {
        this.name = 'calculator';
        this.version = '1.0.0';
        this.description = 'ماشین حساب پیشرفته';
        this.isActive = true;
        this.commands = [
            {
                name: 'calc',
                description: 'محاسبات ریاضی',
                handler: 'handleCalcCommand'
            },
            {
                name: 'math',
                description: 'توابع ریاضی',
                handler: 'handleMathCommand'
            },
            {
                name: 'convert',
                description: 'تبدیل واحدها',
                handler: 'handleConvertCommand'
            }
        ];
    }

    async initialize() {
        console.log('پلاگین ماشین حساب راه‌اندازی شد');
    }

    async executeCommand(command, params, userId) {
        switch (command) {
            case 'calc':
                return await this.handleCalcCommand(params, userId);
            case 'math':
                return await this.handleMathCommand(params, userId);
            case 'convert':
                return await this.handleConvertCommand(params, userId);
            default:
                throw new Error('دستور نامعتبر');
        }
    }

    async handleCalcCommand(params, userId) {
        const expression = params.join(' ');
        
        if (!expression) {
            return {
                message: 'لطفاً عبارت ریاضی وارد کنید. مثال: /calc 2+2*3',
                type: 'error'
            };
        }

        try {
            // Sanitize input to prevent code injection
            const sanitizedExpression = this.sanitizeExpression(expression);
            const result = this.evaluateExpression(sanitizedExpression);
            
            return {
                message: `${expression} = ${result}`,
                type: 'calculation',
                data: {
                    expression: expression,
                    result: result,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                message: `خطا در محاسبه: ${error.message}`,
                type: 'error'
            };
        }
    }

    async handleMathCommand(params, userId) {
        const functionName = params[0];
        const value = parseFloat(params[1]);
        
        if (!functionName || isNaN(value)) {
            return {
                message: 'استفاده: /math [function] [value]\nتوابع موجود: sin, cos, tan, log, sqrt, abs',
                type: 'help'
            };
        }

        try {
            const result = this.calculateMathFunction(functionName, value);
            
            return {
                message: `${functionName}(${value}) = ${result}`,
                type: 'math',
                data: {
                    function: functionName,
                    input: value,
                    result: result
                }
            };
        } catch (error) {
            return {
                message: `خطا در محاسبه: ${error.message}`,
                type: 'error'
            };
        }
    }

    async handleConvertCommand(params, userId) {
        const fromValue = parseFloat(params[0]);
        const fromUnit = params[1];
        const toUnit = params[2];
        
        if (isNaN(fromValue) || !fromUnit || !toUnit) {
            return {
                message: 'استفاده: /convert [value] [from_unit] [to_unit]\nواحدهای موجود: m, cm, km, ft, in, kg, g, lb, °C, °F, K',
                type: 'help'
            };
        }

        try {
            const result = this.convertUnit(fromValue, fromUnit, toUnit);
            
            return {
                message: `${fromValue} ${fromUnit} = ${result} ${toUnit}`,
                type: 'conversion',
                data: {
                    fromValue: fromValue,
                    fromUnit: fromUnit,
                    toUnit: toUnit,
                    result: result
                }
            };
        } catch (error) {
            return {
                message: `خطا در تبدیل: ${error.message}`,
                type: 'error'
            };
        }
    }

    sanitizeExpression(expression) {
        // Remove potentially dangerous characters
        return expression.replace(/[^0-9+\-*/().\s]/g, '');
    }

    evaluateExpression(expression) {
        // Simple expression evaluator
        // In production, use a proper math parser library
        
        try {
            // Replace common math symbols
            let processedExpression = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/،/g, '.')
                .replace(/,/g, '.');
            
            // Basic validation
            if (!/^[0-9+\-*/().\s]+$/.test(processedExpression)) {
                throw new Error('عبارت نامعتبر');
            }
            
            // Evaluate safely
            const result = Function(`"use strict"; return (${processedExpression})`)();
            
            if (typeof result !== 'number' || !isFinite(result)) {
                throw new Error('نتیجه نامعتبر');
            }
            
            return Math.round(result * 1000000) / 1000000; // Round to 6 decimal places
        } catch (error) {
            throw new Error('عبارت ریاضی نامعتبر');
        }
    }

    calculateMathFunction(functionName, value) {
        const functions = {
            'sin': Math.sin,
            'cos': Math.cos,
            'tan': Math.tan,
            'log': Math.log,
            'sqrt': Math.sqrt,
            'abs': Math.abs,
            'ceil': Math.ceil,
            'floor': Math.floor,
            'round': Math.round
        };
        
        if (!functions[functionName]) {
            throw new Error(`تابع ${functionName} پشتیبانی نمی‌شود`);
        }
        
        const result = functions[functionName](value);
        return Math.round(result * 1000000) / 1000000;
    }

    convertUnit(value, fromUnit, toUnit) {
        const conversions = {
            // Length
            'm': { 'cm': value * 100, 'km': value / 1000, 'ft': value * 3.28084, 'in': value * 39.3701 },
            'cm': { 'm': value / 100, 'km': value / 100000, 'ft': value / 30.48, 'in': value / 2.54 },
            'km': { 'm': value * 1000, 'cm': value * 100000, 'ft': value * 3280.84, 'in': value * 39370.1 },
            'ft': { 'm': value / 3.28084, 'cm': value * 30.48, 'km': value / 3280.84, 'in': value * 12 },
            'in': { 'm': value / 39.3701, 'cm': value * 2.54, 'km': value / 39370.1, 'ft': value / 12 },
            
            // Weight
            'kg': { 'g': value * 1000, 'lb': value * 2.20462 },
            'g': { 'kg': value / 1000, 'lb': value / 453.592 },
            'lb': { 'kg': value / 2.20462, 'g': value * 453.592 },
            
            // Temperature
            '°C': { '°F': value * 9/5 + 32, 'K': value + 273.15 },
            '°F': { '°C': (value - 32) * 5/9, 'K': (value - 32) * 5/9 + 273.15 },
            'K': { '°C': value - 273.15, '°F': (value - 273.15) * 9/5 + 32 }
        };
        
        if (!conversions[fromUnit] || conversions[fromUnit][toUnit] === undefined) {
            throw new Error(`تبدیل از ${fromUnit} به ${toUnit} پشتیبانی نمی‌شود`);
        }
        
        const result = conversions[fromUnit][toUnit];
        return Math.round(result * 1000000) / 1000000;
    }

    async onActivate() {
        console.log('پلاگین ماشین حساب فعال شد');
    }

    async onDeactivate() {
        console.log('پلاگین ماشین حساب غیرفعال شد');
    }

    async onUnload() {
        console.log('پلاگین ماشین حساب حذف شد');
    }
}

module.exports = new CalculatorPlugin();