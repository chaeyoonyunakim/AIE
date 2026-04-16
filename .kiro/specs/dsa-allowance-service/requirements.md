# Requirements Document

## Introduction

This document defines the requirements for the DSA Allowance Service — an end-to-end digital replacement for the paper-based Disabled Students Allowance (DSA) application process. The service covers two primary journeys: a student-facing digital application form and a caseworker-facing case management dashboard.

Students currently download a PDF form, print and complete it by hand, scan it, and email it to a shared inbox. They receive no confirmation, no reference number, and have no way to track progress. Caseworkers receive these unstructured submissions, manually re-enter data into a case management system, and must cross-reference policy documents and workflow states across multiple disconnected tools.

The digital service replaces this with a GOV.UK Design System-compliant web application that guides students through the application step by step, generates a reference number on submission, and feeds structured data directly into a caseworker dashboard that surfaces the relevant policy, workflow state, and required actions for each case.

## Glossary

- **Applicant**: A student applying for Disabled Students Allowance.
- **Application_Form**: The multi-step digital web form through which the Applicant submits a DSA application.
- **Caseworker**: A government processing officer who reviews DSA applications and makes approval or rejection decisions.
- **Team_Leader**: A senior caseworker responsible for overseeing a team's caseload and handling escalations.
- **Case**: A single DSA application record in the case management system, identified by a unique Case_Reference.
- **Case_Reference**: A unique alphanumeric identifier assigned to a Case upon submission (e.g. `DSA-2026-00042`).
- **Customer_Reference_Number**: An existing identifier held by the Student Finance England system, optionally provided by the Applicant.
- **Dashboard**: The caseworker-facing web interface for viewing and managing Cases.
- **Workflow_State**: The current processing stage of a Case, drawn from the defined state machine (e.g. `awaiting_evidence`, `under_review`, `approved`, `rejected`).
- **Policy_Engine**: The component that matches a Case to applicable policy rules based on case type.
- **Evidence**: Supporting documents required to process a Case (e.g. proof of disability, cost quotes from suppliers).
- **Submission_Service**: The backend component that receives Application_Form data, assigns a Case_Reference, and creates a Case record.
- **Notification_Service**: The component responsible for sending confirmation and status update communications to Applicants.
- **GOV.UK_Design_System**: The UK government's design framework providing accessible, tested UI components and interaction patterns.
- **AI_Summary**: A mocked AI-generated plain-English summary of a Case, displayed on the Case detail view to help Caseworkers quickly understand the case context.
- **Notification_Channel**: The Applicant's preferred method of receiving communications — either email or SMS.

---

## Requirements

### Requirement 1: Digital Application Form — Personal Details

**User Story:** As an Applicant, I want to enter my personal details in a structured digital form, so that I can submit my DSA application without needing to print or scan a paper form.

#### Acceptance Criteria

1. THE Application_Form SHALL present personal detail fields across individual pages, with one primary question per page, following GOV.UK_Design_System patterns.
2. THE Application_Form SHALL collect the following fields: Customer_Reference_Number (optional), Forename(s) (required), Surname (required), Sex (required, options: Male, Female, Non-binary, Prefer not to say), Date of Birth (required, day/month/year inputs), Address lines 1–3 (required), Postcode (required), University name (required), and Course name (required).
3. THE Application_Form SHALL collect the Applicant's preferred Notification_Channel by asking the Applicant to select either email or SMS as their preferred contact method, and to provide the corresponding email address (required if email selected) or mobile phone number (required if SMS selected).
4. WHEN an Applicant submits a page with a required field left blank, THE Application_Form SHALL display a GOV.UK-style error summary at the top of the page and an inline error message adjacent to the relevant field.
5. WHEN an Applicant enters a Date of Birth, THE Application_Form SHALL validate that the date is a real calendar date in DD/MM/YYYY format and that the Applicant is at least 16 years of age.
6. WHEN an Applicant enters a Postcode, THE Application_Form SHALL validate that the value matches the standard UK postcode format.
7. THE Application_Form SHALL allow the Applicant to navigate back to a previous page and change their answers without losing data entered on subsequent pages.

---

### Requirement 2: Digital Application Form — Cost Details

**User Story:** As an Applicant, I want to enter the details of my disability-related costs and suppliers, so that my application includes the information needed for a caseworker to assess my allowance.

#### Acceptance Criteria

1. THE Application_Form SHALL allow the Applicant to enter one or more cost line items, each comprising: a description of the cost (required, free text), an amount in GBP (required, numeric), and the name of the supplier (required, free text).
2. THE Application_Form SHALL allow the Applicant to add up to 10 cost line items in a single application.
3. WHEN an Applicant enters a cost amount, THE Application_Form SHALL validate that the value is a positive number with no more than two decimal places.
4. THE Application_Form SHALL display a running total of all entered cost amounts on the cost summary page.
5. WHEN an Applicant attempts to proceed with zero cost line items entered, THE Application_Form SHALL display an error message stating that at least one cost item must be provided.

---

### Requirement 3: Check Your Answers and Declaration

