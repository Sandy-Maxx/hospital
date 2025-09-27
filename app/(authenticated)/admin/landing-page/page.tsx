"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Monitor,
  Image as ImageIcon,
  FileText,
  Palette,
  Upload,
  Eye,
  Save,
  ChevronLeft,
  ChevronRight,
  Check,
  Globe,
  Heart,
  Info,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface LandingPageSettings {
  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  heroImages: string[];
  heroButtonText: string;
  heroSecondaryButtonText: string;
  enableHeroSlider: boolean;
  sliderAutoplay: boolean;
  sliderInterval: number;
  
  // About Section
  aboutTitle: string;
  aboutDescription: string;
  aboutImage: string;
  visionImage: string;
  missionImage: string;
  
  // Features Section
  featuresTitle: string;
  featuresSubtitle: string;
  enableFeatures: boolean;
  
  // Animations
  enableAnimations: boolean;
  animationSpeed: "slow" | "normal" | "fast";
  
  // Colors & Styling
  heroOverlayColor: string;
  heroOverlayOpacity: number;
  buttonStyle: "rounded" | "square" | "pill";
  // Floating CTA & contacts
  showFloatingCta?: boolean;
  ctaWhatsApp?: string;
  ctaPhone?: string;
  ctaEmail?: string;
}

const defaultSettings: LandingPageSettings = {
  heroTitle: "Welcome to {hospitalName}",
  heroSubtitle: "Experience world-class healthcare with compassion and innovation",
  heroImages: [],
  heroButtonText: "Book Appointment",
  heroSecondaryButtonText: "Learn More",
  enableHeroSlider: true,
  sliderAutoplay: true,
  sliderInterval: 5000,
  aboutTitle: "About Us",
  aboutDescription: "We are committed to providing exceptional healthcare services...",
  aboutImage: "",
  visionImage: "",
  missionImage: "",
  featuresTitle: "Why Choose Us?",
  featuresSubtitle: "Comprehensive healthcare services with modern technology",
  enableFeatures: true,
  enableAnimations: true,
  animationSpeed: "normal",
  heroOverlayColor: "#1e40af",
  heroOverlayOpacity: 0.8,
  buttonStyle: "pill",
  showFloatingCta: true,
  ctaWhatsApp: "",
  ctaPhone: "",
  ctaEmail: "",
};

const steps = [
  {
    id: "hero",
    title: "Hero Section",
    icon: Monitor,
    description: "Configure the main hero section with images and content",
  },
  {
    id: "content",
    title: "Content & Text",
    icon: FileText,
    description: "Set up titles, descriptions, and button texts",
  },
  {
    id: "about",
    title: "About Page",
    icon: Info,
    description: "Configure about page content and images",
  },
  {
    id: "contact",
    title: "Contact & CTA",
    icon: Phone,
    description: "WhatsApp, phone, email and floating CTA settings",
  },
  {
    id: "styling",
    title: "Design & Style",
    icon: Palette,
    description: "Customize colors, animations, and visual effects",
  },
  {
    id: "preview",
    title: "Preview & Save",
    icon: Eye,
    description: "Preview your changes and save the configuration",
  },
];

