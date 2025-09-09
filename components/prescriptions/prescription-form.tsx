"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Plus, Trash2, Search, Pill } from "lucide-react";
import toast from "react-hot-toast";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface LabTest {
  id: string;
  name: string;
  instructions: string;
}

interface Therapy {
  id: string;
  name: string;
  duration: string;
  frequency: string;
  instructions: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  age: number;
  gender: string;
}

interface ConsultationData {
  soapNotes: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  quickNotes: {
    commonSymptoms: string[];
    vitalSigns: {
      temperature: string;
      bloodPressure: string;
      pulse: string;
      respiratoryRate: string;
      oxygenSaturation: string;
    };
    commonDiagnoses: string[];
  };
  appointmentId: string | null;
}

interface PrescriptionFormProps {
  selectedPatient: Patient | null;
  consultationId?: string;
  onSuccess?: (prescription: any) => void;
  onCancel?: () => void;
  consultationData?: ConsultationData;
  existing?: any;
}

// Common medicines database for autocomplete
const COMMON_MEDICINES = [
  "Paracetamol",
  "Ibuprofen",
  "Aspirin",
  "Amoxicillin",
  "Azithromycin",
  "Ciprofloxacin",
  "Metformin",
  "Atorvastatin",
  "Lisinopril",
  "Amlodipine",
  "Omeprazole",
  "Ranitidine",
  "Cetirizine",
  "Loratadine",
  "Salbutamol",
  "Prednisolone",
  "Dexamethasone",
  "Insulin",
  "Levothyroxine",
  "Warfarin",
  "Clopidogrel",
  "Simvastatin",
  "Losartan",
  "Hydrochlorothiazide",
  "Furosemide",
];

const COMMON_LAB_TESTS = [
  "Complete Blood Count (CBC)",
  "Blood Sugar (Fasting)",
  "Blood Sugar (Random)",
  "HbA1c",
  "Lipid Profile",
  "Liver Function Test",
  "Kidney Function Test",
  "Thyroid Function Test",
  "Urine Analysis",
  "ECG",
  "Chest X-Ray",
  "Ultrasound Abdomen",
  "CT Scan",
  "MRI",
  "Blood Pressure Monitoring",
];

const COMMON_THERAPIES = [
  "Physiotherapy",
  "Occupational Therapy",
  "Speech Therapy",
  "Respiratory Therapy",
  "Cardiac Rehabilitation",
  "Diabetic Education",
  "Nutritional Counseling",
  "Psychological Counseling",
  "Pain Management",
  "Wound Care",
];

const DOSAGE_OPTIONS = [
  "250mg",
  "500mg",
  "1g",
  "5mg",
  "10mg",
  "20mg",
  "25mg",
  "50mg",
  "100mg",
  "1ml",
  "2ml",
  "5ml",
  "10ml",
  "1 tablet",
  "2 tablets",
  "1 capsule",
  "2 capsules",
];

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "As needed",
  "Before meals",
  "After meals",
  "At bedtime",
];

const DURATION_OPTIONS = [
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "21 days",
  "30 days",
  "2 months",
  "3 months",
  "6 months",
  "Until finished",
  "As needed",
];

