/**
 * پلاگین آب و هوا
 * Weather Plugin
 */

const axios = require('axios');

class WeatherPlugin {
    constructor() {
        this.name = 'weather';
        this.version = '1.0.0';
        this.description = 'نمایش وضعیت آب و هوا';
        this.isActive = true;
        this.apiKey = process.env.WEATHER_API_KEY;
        this.commands = [
            {
                name: 'weather',
                description: 'نمایش وضعیت آب و هوا',
                handler: 'handleWeatherCommand'
            },
            {
                name: 'forecast',
                description: 'پیش‌بینی آب و هوا',
                handler: 'handleForecastCommand'
            }
        ];
    }

    async initialize() {
        console.log('پلاگین آب و هوا راه‌اندازی شد');
    }

    async executeCommand(command, params, userId) {
        switch (command) {
            case 'weather':
                return await this.handleWeatherCommand(params, userId);
            case 'forecast':
                return await this.handleForecastCommand(params, userId);
            default:
                throw new Error('دستور نامعتبر');
        }
    }

    async handleWeatherCommand(params, userId) {
        const location = params.join(' ') || 'تهران';
        
        try {
            if (!this.apiKey) {
                return {
                    message: `وضعیت آب و هوای ${location}:\n🌤️ اطلاعات در دسترس نیست (API Key تنظیم نشده)`,
                    type: 'weather',
                    data: { location: location, error: 'API Key not configured' }
                };
            }

            const weatherData = await this.getCurrentWeather(location);
            return {
                message: this.formatWeatherMessage(weatherData),
                type: 'weather',
                data: weatherData
            };
        } catch (error) {
            return {
                message: `خطا در دریافت اطلاعات آب و هوا: ${error.message}`,
                type: 'error'
            };
        }
    }

    async handleForecastCommand(params, userId) {
        const location = params.join(' ') || 'تهران';
        
        try {
            if (!this.apiKey) {
                return {
                    message: `پیش‌بینی آب و هوای ${location}:\n🌤️ اطلاعات در دسترس نیست (API Key تنظیم نشده)`,
                    type: 'forecast',
                    data: { location: location, error: 'API Key not configured' }
                };
            }

            const forecastData = await this.getWeatherForecast(location);
            return {
                message: this.formatForecastMessage(forecastData),
                type: 'forecast',
                data: forecastData
            };
        } catch (error) {
            return {
                message: `خطا در دریافت پیش‌بینی آب و هوا: ${error.message}`,
                type: 'error'
            };
        }
    }

    async getCurrentWeather(location) {
        // This is a mock implementation
        // In production, you would use a real weather API like OpenWeatherMap
        
        const mockWeatherData = {
            location: location,
            temperature: Math.floor(Math.random() * 30) + 10,
            condition: ['آفتابی', 'ابری', 'بارانی', 'برفی'][Math.floor(Math.random() * 4)],
            humidity: Math.floor(Math.random() * 40) + 30,
            windSpeed: Math.floor(Math.random() * 20) + 5,
            timestamp: new Date().toISOString()
        };

        return mockWeatherData;
    }

    async getWeatherForecast(location) {
        // Mock forecast data
        const forecast = [];
        for (let i = 0; i < 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
            forecast.push({
                date: date.toLocaleDateString('fa-IR'),
                temperature: Math.floor(Math.random() * 30) + 10,
                condition: ['آفتابی', 'ابری', 'بارانی', 'برفی'][Math.floor(Math.random() * 4)],
                humidity: Math.floor(Math.random() * 40) + 30
            });
        }

        return {
            location: location,
            forecast: forecast
        };
    }

    formatWeatherMessage(weatherData) {
        const emoji = this.getWeatherEmoji(weatherData.condition);
        return `${emoji} وضعیت آب و هوای ${weatherData.location}:
🌡️ دما: ${weatherData.temperature}°C
☁️ وضعیت: ${weatherData.condition}
💧 رطوبت: ${weatherData.humidity}%
💨 سرعت باد: ${weatherData.windSpeed} km/h`;
    }

    formatForecastMessage(forecastData) {
        let message = `🌤️ پیش‌بینی آب و هوای ${forecastData.location}:\n\n`;
        
        forecastData.forecast.forEach(day => {
            const emoji = this.getWeatherEmoji(day.condition);
            message += `${emoji} ${day.date}: ${day.temperature}°C - ${day.condition}\n`;
        });
        
        return message;
    }

    getWeatherEmoji(condition) {
        const emojiMap = {
            'آفتابی': '☀️',
            'ابری': '☁️',
            'بارانی': '🌧️',
            'برفی': '❄️'
        };
        return emojiMap[condition] || '🌤️';
    }

    async onActivate() {
        console.log('پلاگین آب و هوا فعال شد');
    }

    async onDeactivate() {
        console.log('پلاگین آب و هوا غیرفعال شد');
    }

    async onUnload() {
        console.log('پلاگین آب و هوا حذف شد');
    }
}

module.exports = new WeatherPlugin();