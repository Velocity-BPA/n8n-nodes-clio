/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export const API_ENDPOINTS: Record<string, string> = {
  us: 'https://app.clio.com/api/v4',
  eu: 'https://eu.app.clio.com/api/v4',
  ca: 'https://ca.app.clio.com/api/v4',
  au: 'https://au.app.clio.com/api/v4',
};

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export const MATTER_STATUSES = [
  { name: 'Open', value: 'Open' },
  { name: 'Pending', value: 'Pending' },
  { name: 'Closed', value: 'Closed' },
];

export const CONTACT_TYPES = [
  { name: 'Person', value: 'Person' },
  { name: 'Company', value: 'Company' },
];

export const ACTIVITY_TYPES = [
  { name: 'TimeEntry', value: 'TimeEntry' },
  { name: 'ExpenseEntry', value: 'ExpenseEntry' },
];

export const BILL_STATES = [
  { name: 'Draft', value: 'draft' },
  { name: 'Awaiting Approval', value: 'awaiting_approval' },
  { name: 'Awaiting Payment', value: 'awaiting_payment' },
  { name: 'Paid', value: 'paid' },
  { name: 'Void', value: 'void' },
];

export const TASK_PRIORITIES = [
  { name: 'High', value: 'High' },
  { name: 'Normal', value: 'Normal' },
  { name: 'Low', value: 'Low' },
];

export const TASK_STATUSES = [
  { name: 'Pending', value: 'pending' },
  { name: 'Complete', value: 'complete' },
];

export const CALENDAR_ENTRY_TYPES = [
  { name: 'Appointment', value: 'Appointment' },
  { name: 'Court Date', value: 'CourtDate' },
  { name: 'Deadline', value: 'Deadline' },
  { name: 'Task', value: 'Task' },
];

export const COMMUNICATION_TYPES = [
  { name: 'Email', value: 'Email' },
  { name: 'Phone Call', value: 'PhoneCall' },
  { name: 'Letter', value: 'Letter' },
  { name: 'Fax', value: 'Fax' },
  { name: 'Meeting', value: 'Meeting' },
  { name: 'Other', value: 'Other' },
];

export const TRUST_TRANSACTION_TYPES = [
  { name: 'Deposit', value: 'deposit' },
  { name: 'Withdrawal', value: 'withdrawal' },
  { name: 'Transfer', value: 'transfer' },
];

export const WEBHOOK_EVENTS = [
  { name: 'Matter Created', value: 'matter.created' },
  { name: 'Matter Updated', value: 'matter.updated' },
  { name: 'Matter Deleted', value: 'matter.deleted' },
  { name: 'Contact Created', value: 'contact.created' },
  { name: 'Contact Updated', value: 'contact.updated' },
  { name: 'Contact Deleted', value: 'contact.deleted' },
  { name: 'Activity Created', value: 'activity.created' },
  { name: 'Activity Updated', value: 'activity.updated' },
  { name: 'Activity Deleted', value: 'activity.deleted' },
  { name: 'Bill Created', value: 'bill.created' },
  { name: 'Bill Updated', value: 'bill.updated' },
  { name: 'Bill Deleted', value: 'bill.deleted' },
  { name: 'Task Created', value: 'task.created' },
  { name: 'Task Updated', value: 'task.updated' },
  { name: 'Task Completed', value: 'task.completed' },
  { name: 'Calendar Entry Created', value: 'calendar_entry.created' },
  { name: 'Calendar Entry Updated', value: 'calendar_entry.updated' },
  { name: 'Document Created', value: 'document.created' },
  { name: 'Document Updated', value: 'document.updated' },
  { name: 'Note Created', value: 'note.created' },
  { name: 'Communication Created', value: 'communication.created' },
  { name: 'Payment Created', value: 'payment.created' },
];

export const CUSTOM_FIELD_TYPES = [
  { name: 'Text Line', value: 'text_line' },
  { name: 'Text Area', value: 'text_area' },
  { name: 'Checkbox', value: 'checkbox' },
  { name: 'Date', value: 'date' },
  { name: 'Currency', value: 'currency' },
  { name: 'Number', value: 'number' },
  { name: 'Picklist', value: 'picklist' },
  { name: 'Contact', value: 'contact' },
  { name: 'Matter', value: 'matter' },
  { name: 'URL', value: 'url' },
  { name: 'Email', value: 'email' },
];

export const LICENSING_NOTICE = `[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`;
