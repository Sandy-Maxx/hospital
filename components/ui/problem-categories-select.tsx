"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, AlertCircle, Stethoscope, HeartPulse, Activity, Syringe, Pill as PillIcon, Brain, Baby, Bone, Droplets, ActivitySquare, Thermometer } from 'lucide-react';

interface ProblemCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  sortOrder?: number;
}

interface ProblemCategoriesSelectProps {
  value: string[];
  onChange: (categoryIds: string[]) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  maxSelections?: number;
}

export default function ProblemCategoriesSelect({
  value,
  onChange,
  placeholder = "Select health concerns...",
  className = "",
  required = false,
  maxSelections = 5
}: ProblemCategoriesSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<ProblemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/problem-categories');
        const data = await response.json();
        
        if (data.success) {
          setCategories(data.categories);
        } else {
          console.error('Failed to fetch categories:', data.error);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);
  
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedCategories = value.map(id => 
    categories.find(cat => cat.id === id)
  ).filter(Boolean);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggleCategory = (categoryId: string) => {
    if (value.includes(categoryId)) {
      onChange(value.filter(id => id !== categoryId));
    } else if (value.length < maxSelections) {
      onChange([...value, categoryId]);
    }
  };

  const handleRemoveCategory = (categoryId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onChange(value.filter(id => id !== categoryId));
  };


  const renderIcon = (name?: string) => {
    const n = (name || '').toLowerCase();
    switch (n) {
      case 'stethoscope': return <Stethoscope className="w-4 h-4"/>;
      case 'heart': return <HeartPulse className="w-4 h-4"/>;
      case 'activity': return <Activity className="w-4 h-4"/>;
      case 'syringe': return <Syringe className="w-4 h-4"/>;
      case 'pill': return <PillIcon className="w-4 h-4"/>;
      case 'bandage': return <ActivitySquare className="w-4 h-4"/>;
      case 'lungs': return <ActivitySquare className="w-4 h-4"/>;
      case 'brain': return <Brain className="w-4 h-4"/>;
      case 'baby': return <Baby className="w-4 h-4"/>;
      case 'bone': return <Bone className="w-4 h-4"/>;
      case 'blood': return <Droplets className="w-4 h-4"/>;
      case 'vitals': return <Thermometer className="w-4 h-4"/>;
      default:
        return <ActivitySquare className="w-4 h-4"/>;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`min-h-[42px] p-2 border rounded-md cursor-pointer transition-colors ${
          isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400'
        } ${selectedCategories.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedCategories.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              selectedCategories.map((category) => (
                <span
                  key={category!.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                  style={{ 
                    backgroundColor: category!.color ? `${category!.color}20` : '#dbeafe',
                    color: category!.color || '#1e40af'
                  }}
                >
                  <span>{category!.name}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveCategory(category!.id, e)}
                    className="hover:bg-black/10 rounded-full p-0.5 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search health concerns..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {value.length >= maxSelections && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4" />
                <span>Maximum {maxSelections} selections allowed</span>
              </div>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <span>No categories found</span>
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isSelected = value.includes(category.id);
                const isDisabled = !isSelected && value.length >= maxSelections;

                return (
                  <div
                    key={category.id}
                    className={`p-3 cursor-pointer transition-colors ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : isSelected 
                          ? 'bg-blue-50' 
                          : 'hover:bg-gray-50'
                    }`}
                    onClick={() => !isDisabled && handleToggleCategory(category.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <div className="w-4 h-4 bg-blue-600 rounded border-2 border-blue-600 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {category.icon ? (
                            <span className="text-lg" aria-hidden="true">
                              {renderIcon(category.icon)}
                            </span>
                          ) : null}
                          <span className="font-medium text-gray-900">{category.name}</span>
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-600">{category.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-600 text-center">
              {value.length} of {maxSelections} selected
              {required && value.length === 0 && (
                <span className="text-red-600 ml-2">* Required</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
