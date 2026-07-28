import type { DemoRequestFormData, DemoRequestFormErrors } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function validateDemoRequestForm(
  form: DemoRequestFormData,
): DemoRequestFormErrors {
  const errors: DemoRequestFormErrors = {};
  const today = todayDateString();

  if (!form.restaurantName.trim()) {
    errors.restaurantName = "Please enter your restaurant name.";
  }

  if (!form.contactPerson.trim()) {
    errors.contactPerson = "Please enter the contact person's name.";
  }

  if (!form.mobileNumber.trim()) {
    errors.mobileNumber = "Please enter a mobile number.";
  } else if (form.mobileNumber.trim().replace(/\D/g, "").length < 8) {
    errors.mobileNumber = "Please enter a valid mobile number.";
  }

  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  const branchesValue = Number(form.branches);
  if (
    !form.branches.trim() ||
    !Number.isInteger(branchesValue) ||
    branchesValue < 1
  ) {
    errors.branches = "Please enter at least 1 branch.";
  }

  if (!form.preferredDate.trim()) {
    errors.preferredDate = "Please choose a preferred visit date.";
  } else if (form.preferredDate < today) {
    errors.preferredDate = "Preferred visit date cannot be in the past.";
  }

  if (!form.preferredTime.trim()) {
    errors.preferredTime = "Please choose a preferred visit time.";
  }

  if (form.alternateDate.trim() && form.alternateDate < today) {
    errors.alternateDate = "Alternative date cannot be in the past.";
  }

  return errors;
}