export default function PrescriptionForm({
  selectedPatient,
  consultationId,
  onSuccess,
  onCancel,
  consultationData,
  existing,
}: PrescriptionFormProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([
    {
      id: "1",
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    },
  ]);

  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);
  const [activeTab, setActiveTab] = useState<
    "medicines" | "labs" | "therapies"
  >("medicines");

  // Prefill when editing
  useEffect(() => {
    if (existing) {
      console.log("Loading existing prescription:", existing);
      try {
        const parsed = existing.medicines ? JSON.parse(existing.medicines) : {};
        console.log("Parsed medicines data:", parsed);

        // Handle new structure with nested properties
        if (parsed.medicines && Array.isArray(parsed.medicines)) {
          setMedicines(
            parsed.medicines.map((m: any, idx: number) => ({
              id: String(idx + 1),
              ...m,
            })),
          );
        } else if (Array.isArray(parsed)) {
          // Handle old structure (direct array)
          setMedicines(
            parsed.map((m: any, idx: number) => ({
              id: String(idx + 1),
              ...m,
            })),
          );
        } else {
          // Fallback to default
          setMedicines([
            {
              id: "1",
              name: "",
              dosage: "",
              frequency: "",
              duration: "",
              instructions: "",
            },
          ]);
        }

        if (parsed.labTests && Array.isArray(parsed.labTests)) {
          setLabTests(
            parsed.labTests.map((t: any, idx: number) => ({
              id: String(idx + 1),
              ...t,
            })),
          );
        }

        if (parsed.therapies && Array.isArray(parsed.therapies)) {
          setTherapies(
            parsed.therapies.map((t: any, idx: number) => ({
              id: String(idx + 1),
              ...t,
            })),
          );
        }

        setActiveTab("medicines");
      } catch (error) {
        console.error("Error parsing existing prescription:", error);
      }
    }
  }, [existing]);
  const [availableLabTests, setAvailableLabTests] =
    useState<string[]>(COMMON_LAB_TESTS);
  const [customTestInput, setCustomTestInput] = useState<{
    [key: string]: boolean;
  }>({});

  const [searchResults, setSearchResults] = useState<{
    [key: string]: string[];
  }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      const response = await fetch("/api/lab-tests");
      if (response.ok) {
        const data = await response.json();
        setAvailableLabTests(data.tests);
      }
    } catch (error) {
      console.error("Error fetching lab tests:", error);
    }
  };

  const addCustomLabTest = async (testName: string) => {
    try {
      const response = await fetch("/api/lab-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testName }),
      });

      if (response.ok) {
        // Refresh the lab tests list
        await fetchLabTests();
        return true;
      }
    } catch (error) {
      console.error("Error adding custom lab test:", error);
    }
    return false;
  };

  const addMedicine = () => {
    const newMedicine: Medicine = {
      id: Date.now().toString(),
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    };
    setMedicines([...medicines, newMedicine]);
  };

  const removeMedicine = (id: string) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((med) => med.id !== id));
    }
  };

  const updateMedicine = (id: string, field: keyof Medicine, value: string) => {
    setMedicines(
      medicines.map((med) =>
        med.id === id ? { ...med, [field]: value } : med,
      ),
    );

    // Handle autocomplete for medicine names
    if (field === "name" && value.length > 1) {
      const filtered = COMMON_MEDICINES.filter((medicine) =>
        medicine.toLowerCase().includes(value.toLowerCase()),
      ).slice(0, 5);
      setSearchResults({ ...searchResults, [id]: filtered });
    } else if (field === "name" && value.length <= 1) {
      const newResults = { ...searchResults };
      delete newResults[id];
      setSearchResults(newResults);
    }
  };

  const selectMedicine = (medicineId: string, medicineName: string) => {
    updateMedicine(medicineId, "name", medicineName);
    const newResults = { ...searchResults };
    delete newResults[medicineId];
    setSearchResults(newResults);
  };

  const addLabTest = () => {
    const newLabTest: LabTest = {
      id: Date.now().toString(),
      name: "",
      instructions: "",
    };
    setLabTests([...labTests, newLabTest]);
  };

  const removeLabTest = (id: string) => {
    setLabTests(labTests.filter((test) => test.id !== id));
  };

  const updateLabTest = (id: string, field: keyof LabTest, value: string) => {
    setLabTests(
      labTests.map((test) =>
        test.id === id ? { ...test, [field]: value } : test,
      ),
    );
  };

  const handleCustomTestInput = (testId: string, isCustom: boolean) => {
    setCustomTestInput({ ...customTestInput, [testId]: isCustom });
  };

  const handleCustomTestSave = async (testId: string, testName: string) => {
    if (testName.trim()) {
      const success = await addCustomLabTest(testName.trim());
      if (success) {
        updateLabTest(testId, "name", testName.trim());
        setCustomTestInput({ ...customTestInput, [testId]: false });
        toast.success("Custom test added successfully");
      } else {
        toast.error("Failed to add custom test");
      }
    }
  };

  const addTherapy = () => {
    const newTherapy: Therapy = {
      id: Date.now().toString(),
      name: "",
      duration: "",
      frequency: "",
      instructions: "",
    };
    setTherapies([...therapies, newTherapy]);
  };

  const removeTherapy = (id: string) => {
    setTherapies(therapies.filter((therapy) => therapy.id !== id));
  };

  const updateTherapy = (id: string, field: keyof Therapy, value: string) => {
    setTherapies(
      therapies.map((therapy) =>
        therapy.id === id ? { ...therapy, [field]: value } : therapy,
      ),
    );
  };

  const savePrescription = async () => {
    // Validate medicines
    const validMedicines = medicines.filter(
      (med) => med.name && med.dosage && med.frequency && med.duration,
    );

    if (validMedicines.length === 0) {
      toast.error("Please add at least one complete medicine");
      return;
    }

    if (!selectedPatient?.id) {
      toast.error("Patient selection is required");
      return;
    }

    setLoading(true);
    try {
      // If linked to an appointment, persist SOAP (including checkbox selections) to the appointment notes
      if (consultationData?.appointmentId) {
        try {
          await fetch(
            `/api/appointments/${consultationData.appointmentId}/soap`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                soapNotes: consultationData.soapNotes,
                quickNotes: consultationData.quickNotes,
              }),
            },
          );
        } catch (e) {
          console.warn(
            "Failed to persist SOAP to appointment before saving prescription:",
            e,
          );
        }
      }

      const response = await fetch(
        existing?.id
          ? `/api/prescriptions?id=${existing.id}`
          : "/api/prescriptions",
        {
          method: existing?.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: selectedPatient.id,
            consultationId: consultationId || null,
            medicines: validMedicines,
            labTests: labTests.filter((test) => test.name),
            therapies: therapies.filter((therapy) => therapy.name),
            symptoms: consultationData?.soapNotes?.subjective || "",
            diagnosis: consultationData?.soapNotes?.assessment || "",
            notes: consultationData?.soapNotes?.plan || "",
            vitals: consultationData?.quickNotes?.vitalSigns || null,
            quickNotes: consultationData?.quickNotes || null,
            soapNotes: consultationData?.soapNotes || null,
            appointmentId: consultationData?.appointmentId || null,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        toast.success("Prescription saved successfully");

        // Reset form only for new prescriptions (not edits)
        if (!existing?.id) {
          setMedicines([
            {
              id: "1",
              name: "",
              dosage: "",
              frequency: "",
              duration: "",
              instructions: "",
            },
          ]);
          setLabTests([]);
          setTherapies([]);
        }

        onSuccess?.(data.prescription);
        // Always redirect to prescriptions page after save
        try {
          window.location.href = "/prescriptions";
        } catch {}
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save prescription");
      }
    } catch (error) {
      console.error("Error saving prescription:", error);
      toast.error("Error saving prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Pill className="h-5 w-5 mr-2" />
          Prescription
        </CardTitle>
        <CardDescription>
          {selectedPatient
            ? `Add medicines and dosage instructions for ${selectedPatient.firstName} ${selectedPatient.lastName}`
            : "Add medicines and dosage instructions for the patient"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("medicines")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "medicines"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Medicines ({medicines.filter((m) => m.name).length})
          </button>
          <button
            onClick={() => setActiveTab("labs")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "labs"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Lab Tests ({labTests.length})
          </button>
          <button
            onClick={() => setActiveTab("therapies")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "therapies"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Therapies ({therapies.length})
          </button>
        </div>

        {/* Medicines Tab */}
        {activeTab === "medicines" && (
          <div className="space-y-4">
            {medicines.map((medicine, index) => (
              <div
                key={medicine.id}
                className="p-4 border border-gray-200 rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    Medicine {index + 1}
                  </h4>
                  {medicines.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMedicine(medicine.id)}
                      className="text-red-600 hover:text-red-700"
                      disabled={
                        existing &&
                        JSON.parse(existing.medicines || "{}")?.status ===
                          "COMPLETED"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Medicine Name with Autocomplete */}
                  <div className="relative">
                    <Label htmlFor={`medicine-${medicine.id}`}>
                      Medicine Name
                    </Label>
                    <Input
                      id={`medicine-${medicine.id}`}
                      value={medicine.name}
                      onChange={(e) =>
                        updateMedicine(medicine.id, "name", e.target.value)
                      }
                      placeholder="Enter medicine name"
                      className="mt-1"
                      disabled={
                        existing &&
                        JSON.parse(existing.medicines || "{}")?.status ===
                          "COMPLETED"
                      }
                    />
                    {searchResults[medicine.id] &&
                      searchResults[medicine.id].length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                          {searchResults[medicine.id].map((suggestion, idx) => (
                            <button
                              key={idx}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100"
                              onClick={() =>
                                selectMedicine(medicine.id, suggestion)
                              }
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Dosage */}
                  <div>
                    <Label htmlFor={`dosage-${medicine.id}`}>Dosage</Label>
                    <select
                      id={`dosage-${medicine.id}`}
                      value={medicine.dosage}
                      onChange={(e) =>
                        updateMedicine(medicine.id, "dosage", e.target.value)
                      }
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white"
                      disabled={
                        existing &&
                        JSON.parse(existing.medicines || "{}")?.status ===
                          "COMPLETED"
                      }
                    >
                      <option value="">Select dosage</option>
                      {DOSAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Frequency */}
                  <div>
                    <Label htmlFor={`frequency-${medicine.id}`}>
                      Frequency
                    </Label>
                    <select
                      id={`frequency-${medicine.id}`}
                      value={medicine.frequency}
                      onChange={(e) =>
                        updateMedicine(medicine.id, "frequency", e.target.value)
                      }
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white"
                      disabled={
                        existing &&
                        JSON.parse(existing.medicines || "{}")?.status ===
                          "COMPLETED"
                      }
                    >
                      <option value="">Select frequency</option>
                      {FREQUENCY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <Label htmlFor={`duration-${medicine.id}`}>Duration</Label>
                    <select
                      id={`duration-${medicine.id}`}
                      value={medicine.duration}
                      onChange={(e) =>
                        updateMedicine(medicine.id, "duration", e.target.value)
                      }
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white"
                      disabled={
                        existing &&
                        JSON.parse(existing.medicines || "{}")?.status ===
                          "COMPLETED"
                      }
                    >
                      <option value="">Select duration</option>
                      {DURATION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <Label htmlFor={`instructions-${medicine.id}`}>
                    Special Instructions
                  </Label>
                  <textarea
                    id={`instructions-${medicine.id}`}
                    value={medicine.instructions}
                    onChange={(e) =>
                      updateMedicine(
                        medicine.id,
                        "instructions",
                        e.target.value,
                      )
                    }
                    placeholder="e.g., Take with food, Avoid alcohol, etc."
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    rows={2}
                    disabled={
                      existing &&
                      JSON.parse(existing.medicines || "{}")?.status ===
                        "COMPLETED"
                    }
                  />
                </div>
              </div>
            ))}

            {/* Add Medicine Button */}
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                addMedicine();
              }}
              className="w-full"
              disabled={
                existing &&
                JSON.parse(existing.medicines || "{}")?.status === "COMPLETED"
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Medicine
            </Button>
          </div>
        )}

        {/* Lab Tests Tab */}
        {activeTab === "labs" && (
          <div className="space-y-4">
            {labTests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No lab tests added yet</p>
              </div>
            ) : (
              labTests.map((test, index) => (
                <div
                  key={test.id}
                  className="p-4 border border-gray-200 rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      Lab Test {index + 1}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeLabTest(test.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor={`test-${test.id}`}>Test Name</Label>
                      {customTestInput[test.id] ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter custom test name"
                            value={test.name}
                            onChange={(e) =>
                              updateLabTest(test.id, "name", e.target.value)
                            }
                            className="flex-1"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleCustomTestSave(test.id, test.name);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() =>
                              handleCustomTestSave(test.id, test.name)
                            }
                            disabled={!test.name.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              handleCustomTestInput(test.id, false);
                              updateLabTest(test.id, "name", "");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <select
                            id={`test-${test.id}`}
                            value={test.name}
                            onChange={(e) =>
                              updateLabTest(test.id, "name", e.target.value)
                            }
                            className="flex-1 mt-1 p-2 border border-gray-300 rounded-md bg-white"
                          >
                            <option value="">Select lab test</option>
                            {availableLabTests.map((testName) => (
                              <option key={testName} value={testName}>
                                {testName}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCustomTestInput(test.id, true)}
                            className="mt-1"
                          >
                            Custom
                          </Button>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`test-instructions-${test.id}`}>
                        Instructions
                      </Label>
                      <textarea
                        id={`test-instructions-${test.id}`}
                        value={test.instructions}
                        onChange={(e) =>
                          updateLabTest(test.id, "instructions", e.target.value)
                        }
                        placeholder="e.g., Fasting required, Morning sample, etc."
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addLabTest}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lab Test
            </Button>
          </div>
        )}

        {/* Therapies Tab */}
        {activeTab === "therapies" && (
          <div className="space-y-4">
            {therapies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No therapies added yet</p>
              </div>
            ) : (
              therapies.map((therapy, index) => (
                <div
                  key={therapy.id}
                  className="p-4 border border-gray-200 rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      Therapy {index + 1}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTherapy(therapy.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`therapy-${therapy.id}`}>
                        Therapy Type
                      </Label>
                      <select
                        id={`therapy-${therapy.id}`}
                        value={therapy.name}
                        onChange={(e) =>
                          updateTherapy(therapy.id, "name", e.target.value)
                        }
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white"
                      >
                        <option value="">Select therapy</option>
                        {COMMON_THERAPIES.map((therapyName) => (
                          <option key={therapyName} value={therapyName}>
                            {therapyName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor={`therapy-frequency-${therapy.id}`}>
                        Frequency
                      </Label>
                      <select
                        id={`therapy-frequency-${therapy.id}`}
                        value={therapy.frequency}
                        onChange={(e) =>
                          updateTherapy(therapy.id, "frequency", e.target.value)
                        }
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white"
                      >
                        <option value="">Select frequency</option>
                        <option value="Daily">Daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Three times a week">
                          Three times a week
                        </option>
                        <option value="Weekly">Weekly</option>
                        <option value="Bi-weekly">Bi-weekly</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor={`therapy-duration-${therapy.id}`}>
                        Duration
                      </Label>
                      <select
                        id={`therapy-duration-${therapy.id}`}
                        value={therapy.duration}
                        onChange={(e) =>
                          updateTherapy(therapy.id, "duration", e.target.value)
                        }
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white"
                      >
                        <option value="">Select duration</option>
                        <option value="1 week">1 week</option>
                        <option value="2 weeks">2 weeks</option>
                        <option value="1 month">1 month</option>
                        <option value="2 months">2 months</option>
                        <option value="3 months">3 months</option>
                        <option value="6 months">6 months</option>
                        <option value="Ongoing">Ongoing</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor={`therapy-instructions-${therapy.id}`}>
                        Instructions
                      </Label>
                      <textarea
                        id={`therapy-instructions-${therapy.id}`}
                        value={therapy.instructions}
                        onChange={(e) =>
                          updateTherapy(
                            therapy.id,
                            "instructions",
                            e.target.value,
                          )
                        }
                        placeholder="Special instructions for therapy"
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addTherapy}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Therapy
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <Button
            onClick={savePrescription}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Saving..." : "Save Prescription"}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
