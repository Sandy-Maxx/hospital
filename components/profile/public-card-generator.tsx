"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Image, 
  Square, 
  Circle, 
  Download, 
  Eye, 
  Globe,
  CheckCircle,
  AlertCircle 
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
  userId?: string;
  profileData?: any;
}

export default function PublicCardGenerator({ userId, profileData }: Props) {
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [selectedShape, setSelectedShape] = useState<'round' | 'rectangle'>('rectangle');
  const [isPublished, setIsPublished] = useState(
    profileData?.publicCard?.published || false
  );
  const [lastGeneratedShape, setLastGeneratedShape] = useState<'round' | 'rectangle' | null>(null);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 }); // x, y as percentages
  const [isDragging, setIsDragging] = useState(false);

  const generateCard = async (shape: 'round' | 'rectangle', publish = false) => {
    // Prevent multiple simultaneous requests
    if (generating || publishing) {
      return;
    }
    
    // Debounce rapid clicks
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    const timeout = setTimeout(async () => {
      setGenerating(true);
      try {
        // Validate profile data before generating
        if (!profileData?.firstName && !profileData?.fullName) {
          throw new Error('Profile name is required to generate card');
        }
        
        const response = await fetch('/api/profile/public-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            shape,
            publish,
            imagePosition: {
              x: Math.round(imagePosition.x),
              y: Math.round(imagePosition.y)
            }
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate card');
        }

        const data = await response.json();
        
        // Sanitize HTML before setting
        if (data.previewHtml && typeof data.previewHtml === 'string') {
          setPreviewHtml(data.previewHtml);
          setLastGeneratedShape(shape);
        }
        
        if (publish) {
          setIsPublished(true);
          toast.success('Profile card published to team page!');
        } else {
          toast.success('Profile card generated successfully!');
        }

      } catch (error: any) {
        console.error('Error generating card:', error);
        toast.error(error.message || 'Failed to generate card');
        setPreviewHtml(null);
      } finally {
        setGenerating(false);
      }
    }, 300); // 300ms debounce
    
    setDebounceTimeout(timeout);
  };

  const publishToTeam = async () => {
    setPublishing(true);
    try {
      // Generate and publish the card
      await generateCard(selectedShape, true);
      
      // Update team page
      const response = await fetch('/api/team/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'publish',
          shape: selectedShape
        })
      });

      if (!response.ok) {
        throw new Error('Failed to publish to team page');
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to publish card');
    } finally {
      setPublishing(false);
    }
  };

  const unpublishFromTeam = async () => {
    setPublishing(true);
    try {
      const response = await fetch('/api/team/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'unpublish'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to unpublish from team page');
      }

      setIsPublished(false);
      toast.success('Card removed from team page');

    } catch (error: any) {
      toast.error(error.message || 'Failed to unpublish card');
    } finally {
      setPublishing(false);
    }
  };

  const openPreviewWindow = () => {
    if (!previewHtml) {
      toast.error('Please generate a card preview first');
      return;
    }
    
    try {
      const newWindow = window.open('', '_blank', 'width=520,height=450,scrollbars=no,resizable=yes');
      if (newWindow) {
        newWindow.document.write(previewHtml);
        newWindow.document.close();
        newWindow.focus();
      } else {
        toast.error('Please allow popups to preview the card');
      }
    } catch (error) {
      console.error('Error opening preview window:', error);
      toast.error('Failed to open preview window');
    }
  };
  
  // Drag functionality handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Constrain to bounds
    const constrainedX = Math.max(10, Math.min(90, x));
    const constrainedY = Math.max(10, Math.min(90, y));
    
    setImagePosition({ x: constrainedX, y: constrainedY });
  };

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Image className="w-5 h-5 mr-2 text-green-600" />
            Public Profile Card
          </CardTitle>
          {isPublished && (
            <Badge className="bg-green-100 text-green-800">
              <Globe className="w-3 h-3 mr-1" />
              Published
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Position Drag Control */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Profile Image Position
          </label>
          <div className="bg-gray-100 rounded-lg p-4 mb-2">
            <div className="text-sm text-gray-600 mb-3">
              Drag the image preview below to position it within the card:
            </div>
            <div 
              className="relative w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 cursor-move"
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Sample image placeholder that can be dragged */}
              <div 
                className={`absolute w-16 h-16 bg-white rounded-full border-2 border-white shadow-lg cursor-move transition-all duration-200 ${
                  isDragging ? 'scale-110 shadow-xl' : 'hover:scale-105'
                }`}
                style={{
                  left: `calc(${imagePosition.x}% - 32px)`,
                  top: `calc(${imagePosition.y}% - 32px)`,
                  backgroundImage: profileData?.profileImage 
                    ? `url(${profileData.profileImage})` 
                    : 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                  backgroundSize: profileData?.profileImage ? 'cover' : '8px 8px',
                  backgroundPosition: profileData?.profileImage ? 'center' : '0 0, 0 4px, 4px -4px, -4px 0px'
                }}
              >
                {!profileData?.profileImage && (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    <Image className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              {/* Grid overlay for better positioning reference */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-20">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Position: {Math.round(imagePosition.x)}% from left, {Math.round(imagePosition.y)}% from top
            </div>
          </div>
        </div>

        {/* Shape Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Card Shape
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedShape('rectangle')}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedShape === 'rectangle'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Square className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <div className="text-sm font-medium">Rectangle</div>
              <div className="text-xs text-gray-500">400x250px</div>
            </button>
            
            <button
              onClick={() => setSelectedShape('round')}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedShape === 'round'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Circle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <div className="text-sm font-medium">Round</div>
              <div className="text-xs text-gray-500">300x300px</div>
            </button>
          </div>
        </div>

        {/* Card Preview Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Card Will Include:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Profile photo (custom positioned)</li>
            <li>• Name and designation</li>
            <li>• Department with icon</li>
            <li>• Total years of experience</li>
            <li>• Specializations and skills</li>
            <li>• Education details</li>
            <li>• Contact information</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex space-x-3">
            <Button
              onClick={() => generateCard(selectedShape, false)}
              disabled={generating || publishing || (!profileData?.firstName && !profileData?.fullName)}
              variant="outline"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              {generating ? 'Generating...' : 'Preview Card'}
            </Button>
            
            {previewHtml && lastGeneratedShape === selectedShape && (
              <Button
                onClick={openPreviewWindow}
                variant="outline"
                size="icon"
                title="Open preview in new window"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>

          {isPublished ? (
            <Button
              onClick={unpublishFromTeam}
              disabled={publishing}
              variant="destructive"
              className="w-full"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {publishing ? 'Unpublishing...' : 'Remove from Team Page'}
            </Button>
          ) : (
            <Button
              onClick={publishToTeam}
              disabled={publishing || !profileData?.firstName}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {publishing ? 'Publishing...' : 'Publish to Team Page'}
            </Button>
          )}
        </div>

        {(!profileData?.firstName && !profileData?.fullName) && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            Complete your profile information before generating or publishing your card.
          </div>
        )}
        
        {previewHtml && lastGeneratedShape !== selectedShape && (
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg flex items-center">
            <Eye className="w-4 h-4 mr-2 flex-shrink-0" />
            Shape changed. Click "Preview Card" to generate a new preview.
          </div>
        )}

        {/* Preview Frame */}
        {previewHtml && lastGeneratedShape === selectedShape && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Preview ({selectedShape})</h4>
              <Button
                onClick={openPreviewWindow}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
              >
                <Download className="w-3 h-3 mr-1" />
                Open Full
              </Button>
            </div>
            <div className="bg-white rounded border overflow-hidden">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-64 border-0 pointer-events-none"
                title="Card Preview"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
