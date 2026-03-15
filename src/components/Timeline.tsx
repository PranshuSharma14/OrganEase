"use client";

import { Check } from "lucide-react";

type TimelineStep = {
  title: string;
  description: string;
  date?: string;
  status: "completed" | "current" | "pending";
};

type Match = {
  createdAt: Date | string;
  approvedByHospital?: boolean;
  approvedAt?: Date | string;
  donorAccepted?: boolean;
  recipientAccepted?: boolean;
  testScheduledDate?: Date | string;
  procedureScheduledDate?: Date | string;
  completedAt?: Date | string;
  status?: string;
};

// Helper function to safely convert to Date
function toDate(date: Date | string | undefined): Date | undefined {
  if (!date) return undefined;
  return date instanceof Date ? date : new Date(date);
}

// Helper function to format date safely
function formatDate(date: Date | string | undefined): string | undefined {
  const d = toDate(date);
  return d ? d.toLocaleDateString() : undefined;
}

export function generateTimelineSteps(match: Match): TimelineStep[] {
  const steps: TimelineStep[] = [];

  // Step 1: Profile Created
  steps.push({
    title: "Profile Created",
    description: "Your profile has been registered in the system",
    date: formatDate(match.createdAt),
    status: "completed",
  });

  // Step 2: Hospital Approval
  // Convert to boolean to ensure proper checking
  const isApproved = !!(match.approvedByHospital === true || match.approvedByHospital === "true" || match.approvedByHospital === 1 || match.approvedByHospital === "1");
  console.log('Timeline - Hospital approval check:', {
    approvedByHospital: match.approvedByHospital,
    type: typeof match.approvedByHospital,
    isApproved,
    matchId: match.id || match.matchId
  });
  
  if (isApproved) {
    steps.push({
      title: "Hospital Approved",
      description: "Match has been reviewed and approved by the hospital",
      date: formatDate(match.approvedAt),
      status: "completed",
    });
  } else {
    steps.push({
      title: "Hospital Review",
      description: "Waiting for hospital to review and approve the match",
      status: "current",
    });
    return steps; // Stop here if not approved
  }

  // Step 3: Match Acceptance
  // Convert to boolean to ensure proper checking
  const donorAccepted = !!(match.donorAccepted === true || match.donorAccepted === "true" || match.donorAccepted === 1 || match.donorAccepted === "1");
  const recipientAccepted = !!(match.recipientAccepted === true || match.recipientAccepted === "true" || match.recipientAccepted === 1 || match.recipientAccepted === "1");
  
  if (donorAccepted && recipientAccepted) {
    steps.push({
      title: "Match Accepted",
      description: "Both donor and recipient have accepted the match",
      status: "completed",
    });
  } else if (isApproved) {
    const acceptedParties = [];
    if (donorAccepted) acceptedParties.push("Donor");
    if (recipientAccepted) acceptedParties.push("Recipient");
    
    steps.push({
      title: "Match Acceptance",
      description: acceptedParties.length > 0
        ? `${acceptedParties.join(" and ")} accepted. Waiting for ${donorAccepted ? "recipient" : recipientAccepted ? "donor" : "both parties"}.`
        : "Waiting for both parties to accept the match",
      status: "current",
    });
    return steps;
  }

  // Step 4: Testing Scheduled
  if (match.testScheduledDate) {
    steps.push({
      title: "Testing Scheduled",
      description: "Medical compatibility tests have been scheduled",
      date: formatDate(match.testScheduledDate),
      status: "completed",
    });
  } else {
    steps.push({
      title: "Testing",
      description: "Awaiting medical compatibility testing schedule",
      status: "current",
    });
    return steps;
  }

  // Step 5: Procedure Scheduled
  if (match.procedureScheduledDate) {
    steps.push({
      title: "Procedure Scheduled",
      description: "Transplant procedure has been scheduled",
      date: formatDate(match.procedureScheduledDate),
      status: "completed",
    });
  } else {
    steps.push({
      title: "Procedure Planning",
      description: "Awaiting transplant procedure schedule",
      status: "current",
    });
    return steps;
  }

  // Step 6: Completed
  if (match.completedAt) {
    steps.push({
      title: "Procedure Complete",
      description: "Transplant procedure has been successfully completed",
      date: formatDate(match.completedAt),
      status: "completed",
    });
  } else {
    steps.push({
      title: "Procedure",
      description: "Awaiting procedure completion",
      status: "current",
    });
  }

  return steps;
}

export default function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="relative">
      {steps.map((step, index) => (
        <div key={index} className="relative flex items-start mb-8 last:mb-0">
          {/* Vertical Line */}
          {index !== steps.length - 1 && (
            <div
              className={`absolute left-4 top-8 w-0.5 h-full ${
                step.status === "completed"
                  ? "bg-green-500"
                  : "bg-gray-300 dark:bg-gray-700"
              }`}
            />
          )}

          {/* Status Indicator */}
          <div className="relative z-10 flex-shrink-0">
            {step.status === "completed" ? (
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
            ) : step.status === "current" ? (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                <div className="w-3 h-3 rounded-full bg-white" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700" />
            )}
          </div>

          {/* Content */}
          <div className="ml-4 flex-1">
            <div
              className={`p-4 rounded-lg border ${
                step.status === "completed"
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : step.status === "current"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              }`}
            >
              <h3 className="font-semibold text-lg">{step.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {step.description}
              </p>
              {step.date && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {step.date}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
