/**
 * Problem Categories Configuration
 * 
 * This module defines comprehensive problem categories that are used for:
 * 1. Auto-doctor assignment based on specialization
 * 2. Auto-populating certain fields in SOAP notes
 * 3. Patient symptom categorization
 * 
 * Following DRY principle - single source of truth for categories
 */

export interface ProblemCategory {
  id: string;
  name: string;
  description: string;
  specializations: string[]; // Medical specializations that can handle this category
  commonSymptoms?: string[]; // For SOAP auto-population
  urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  icon?: string;
}

export const PROBLEM_CATEGORIES: ProblemCategory[] = [
  // General Medicine
  {
    id: 'fever',
    name: 'Fever & General Illness',
    description: 'Fever, flu, common cold, general weakness',
    specializations: ['GENERAL_MEDICINE', 'INTERNAL_MEDICINE'],
    commonSymptoms: ['fever', 'headache', 'body ache', 'weakness', 'chills'],
    urgencyLevel: 'NORMAL',
    icon: '🌡️'
  },
  {
    id: 'diabetes',
    name: 'Diabetes & Endocrine',
    description: 'Diabetes management, thyroid issues, hormonal disorders',
    specializations: ['ENDOCRINOLOGY', 'INTERNAL_MEDICINE', 'GENERAL_MEDICINE'],
    commonSymptoms: ['excessive thirst', 'frequent urination', 'fatigue', 'weight changes'],
    urgencyLevel: 'NORMAL',
    icon: '💉'
  },
  {
    id: 'hypertension',
    name: 'Blood Pressure & Heart',
    description: 'Hypertension, heart problems, chest pain',
    specializations: ['CARDIOLOGY', 'INTERNAL_MEDICINE'],
    commonSymptoms: ['chest pain', 'shortness of breath', 'palpitations', 'dizziness'],
    urgencyLevel: 'HIGH',
    icon: '❤️'
  },

  // Respiratory
  {
    id: 'respiratory',
    name: 'Breathing & Lung Issues',
    description: 'Cough, asthma, bronchitis, lung infections',
    specializations: ['PULMONOLOGY', 'INTERNAL_MEDICINE', 'GENERAL_MEDICINE'],
    commonSymptoms: ['cough', 'shortness of breath', 'wheezing', 'chest congestion'],
    urgencyLevel: 'NORMAL',
    icon: '🫁'
  },

  // Gastrointestinal
  {
    id: 'gastro',
    name: 'Stomach & Digestive Issues',
    description: 'Stomach pain, indigestion, diarrhea, constipation',
    specializations: ['GASTROENTEROLOGY', 'INTERNAL_MEDICINE', 'GENERAL_MEDICINE'],
    commonSymptoms: ['abdominal pain', 'nausea', 'vomiting', 'diarrhea', 'constipation'],
    urgencyLevel: 'NORMAL',
    icon: '🫃'
  },

  // ENT
  {
    id: 'ent',
    name: 'Ear, Nose & Throat',
    description: 'Throat pain, ear infection, sinus problems, hearing issues',
    specializations: ['ENT', 'OTOLARYNGOLOGY'],
    commonSymptoms: ['sore throat', 'ear pain', 'nasal congestion', 'hearing loss'],
    urgencyLevel: 'NORMAL',
    icon: '👂'
  },

  // Orthopedics
  {
    id: 'orthopedic',
    name: 'Bone & Joint Problems',
    description: 'Joint pain, fractures, back pain, muscle injuries',
    specializations: ['ORTHOPEDICS', 'RHEUMATOLOGY'],
    commonSymptoms: ['joint pain', 'swelling', 'stiffness', 'limited mobility'],
    urgencyLevel: 'NORMAL',
    icon: '🦴'
  },

  // Dermatology
  {
    id: 'skin',
    name: 'Skin & Hair Issues',
    description: 'Skin rashes, acne, hair loss, allergies',
    specializations: ['DERMATOLOGY'],
    commonSymptoms: ['skin rash', 'itching', 'redness', 'scaling', 'hair loss'],
    urgencyLevel: 'LOW',
    icon: '🧴'
  },

  // Women's Health
  {
    id: 'gynecology',
    name: 'Women\'s Health',
    description: 'Pregnancy, menstrual issues, reproductive health',
    specializations: ['GYNECOLOGY', 'OBSTETRICS'],
    commonSymptoms: ['irregular periods', 'pelvic pain', 'vaginal discharge'],
    urgencyLevel: 'NORMAL',
    icon: '👩‍⚕️'
  },

  // Pediatrics
  {
    id: 'pediatric',
    name: 'Child Health',
    description: 'Children\'s health issues, vaccination, growth problems',
    specializations: ['PEDIATRICS'],
    commonSymptoms: ['fever in child', 'poor feeding', 'developmental concerns'],
    urgencyLevel: 'NORMAL',
    icon: '👶'
  },

  // Mental Health
  {
    id: 'mental_health',
    name: 'Mental Health & Stress',
    description: 'Depression, anxiety, stress, sleep disorders',
    specializations: ['PSYCHIATRY', 'PSYCHOLOGY'],
    commonSymptoms: ['anxiety', 'depression', 'sleep issues', 'mood changes'],
    urgencyLevel: 'NORMAL',
    icon: '🧠'
  },

  // Eye Care
  {
    id: 'ophthalmology',
    name: 'Eye Problems',
    description: 'Vision problems, eye infections, eye injuries',
    specializations: ['OPHTHALMOLOGY'],
    commonSymptoms: ['blurred vision', 'eye pain', 'redness', 'discharge'],
    urgencyLevel: 'NORMAL',
    icon: '👁️'
  },

  // Dental
  {
    id: 'dental',
    name: 'Dental & Oral Health',
    description: 'Tooth pain, gum problems, oral infections',
    specializations: ['DENTISTRY', 'ORAL_SURGERY'],
    commonSymptoms: ['tooth pain', 'gum swelling', 'bleeding gums', 'bad breath'],
    urgencyLevel: 'NORMAL',
    icon: '🦷'
  },

  // Neurology
  {
    id: 'neurology',
    name: 'Neurological Issues',
    description: 'Headaches, seizures, nerve problems, memory issues',
    specializations: ['NEUROLOGY'],
    commonSymptoms: ['severe headache', 'seizures', 'numbness', 'memory loss'],
    urgencyLevel: 'HIGH',
    icon: '🧠'
  },

  // Urology
  {
    id: 'urology',
    name: 'Urinary & Kidney Issues',
    description: 'Kidney stones, UTI, prostate problems',
    specializations: ['UROLOGY', 'NEPHROLOGY'],
    commonSymptoms: ['painful urination', 'blood in urine', 'kidney pain'],
    urgencyLevel: 'NORMAL',
    icon: '🫘'
  },

  // Emergency
  {
    id: 'emergency',
    name: 'Emergency & Trauma',
    description: 'Accidents, severe pain, life-threatening conditions',
    specializations: ['EMERGENCY_MEDICINE', 'TRAUMA_SURGERY', 'GENERAL_SURGERY'],
    commonSymptoms: ['severe pain', 'trauma', 'unconsciousness', 'heavy bleeding'],
    urgencyLevel: 'EMERGENCY',
    icon: '🚨'
  },

  // Preventive Care
  {
    id: 'preventive',
    name: 'Preventive Care & Checkup',
    description: 'Regular checkups, health screening, vaccination',
    specializations: ['GENERAL_MEDICINE', 'PREVENTIVE_MEDICINE'],
    commonSymptoms: ['routine checkup', 'health screening', 'vaccination'],
    urgencyLevel: 'LOW',
    icon: '✅'
  },

  // Other
  {
    id: 'other',
    name: 'Other Health Issues',
    description: 'Other medical concerns not listed above',
    specializations: ['GENERAL_MEDICINE'],
    commonSymptoms: ['general concern', 'unspecified symptoms'],
    urgencyLevel: 'NORMAL',
    icon: '❓'
  }
];

