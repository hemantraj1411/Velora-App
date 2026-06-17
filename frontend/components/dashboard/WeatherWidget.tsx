"use client";

import { useState, useEffect } from "react";
import { CloudIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  location: string;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock weather data (in production, call actual weather API)
    const mockWeather: WeatherData = {
      temp: 22,
      condition: "Sunny",
      icon: "sun",
      location: "Your City",
    };
    
    setTimeout(() => {
      setWeather(mockWeather);
      setLoading(false);
    }, 1000);
  }, []);

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case "sun":
        return <SunIcon className="h-8 w-8 text-yellow-500" />;
      case "moon":
        return <MoonIcon className="h-8 w-8 text-indigo-500" />;
      case "cloud":
        return <CloudIcon className="h-8 w-8 text-gray-500" />;
      case "rain":
        // Use CloudIcon with different styling for rain
        return <CloudIcon className="h-8 w-8 text-blue-500" />;
      default:
        return <SunIcon className="h-8 w-8 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{weather?.location}</p>
          <p className="text-2xl font-bold">{weather?.temp}°C</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{weather?.condition}</p>
        </div>
        {weather && getWeatherIcon(weather.icon)}
      </div>
    </div>
  );
}