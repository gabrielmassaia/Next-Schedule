# Appointment Editing Feature Walkthrough

This walkthrough details the implementation of the appointment editing feature, which includes both an API endpoint for integration (N8N) and a UI update for internal use.

## Changes

### API Integration

- **PUT /api/integrations/appointments**: Added a new endpoint to update appointments.
  - Accepts `id` as a query parameter.
  - Accepts `date`, `time`, and `professionalId` in the body.
  - Validates availability before updating.
  - Protected by API Key.

### Internal UI

- **Server Action**: Created `updateAppointment` in `src/actions/update-appointment.ts` to handle updates securely.
- **AddAppointmentForm**: Refactored to support editing mode.
  - Accepts `initialData`.
  - Pre-fills form fields with existing appointment data.
  - Calls `updateAppointment` instead of `addAppointment` when editing.
- **AppointmentsTable**:
  - Added an "Editar" option to the actions dropdown.
  - Opens the `AddAppointmentForm` in a modal with the appointment data.
  - Updated table columns and actions to pass necessary data (`clients`, `professionals`).

## Verification Results

### Appointment Status & Editing Fix

- **Status Field**: Added `status` column to `appointments` table (`scheduled`, `completed`, `cancelled`).
- **UI Updates**:
  - Added Status column to `AppointmentsTable` with color-coded badges.
  - "Cancelled" status shows a red badge and a warning tooltip ("Será excluído em 1 semana").
  - Replaced "Excluir" action with "Cancelar" (Soft Delete).
- **Bug Fix**: Fixed issue where date/time fields were disabled during editing by ensuring `Select` components are controlled and `Calendar` logic permits the initial date.

### Automated Build

- Ran `npm run build` to verify type safety and build integrity.
- Fixed unused import errors in `table-actions.tsx`.
- Fixed type mismatch in `getAppointments` by adding `appointmentPriceInCents`.
- Fixed `DashboardPage` import error by creating `DashboardAppointmentsTable` client component.

### Manual Verification Steps

1.  **API**: Use Swagger UI or Postman to send a `PUT` request to `/api/integrations/appointments?id={id}` with new data.
2.  **UI Editing**: Go to `/appointments`, click "Editar", and verify that you can change the date and time.
3.  **UI Status**: Cancel an appointment and verify the red "Cancelado" badge and tooltip.
4.  **Dashboard**: Verify that the dashboard loads correctly.