**User Story:** As an Applicant, I want to review all my answers before submitting, so that I can correct any mistakes and confirm the information is accurate.

#### Acceptance Criteria

1. THE Application_Form SHALL present a "Check your answers" page displaying all entered data before final submission, following GOV.UK_Design_System summary list patterns.
2. THE Application_Form SHALL provide a change link next to each answer on the "Check your answers" page that returns the Applicant to the relevant input page.
3. THE Application_Form SHALL include a declaration statement on the "Check your answers" page that the Applicant must confirm by selecting a checkbox before submitting.
4. WHEN an Applicant attempts to submit without confirming the declaration checkbox, THE Application_Form SHALL display an error message preventing submission.
5. THE Application_Form SHALL be keyboard navigable throughout, with all interactive elements reachable and operable via keyboard alone.
6. THE Application_Form SHALL meet WCAG 2.2 Level AA accessibility requirements, including sufficient colour contrast, visible focus indicators, and correct use of ARIA labels on all form fields.

---

### Requirement 4: Submission and Confirmation

**User Story:** As an Applicant, I want to receive a confirmation with a reference number after submitting my application, so that I know my submission was received and I have a way to follow up.

#### Acceptance Criteria

1. WHEN an Applicant submits a completed Application_Form, THE Submission_Service SHALL assign a unique Case_Reference to the submission in the format `DSA-YYYY-NNNNN`.
2. WHEN an Applicant submits a completed Application_Form, THE Submission_Service SHALL create a Case record with Workflow_State set to `awaiting_evidence` and persist it to the data store.
3. WHEN a Case record is successfully created, THE Application_Form SHALL display a GOV.UK-style confirmation page showing the Case_Reference and a summary of next steps.
4. IF the Submission_Service fails to persist the Case record, THEN THE Application_Form SHALL display a GOV.UK-style error page and SHALL NOT display a confirmation page or Case_Reference.
5. WHEN a Case record is successfully created, THE Notification_Service SHALL send a confirmation communication to the Applicant via the Applicant's preferred Notification_Channel (email or SMS), containing the Case_Reference and an explanation of the next steps in the process.
6. THE Submission_Service SHALL ensure that each generated Case_Reference is unique across all submitted applications.

---

### Requirement 5: Application Status Tracking

**User Story:** As an Applicant, I want to check the current status of my application using my reference number, so that I do not need to call a helpline to find out what is happening.

#### Acceptance Criteria

1. THE Application_Form SHALL provide a status-check page where an Applicant can enter their Case_Reference to retrieve the current Workflow_State of their Case.
2. WHEN a valid Case_Reference is entered, THE Application_Form SHALL display the current Workflow_State of the Case and the date it was last updated.
3. WHEN a Case_Reference that does not match any existing Case is entered, THE Application_Form SHALL display an error message stating that no application was found for that reference.
4. THE Application_Form SHALL display Workflow_State values in plain English (e.g. "Awaiting evidence", "Under review", "Approved", "Rejected") rather than system codes.
5. WHILE a Case has Workflow_State `approved` or `rejected`, THE Application_Form SHALL display the outcome and the date the decision was made on the status-check page.

---

### Requirement 6: Caseworker Dashboard — Case List

**User Story:** As a Caseworker, I want to see a list of all cases assigned to me with their current status and any urgent flags, so that I can prioritise my work and know which cases need immediate attention.

#### Acceptance Criteria

1. THE Dashboard SHALL display a list of all Cases assigned to the authenticated Caseworker, showing for each: Case_Reference, Applicant name, case type, current Workflow_State, date created, and date last updated.
2. THE Dashboard SHALL allow the Caseworker to filter the case list by Workflow_State.
3. THE Dashboard SHALL allow the Caseworker to sort the case list by date created and date last updated.
4. WHEN a Case has had outstanding Evidence for more than 28 calendar days since the evidence was requested, THE Dashboard SHALL display a visual flag on that Case in the list indicating a reminder is due.
5. WHEN a Case has had outstanding Evidence for more than 56 calendar days since the evidence was requested, THE Dashboard SHALL display a distinct visual flag on that Case indicating escalation to a Team_Leader is required.
6. THE Dashboard SHALL display the total count of Cases assigned to the Caseworker and the count of Cases with escalation flags.

---

### Requirement 7: Caseworker Dashboard — Case Detail View

**User Story:** As a Caseworker, I want to open a case and immediately understand its history, the relevant policy, and what action I need to take next, so that I can make a decision without switching between multiple systems.

#### Acceptance Criteria

1. WHEN a Caseworker selects a Case from the list, THE Dashboard SHALL display the full Case detail view including: applicant details, all submitted application data, the Case timeline, case notes, current Workflow_State, and available next Workflow_State transitions.
2. THE Dashboard SHALL display the Case timeline as a chronological list of events, each showing the date, event type, and associated note.
3. THE Dashboard SHALL use the Policy_Engine to identify and display all policy extracts applicable to the Case's case type alongside the Case detail.
4. THE Dashboard SHALL highlight the specific policy clauses relevant to the current Workflow_State (e.g. evidence requirements, escalation thresholds).
5. THE Dashboard SHALL display the required action for the current Workflow_State as defined in the workflow state machine.
6. WHEN a Case has outstanding Evidence beyond the 28-day policy threshold, THE Dashboard SHALL display the number of days the evidence has been outstanding and indicate that a reminder communication is due.