export default function LandingPageSettings() {
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState<LandingPageSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const aboutInputRef = useRef<HTMLInputElement>(null);
  const visionInputRef = useRef<HTMLInputElement>(null);
  const missionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings/landing-page");
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error("Failed to load landing page settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVisionFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const url = await uploadImage(files[0], "vision");
      updateSetting("visionImage", url);
      toast.success("Vision image uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Failed to upload vision image");
    }
  };

  const handleMissionFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const url = await uploadImage(files[0], "mission");
      updateSetting("missionImage", url);
      toast.success("Mission image uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Failed to upload mission image");
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/landing-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Landing page settings saved successfully!");
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save settings");
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof LandingPageSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const uploadImage = async (file: File, prefix: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("prefix", prefix);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (!json?.success) throw new Error(json?.error || "Upload failed");
    return json.url as string;
  };

  const handleHeroFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files.item(i)!;
        const url = await uploadImage(f, "hero");
        urls.push(url);
      }
      updateSetting("heroImages", [...(settings.heroImages || []), ...urls]);
      toast.success("Hero image(s) uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Failed to upload image(s)");
    }
  };

  const handleAboutFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const url = await uploadImage(files[0], "about");
      updateSetting("aboutImage", url);
      toast.success("About image uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Failed to upload about image");
    }
  };

  const removeHeroImage = (idx: number) => {
    const next = [...(settings.heroImages || [])];
    next.splice(idx, 1);
    updateSetting("heroImages", next);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case "hero":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="heroImages">Hero Images</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <Button variant="outline" className="mt-2" onClick={() => heroInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Hero Images
                  </Button>
                  <input
                    ref={heroInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleHeroFiles(e.target.files)}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Upload multiple images for the hero slider (recommended: 1920x1080px)
                </p>
              </div>
              {settings.heroImages && settings.heroImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {settings.heroImages.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="relative group rounded-lg overflow-hidden border">
                      <img src={url} alt={`Hero ${idx+1}`} className="w-full h-28 object-cover" />
                      <button
                        type="button"
                        onClick={() => removeHeroImage(idx)}
                        className="absolute top-2 right-2 bg-white/90 text-red-600 text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition"
                        title="Remove"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="enableHeroSlider">Enable Hero Slider</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="enableHeroSlider"
                    checked={settings.enableHeroSlider}
                    onCheckedChange={(checked) => updateSetting("enableHeroSlider", checked)}
                  />
                  <span className="text-sm text-gray-600">
                    {settings.enableHeroSlider ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              {settings.enableHeroSlider && (
                <>
                  <div>
                    <Label htmlFor="sliderAutoplay">Auto-play Slider</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        id="sliderAutoplay"
                        checked={settings.sliderAutoplay}
                        onCheckedChange={(checked) => updateSetting("sliderAutoplay", checked)}
                      />
                      <span className="text-sm text-gray-600">
                        {settings.sliderAutoplay ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sliderInterval">Slider Interval (ms)</Label>
                    <Input
                      id="sliderInterval"
                      type="number"
                      value={settings.sliderInterval}
                      onChange={(e) => updateSetting("sliderInterval", parseInt(e.target.value))}
                      className="mt-2"
                      min="1000"
                      max="10000"
                      step="500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "content":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="heroTitle">Hero Title</Label>
              <Input
                id="heroTitle"
                value={settings.heroTitle}
                onChange={(e) => updateSetting("heroTitle", e.target.value)}
                className="mt-2"
                placeholder="Welcome to {hospitalName}"
              />
              <p className="text-sm text-gray-500 mt-1">
                Use {"{hospitalName}"} to automatically insert hospital name
              </p>
            </div>

            <div>
              <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
              <Textarea
                id="heroSubtitle"
                value={settings.heroSubtitle}
                onChange={(e) => updateSetting("heroSubtitle", e.target.value)}
                className="mt-2"
                rows={3}
                placeholder="Experience world-class healthcare..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="heroButtonText">Primary Button Text</Label>
                <Input
                  id="heroButtonText"
                  value={settings.heroButtonText}
                  onChange={(e) => updateSetting("heroButtonText", e.target.value)}
                  className="mt-2"
                  placeholder="Book Appointment"
                />
              </div>

              <div>
                <Label htmlFor="heroSecondaryButtonText">Secondary Button Text</Label>
                <Input
                  id="heroSecondaryButtonText"
                  value={settings.heroSecondaryButtonText}
                  onChange={(e) => updateSetting("heroSecondaryButtonText", e.target.value)}
                  className="mt-2"
                  placeholder="Learn More"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="featuresTitle">Features Section Title</Label>
              <Input
                id="featuresTitle"
                value={settings.featuresTitle}
                onChange={(e) => updateSetting("featuresTitle", e.target.value)}
                className="mt-2"
                placeholder="Why Choose Us?"
              />
            </div>

            <div>
              <Label htmlFor="featuresSubtitle">Features Section Subtitle</Label>
              <Input
                id="featuresSubtitle"
                value={settings.featuresSubtitle}
                onChange={(e) => updateSetting("featuresSubtitle", e.target.value)}
                className="mt-2"
                placeholder="Comprehensive healthcare services..."
              />
            </div>
          </div>
        );

      case "about":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="aboutTitle">About Page Title</Label>
              <Input
                id="aboutTitle"
                value={settings.aboutTitle}
                onChange={(e) => updateSetting("aboutTitle", e.target.value)}
                className="mt-2"
                placeholder="About Us"
              />
            </div>

            <div>
              <Label htmlFor="aboutDescription">About Description</Label>
              <Textarea
                id="aboutDescription"
                value={settings.aboutDescription}
                onChange={(e) => updateSetting("aboutDescription", e.target.value)}
                className="mt-2"
                rows={5}
                placeholder="We are committed to providing exceptional healthcare services..."
              />
            </div>

            <div>
              <Label htmlFor="aboutImage">About Page Image</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <Button variant="outline" className="mt-2" onClick={() => aboutInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload About Image
                  </Button>
                  <input
                    ref={aboutInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAboutFile(e.target.files)}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Upload an image for the about page (recommended: 800x600px)
                </p>
              </div>
              {settings.aboutImage && (
                <div className="mt-4">
                  <img src={settings.aboutImage} alt="About" className="w-full max-w-md h-48 object-cover rounded-lg border" />
                </div>
              )}
            </div>

            {/* Vision Image */}
            <div>
              <Label htmlFor="visionImage">Vision Section Image</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <Button variant="outline" className="mt-2" onClick={() => visionInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Vision Image
                  </Button>
                  <input
                    ref={visionInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleVisionFile(e.target.files)}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">Recommended: 800x600px</p>
              </div>
              {settings.visionImage && (
                <div className="mt-4">
                  <img src={settings.visionImage} alt="Vision" className="w-full max-w-md h-48 object-cover rounded-lg border" />
                </div>
              )}
            </div>

            {/* Mission Image */}
            <div>
              <Label htmlFor="missionImage">Mission Section Image</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <Button variant="outline" className="mt-2" onClick={() => missionInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Mission Image
                  </Button>
                  <input
                    ref={missionInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleMissionFile(e.target.files)}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">Recommended: 800x600px</p>
              </div>
              {settings.missionImage && (
                <div className="mt-4">
                  <img src={settings.missionImage} alt="Mission" className="w-full max-w-md h-48 object-cover rounded-lg border" />
                </div>
              )}
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="showFloatingCta">Enable Floating CTA on public pages</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  id="showFloatingCta"
                  checked={!!settings.showFloatingCta}
                  onCheckedChange={(checked) => updateSetting("showFloatingCta", checked)}
                />
                <span className="text-sm text-gray-600">{settings.showFloatingCta ? "Enabled" : "Disabled"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ctaWhatsApp">WhatsApp Number</Label>
                <Input id="ctaWhatsApp" value={settings.ctaWhatsApp || ""} onChange={(e) => updateSetting("ctaWhatsApp", e.target.value)} className="mt-2" placeholder="e.g., 919876543210" />
                <p className="text-xs text-gray-500 mt-1">Use country code without + (e.g., 91...)</p>
              </div>
              <div>
                <Label htmlFor="ctaPhone">Phone Number</Label>
                <Input id="ctaPhone" value={settings.ctaPhone || ""} onChange={(e) => updateSetting("ctaPhone", e.target.value)} className="mt-2" placeholder="e.g., +91 98765 43210" />
              </div>
              <div>
                <Label htmlFor="ctaEmail">Email Address</Label>
                <Input id="ctaEmail" type="email" value={settings.ctaEmail || ""} onChange={(e) => updateSetting("ctaEmail", e.target.value)} className="mt-2" placeholder="contact@hospital.com" />
              </div>
            </div>

            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
              Configure quick contact actions shown as floating buttons on all public pages.
            </div>
          </div>
        );

      case "styling":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="enableAnimations">Enable Animations</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  id="enableAnimations"
                  checked={settings.enableAnimations}
                  onCheckedChange={(checked) => updateSetting("enableAnimations", checked)}
                />
                <span className="text-sm text-gray-600">
                  {settings.enableAnimations ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            {settings.enableAnimations && (
              <div>
                <Label htmlFor="animationSpeed">Animation Speed</Label>
                <select
                  id="animationSpeed"
                  value={settings.animationSpeed}
                  onChange={(e) => updateSetting("animationSpeed", e.target.value)}
                  className="mt-2 w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="heroOverlayColor">Hero Overlay Color</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  id="heroOverlayColor"
                  type="color"
                  value={settings.heroOverlayColor}
                  onChange={(e) => updateSetting("heroOverlayColor", e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={settings.heroOverlayColor}
                  onChange={(e) => updateSetting("heroOverlayColor", e.target.value)}
                  className="flex-1"
                  placeholder="#1e40af"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="heroOverlayOpacity">Hero Overlay Opacity</Label>
              <div className="mt-2">
                <input
                  id="heroOverlayOpacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.heroOverlayOpacity}
                  onChange={(e) => updateSetting("heroOverlayOpacity", parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>0%</span>
                  <span>{Math.round(settings.heroOverlayOpacity * 100)}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="buttonStyle">Button Style</Label>
              <select
                id="buttonStyle"
                value={settings.buttonStyle}
                onChange={(e) => updateSetting("buttonStyle", e.target.value)}
                className="mt-2 w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="rounded">Rounded</option>
                <option value="square">Square</option>
                <option value="pill">Pill (Fully Rounded)</option>
              </select>
            </div>
          </div>
        );

      case "preview":
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Configuration Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Hero Title:</strong> {settings.heroTitle}
                </div>
                <div>
                  <strong>Hero Slider:</strong> {settings.enableHeroSlider ? "Enabled" : "Disabled"}
                </div>
                <div>
                  <strong>Animations:</strong> {settings.enableAnimations ? "Enabled" : "Disabled"}
                </div>
                <div>
                  <strong>Button Style:</strong> {settings.buttonStyle}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  Preview your landing page at: <a href="/" target="_blank" className="underline">Your Website</a>
                </span>
              </div>
            </div>

            <Button
              onClick={saveSettings}
              disabled={saving}
              className="w-full"
              size="lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Globe className="w-8 h-8 mr-3 text-blue-600" />
          Landing Page Configuration
        </h1>
        <p className="text-gray-600 mt-2">
          Configure your website's landing page and about page settings
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : isActive
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-gray-300 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        isCompleted ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600 mt-1">
              {steps[currentStep].description}
            </p>
          </div>

          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save & Finish
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
