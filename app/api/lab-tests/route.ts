import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all unique lab tests from medicine table and return comprehensive list
    const customTests = await prisma.medicine.findMany({
      where: {
        category: 'LAB_TEST',
        isActive: true
      },
      select: {
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    const customTestNames = customTests.map((test: { name: string }) => test.name)

    // Comprehensive lab tests list
    const standardTests = [
      // Blood Tests
      'Complete Blood Count (CBC)',
      'Complete Blood Count with Differential',
      'Blood Sugar (Fasting)',
      'Blood Sugar (Random)',
      'Blood Sugar (Post Prandial)',
      'HbA1c (Glycated Hemoglobin)',
      'Lipid Profile',
      'Total Cholesterol',
      'HDL Cholesterol',
      'LDL Cholesterol',
      'Triglycerides',
      
      // Liver Function Tests
      'Liver Function Test (LFT)',
      'SGOT/AST',
      'SGPT/ALT',
      'Alkaline Phosphatase',
      'Bilirubin (Total)',
      'Bilirubin (Direct)',
      'Albumin',
      'Total Protein',
      
      // Kidney Function Tests
      'Kidney Function Test (KFT)',
      'Blood Urea Nitrogen (BUN)',
      'Serum Creatinine',
      'Uric Acid',
      'Electrolytes (Na, K, Cl)',
      
      // Thyroid Function Tests
      'Thyroid Function Test (TFT)',
      'TSH (Thyroid Stimulating Hormone)',
      'T3 (Triiodothyronine)',
      'T4 (Thyroxine)',
      'Free T3',
      'Free T4',
      
      // Cardiac Markers
      'Troponin I',
      'Troponin T',
      'CK-MB',
      'CPK (Creatine Phosphokinase)',
      'LDH (Lactate Dehydrogenase)',
      
      // Inflammatory Markers
      'ESR (Erythrocyte Sedimentation Rate)',
      'CRP (C-Reactive Protein)',
      'RA Factor (Rheumatoid Factor)',
      'Anti-CCP',
      
      // Hormones
      'Insulin',
      'Cortisol',
      'Testosterone',
      'Estrogen',
      'Progesterone',
      'Prolactin',
      'Growth Hormone',
      
      // Vitamins & Minerals
      'Vitamin D',
      'Vitamin B12',
      'Folate',
      'Iron Studies',
      'Ferritin',
      'Calcium',
      'Phosphorus',
      'Magnesium',
      
      // Urine Tests
      'Urine Analysis (Complete)',
      'Urine Culture',
      'Urine Microscopy',
      '24-Hour Urine Protein',
      'Urine Microalbumin',
      
      // Stool Tests
      'Stool Analysis',
      'Stool Culture',
      'Stool for Ova and Parasites',
      'Occult Blood in Stool',
      
      // Imaging Tests
      'Chest X-Ray',
      'Abdominal X-Ray',
      'CT Scan Head',
      'CT Scan Chest',
      'CT Scan Abdomen',
      'MRI Brain',
      'MRI Spine',
      'Ultrasound Abdomen',
      'Ultrasound Pelvis',
      'Echocardiography',
      'ECG (Electrocardiogram)',
      'Stress Test',
      'Holter Monitor',
      
      // Specialized Tests
      'Blood Gas Analysis',
      'Coagulation Profile (PT/INR, APTT)',
      'Hepatitis B Surface Antigen',
      'Hepatitis C Antibody',
      'HIV Test',
      'VDRL/RPR',
      'Widal Test',
      'Mantoux Test',
      'Pap Smear',
      'Mammography',
      'Bone Densitometry (DEXA)',
      'Pulmonary Function Test',
      'Endoscopy',
      'Colonoscopy'
    ]

    // Combine and deduplicate
    const combinedTests = [...standardTests, ...customTestNames]
    const allTests = Array.from(new Set(combinedTests)).sort()

    return NextResponse.json({ tests: allTests })
  } catch (error) {
    console.error('Error fetching lab tests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { testName } = body

    if (!testName) {
      return NextResponse.json({ error: 'Test name is required' }, { status: 400 })
    }

    // Check if test already exists
    const existingTest = await prisma.medicine.findFirst({
      where: {
        name: testName,
        category: 'LAB_TEST'
      }
    })

    if (existingTest) {
      return NextResponse.json({ message: 'Test already exists' }, { status: 200 })
    }

    // Add new custom test
    const newTest = await prisma.medicine.create({
      data: {
        name: testName,
        category: 'LAB_TEST',
        dosageForm: 'Test',
        isActive: true
      }
    })

    return NextResponse.json({ test: newTest }, { status: 201 })
  } catch (error) {
    console.error('Error creating lab test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