/**
 * Get problem category by ID
 */
export function getProblemCategory(id: string): ProblemCategory | undefined {
  return PROBLEM_CATEGORIES.find(category => category.id === id);
}

/**
 * Get categories for dropdown options
 */
export function getProblemCategoryOptions() {
  return PROBLEM_CATEGORIES.map(category => ({
    value: category.id,
    label: category.name,
    description: category.description,
    icon: category.icon,
    urgencyLevel: category.urgencyLevel
  }));
}

/**
 * Get specializations that can handle given problem categories
 */
export function getSpecializationsForCategories(categoryIds: string[]): string[] {
  const specializations = new Set<string>();
  
  categoryIds.forEach(categoryId => {
    const category = getProblemCategory(categoryId);
    if (category) {
      category.specializations.forEach(spec => specializations.add(spec));
    }
  });

  return Array.from(specializations);
}

/**
 * Get common symptoms for problem categories (for SOAP auto-population)
 */
export function getCommonSymptomsForCategories(categoryIds: string[]): string[] {
  const symptoms = new Set<string>();
  
  categoryIds.forEach(categoryId => {
    const category = getProblemCategory(categoryId);
    if (category && category.commonSymptoms) {
      category.commonSymptoms.forEach(symptom => symptoms.add(symptom));
    }
  });

  return Array.from(symptoms);
}

/**
 * Determine overall urgency level for selected categories
 */
export function getOverallUrgencyLevel(categoryIds: string[]): 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY' {
  const urgencyLevels = categoryIds
    .map(id => getProblemCategory(id)?.urgencyLevel)
    .filter(Boolean) as ('LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY')[];

  if (urgencyLevels.includes('EMERGENCY')) return 'EMERGENCY';
  if (urgencyLevels.includes('HIGH')) return 'HIGH';
  if (urgencyLevels.includes('NORMAL')) return 'NORMAL';
  return 'LOW';
}

/**
 * Sort doctors by best match for problem categories
 * Returns doctors sorted by specialization match and availability
 */
export function sortDoctorsByProblemCategories(
  doctors: Array<{ id: string; name: string; specialization?: string }>,
  categoryIds: string[]
): Array<{ id: string; name: string; specialization?: string; matchScore: number }> {
  const targetSpecializations = getSpecializationsForCategories(categoryIds);
  
  return doctors.map(doctor => {
    let matchScore = 0;
    
    if (doctor.specialization) {
      if (targetSpecializations.includes(doctor.specialization)) {
        matchScore = 10; // Perfect specialization match
      } else if (doctor.specialization === 'GENERAL_MEDICINE') {
        matchScore = 5; // General medicine as fallback
      }
    } else {
      matchScore = 1; // No specialization info, lowest priority
    }
    
    return { ...doctor, matchScore };
  }).sort((a, b) => b.matchScore - a.matchScore);
}
