import { NextRequest, NextResponse } from "next/server";

interface AssistRequest {
  page: string;
  context?: Record<string, string>;
}

interface AssistResponse {
  heading: string;
  guidance: string;
  tips: string[];
  suggestions?: string[];
  isAiGenerated: true;
}

const PAGE_GUIDANCE: Record<string, AssistResponse> = {
  "personal-details": {
    heading: "Help with personal details",
    guidance:
      "We need your personal details to identify you and match your application to your student record. " +
      "If you have a Customer Reference Number from Student Finance England, include it to speed up processing.",
    tips: [
      "Your forename(s) should match your university enrolment — include all middle names if they appear on your student record",
      "Date of birth is used to verify your identity — you must be at least 16 to apply",
      "Customer Reference Number is optional but helps us link your application to existing records faster",
    ],
    isAiGenerated: true,
  },
  "address": {
    heading: "Help with your address",
    guidance:
      "Enter your current term-time or home address. This is where we'll send any correspondence about your application.",
    tips: [
      "Use your term-time address if that's where you'll be during your course",
      "Make sure your postcode is correct — we use it to verify your address",
      "If you live in university halls, include the hall name in address line 2",
    ],
    isAiGenerated: true,
  },
  "university": {
    heading: "Help with university details",
    guidance:
      "Enter the full official name of your university and your course title as they appear on your enrolment documents.",
    tips: [
      "Use the full university name, e.g. 'University of Manchester' not 'UoM'",
      "Include the course level in the course name, e.g. 'BSc Computer Science' or 'MA English Literature'",
      "If you're on a placement year, still enter your main course name",
    ],
    isAiGenerated: true,
  },
  "contact": {
    heading: "Help with contact preferences",
    guidance:
      "Choose how you'd like us to contact you about your application. We'll send confirmation of your submission " +
      "and updates about your case status through your chosen channel.",
    tips: [
      "Email is recommended — you'll get a written record of all communications",
      "If you choose SMS, make sure it's a UK mobile number you check regularly",
      "We'll only contact you about your DSA application through this channel",
    ],
    isAiGenerated: true,
  },
  "costs": {
    heading: "Help with cost items",
    guidance:
      "List the disability-related support and equipment you need for your studies. Each item needs a description, " +
      "the cost in pounds, and the supplier who will provide it. You can add up to 10 items.",
    tips: [
      "Get quotes from approved suppliers before submitting — this speeds up your application",
      "Include both equipment (laptops, software) and support services (mentoring, note-taking)",
      "Amounts should match your supplier quotes exactly — discrepancies cause delays",
      "If you're unsure about a cost, include it anyway — the caseworker can discuss it with you",
    ],
    suggestions: [
      "Laptop with assistive software",
      "Text-to-speech software licence",
      "Specialist study skills mentoring",
      "Note-taking support",
      "Ergonomic equipment (keyboard, mouse, chair)",
      "Recording device for lectures",
      "Printer and consumables",
      "Specialist mentoring sessions",
    ],
    isAiGenerated: true,
  },
  "check-answers": {
    heading: "Before you submit",
    guidance:
      "Review all your answers carefully. Once submitted, you won't be able to change your application online — " +
      "you'll need to contact us to make amendments.",
    tips: [
      "Double-check your contact details — we'll use these to send your case reference and updates",
      "Make sure your cost items match your supplier quotes",
      "Verify your date of birth and university details match your official records",
      "After submitting, you'll receive a case reference number — keep it safe for tracking your application",
    ],
    isAiGenerated: true,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: AssistRequest = await request.json();
    const { page } = body;

    const guidance = PAGE_GUIDANCE[page];
    if (!guidance) {
      return NextResponse.json(
        { error: "No guidance available for this page" },
        { status: 404 }
      );
    }

    return NextResponse.json(guidance);
  } catch {
    return NextResponse.json(
      { error: "Failed to get assistance" },
      { status: 500 }
    );
  }
}
