import {
  renderAnnouncementEmail,
  announcementEmailSample,
} from "./announcementEmail";
import {
  renderDemoConfirmationEmail,
  demoConfirmationEmailSample,
} from "./demoConfirmationEmail";
import {
  renderPasswordResetEmail,
  passwordResetEmailSample,
} from "./passwordResetEmail";
import {
  renderPaymentReceiptEmail,
  paymentReceiptEmailSample,
} from "./paymentReceiptEmail";
import {
  renderSubscriptionActivatedEmail,
  subscriptionActivatedEmailSample,
} from "./subscriptionActivatedEmail";
import {
  renderSupportReplyEmail,
  supportReplyEmailSample,
} from "./supportReplyEmail";
import { renderVerifyEmail, verifyEmailSample } from "./verifyEmail";
import { renderWelcomeEmail, welcomeEmailSample } from "./welcomeEmail";

export type EmailTemplateEntry = {
  id: string;
  label: string;
  description: string;
  render: () => string;
};

export const emailTemplateRegistry: EmailTemplateEntry[] = [
  {
    id: "welcome",
    label: "Welcome",
    description: "Sent right after a restaurant owner signs up.",
    render: () => renderWelcomeEmail(welcomeEmailSample),
  },
  {
    id: "verify-email",
    label: "Verify Email",
    description: "Confirms a new account's email address.",
    render: () => renderVerifyEmail(verifyEmailSample),
  },
  {
    id: "demo-confirmation",
    label: "Demo Confirmation",
    description: "Confirms a scheduled product demo.",
    render: () => renderDemoConfirmationEmail(demoConfirmationEmailSample),
  },
  {
    id: "subscription-activated",
    label: "Subscription Activated",
    description: "Sent when a plan becomes active.",
    render: () =>
      renderSubscriptionActivatedEmail(subscriptionActivatedEmailSample),
  },
  {
    id: "payment-receipt",
    label: "Payment Receipt",
    description: "Receipt sent after a successful payment.",
    render: () => renderPaymentReceiptEmail(paymentReceiptEmailSample),
  },
  {
    id: "password-reset",
    label: "Password Reset",
    description: "Lets an owner reset a forgotten password.",
    render: () => renderPasswordResetEmail(passwordResetEmailSample),
  },
  {
    id: "support-reply",
    label: "Support Reply",
    description: "Notifies an owner of a new support ticket reply.",
    render: () => renderSupportReplyEmail(supportReplyEmailSample),
  },
  {
    id: "announcement",
    label: "Announcement",
    description: "Broadcasts a platform announcement to owners.",
    render: () => renderAnnouncementEmail(announcementEmailSample),
  },
];