---

### Requirement 8: Caseworker Workflow Actions

**User Story:** As a Caseworker, I want to update the workflow state of a case and record my actions, so that the case record accurately reflects what has happened and what is needed next.

#### Acceptance Criteria

1. THE Dashboard SHALL present only the Workflow_State transitions that are permitted from the current state, as defined in the workflow state machine.
2. WHEN a Caseworker selects a Workflow_State transition, THE Dashboard SHALL require the Caseworker to enter a note before confirming the transition.
3. WHEN a Caseworker confirms a Workflow_State transition, THE Dashboard SHALL update the Case's Workflow_State, append an entry to the Case timeline, and record the Caseworker's identifier and the timestamp of the action.
4. WHEN a Caseworker sets a Case Workflow_State to `approved` or `rejected`, THE Dashboard SHALL require the Caseworker to record a decision reason before confirming.
5. WHEN a Case Workflow_State is updated to `approved` or `rejected`, THE Notification_Service SHALL send a communication to the Applicant via the Applicant's preferred Notification_Channel (email or SMS) informing them of the outcome.
6. IF a Caseworker attempts to apply a Workflow_State transition that is not permitted from the current state, THEN THE Dashboard SHALL display an error message and SHALL NOT update the Case record.

---

### Requirement 9: Team Leader Escalation View

**User Story:** As a Team Leader, I want to see all cases across my team that require escalation or are approaching deadlines, so that I can manage risk and redistribute work where needed.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Team Leader view displaying all Cases across all Caseworkers in the team, with the same status flags and filters available in the Caseworker view.
2. THE Dashboard SHALL display a summary count of Cases by Workflow_State across the team.
3. WHEN a Case has been flagged for escalation (outstanding Evidence beyond 56 days), THE Dashboard SHALL display it prominently in the Team Leader view with the assigned Caseworker's name.
4. THE Dashboard SHALL allow the Team Leader to reassign a Case from one Caseworker to another.
5. WHEN a Case is reassigned, THE Dashboard SHALL append an entry to the Case timeline recording the reassignment, the previous assignee, the new assignee, and the timestamp.

---

### Requirement 10: Accessibility and Cross-Device Support

**User Story:** As an Applicant or Caseworker, I want to use the service on any device and with any assistive technology, so that the service is usable regardless of my access needs or the device I am using.

#### Acceptance Criteria

1. THE Application_Form SHALL render correctly and be fully operable on viewport widths from 320px to 1920px without horizontal scrolling.
2. THE Application_Form SHALL be operable using a screen reader, with all form fields having programmatically associated labels and all error messages linked to their fields via `aria-describedby`.
3. THE Application_Form SHALL not rely on colour alone to convey information, including error states and status indicators.
4. THE Dashboard SHALL render correctly and be fully operable on viewport widths from 768px to 1920px.
5. THE Application_Form and THE Dashboard SHALL load their primary content within 3 seconds on a standard broadband connection (10 Mbps download).

---

### Requirement 11: Caseworker Dashboard — Authentication

**User Story:** As a Caseworker or Team Leader, I want to authenticate before accessing the Dashboard, so that case data is protected and only authorised users can view or act on cases.

#### Acceptance Criteria

1. WHEN a Caseworker or Team_Leader attempts to access the Dashboard, THE Dashboard SHALL require the user to authenticate with a username and password before granting access.
2. WHEN a Caseworker or Team_Leader provides valid credentials, THE Dashboard SHALL establish an authenticated session and grant access to the Dashboard.
3. WHILE an authenticated session has been inactive for 8 hours, THE Dashboard SHALL expire the session and require the user to authenticate again before continuing.
4. WHEN a Caseworker or Team_Leader submits invalid credentials, THE Dashboard SHALL display a GOV.UK-style error message and SHALL NOT grant access to the Dashboard.
5. THE Dashboard SHALL store all user passwords as salted hashes and SHALL NOT store passwords in plain text.

---

### Requirement 12: AI-Assisted Case Summary

**User Story:** As a Caseworker, I want to see an AI-generated summary of a case on the case detail view, so that I can quickly understand the case context, outstanding evidence, and recommended next action without reading through all case notes manually.

#### Acceptance Criteria

1. THE Dashboard SHALL display an AI_Summary on the Case detail view, presenting a plain-English summary of the case history, outstanding Evidence, and recommended next action.
2. THE Dashboard SHALL clearly label the AI_Summary as AI-generated so that the Caseworker is aware the content is produced by an automated process.
3. THE Dashboard SHALL generate the AI_Summary using a mocked response that returns a realistic pre-written summary for the given case type and Workflow_State.
4. THE Dashboard SHALL implement the AI_Summary component so that the mocked response can be replaced by a real language model API call without changes to the surrounding interface or other Dashboard components.
