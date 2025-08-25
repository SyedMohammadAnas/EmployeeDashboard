import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with clsx and tailwind-merge
 * Handles class conflicts and conditional classes efficiently
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to YYYY-MM-DD format for HTML date inputs
 * @param date - Date object or date string
 * @returns Formatted date string
 */
export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString().split("T")[0];
}

/**
 * Format date for display in a readable format
 * @param date - Date object or date string
 * @returns Formatted date string for display
 */
export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Calculate days until deadline
 * @param deadline - Deadline date string or Date object
 * @returns Number of days (negative if overdue)
 */
export function getDaysUntilDeadline(deadline: string | Date): number {
  const deadlineDate = typeof deadline === "string" ? new Date(deadline) : deadline;
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get status color classes based on project status
 * @param status - Project status
 * @returns Object with background and text color classes
 */
export function getStatusColors(status: string) {
  const statusColors = {
    "Not Started": {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-200",
    },
    "In Progress": {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-200",
    },
    Completed: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
    },
    "On Hold": {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-200",
    },
  };

  return statusColors[status as keyof typeof statusColors] || statusColors["Not Started"];
}

/**
 * Get priority color classes based on project priority
 * @param priority - Project priority
 * @returns Object with background and text color classes
 */
export function getPriorityColors(priority: string) {
  const priorityColors = {
    Low: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-200",
    },
    Medium: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-200",
    },
    High: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
    },
  };

  return priorityColors[priority as keyof typeof priorityColors] || priorityColors.Medium;
}

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Debounce function to limit the rate of function calls
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
