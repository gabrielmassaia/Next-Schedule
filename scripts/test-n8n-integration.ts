import { eq } from "drizzle-orm";

import { db } from "@/db";
import { clinicsTable, professionalsTable } from "@/db/schema";

const BASE_URL = "http://localhost:3000/api/integrations/n8n";
const SERVICE_TOKEN = process.env.N8N_SERVICE_TOKEN;

async function main() {
  if (!SERVICE_TOKEN) {
    console.error(
      "❌ Error: N8N_SERVICE_TOKEN environment variable is not set.",
    );
    process.exit(1);
  }

  console.log("🔍 Starting N8N Integration Verification...");
  console.log(`🔑 Using Service Token: ${SERVICE_TOKEN.slice(0, 4)}...`);

  // 1. Fetch a real clinic and professional
  const clinic = await db.query.clinicsTable.findFirst({
    with: {
      whatsappNumbers: true,
    },
  });

  if (!clinic) {
    console.error(
      "❌ Error: No clinics found in database. Please create a clinic first.",
    );
    process.exit(1);
  }

  const professional = await db.query.professionalsTable.findFirst({
    where: eq(professionalsTable.clinicId, clinic.id),
  });

  if (!professional) {
    console.error(
      "❌ Error: No professionals found for the clinic. Please create a professional.",
    );
    process.exit(1);
  }

  console.log(`✅ Found Clinic: ${clinic.name} (${clinic.id})`);
  console.log(
    `✅ Found Professional: ${professional.name} (${professional.id})`,
  );

  const headers = {
    "Content-Type": "application/json",
    "X-Service-Token": SERVICE_TOKEN,
  };

  // 2. Test Resolve Clinic (if phone exists)
  if (clinic.whatsappNumbers.length > 0) {
    const phone = clinic.whatsappNumbers[0].phone;
    console.log(`\nTesting Resolve Clinic with phone: ${phone}...`);
    const res = await fetch(
      `${BASE_URL}/resolve-clinic?phone=${encodeURIComponent(phone)}`,
      { headers },
    );
    const data = await res.json();
    console.log(`Status: ${res.status}`, data);
  } else {
    console.log(
      "\n⚠️ Skipping Resolve Clinic test (no WhatsApp number found).",
    );
  }

  // 3. Test Get Persona
  console.log(`\nTesting Get Persona...`);
  const resPersona = await fetch(`${BASE_URL}/clinics/${clinic.id}/persona`, {
    headers,
  });
  console.log(`Status: ${resPersona.status}`, await resPersona.json());

  // 4. Test Availability
  console.log(`\nTesting Availability...`);
  const today = new Date().toISOString().split("T")[0];
  const resAvail = await fetch(
    `${BASE_URL}/clinics/${clinic.id}/availability?date=${today}&professionalId=${professional.id}`,
    { headers },
  );
  console.log(`Status: ${resAvail.status}`, await resAvail.json());

  // 5. Test Upsert Client
  console.log(`\nTesting Upsert Client...`);
  const testClient = {
    name: "Test Client N8N",
    email: `test-n8n-${Date.now()}@example.com`,
    phoneNumber: "5511999999999",
    sex: "male",
  };
  const resClient = await fetch(`${BASE_URL}/clinics/${clinic.id}/clients`, {
    method: "POST",
    headers,
    body: JSON.stringify(testClient),
  });
  const clientData = await resClient.json();
  console.log(`Status: ${resClient.status}`, clientData);

  // Need client ID for appointment?
  // The upsert endpoint doesn't return the ID currently, just success.
  // We need to fetch the client from DB to get the ID for appointment test.
  const client = await db.query.clientsTable.findFirst({
    where: eq(clinicsTable.name, "Test Client N8N"), // Wait, clientsTable doesn't have name? It does.
    // Actually better to query by email
  });

  // Re-query client by email
  const createdClient = await db.query.clientsTable.findFirst({
    where: (clients, { eq, and }) =>
      and(eq(clients.email, testClient.email), eq(clients.clinicId, clinic.id)),
  });

  if (!createdClient) {
    console.error("❌ Failed to find created client in DB.");
  } else {
    console.log(`✅ Client created with ID: ${createdClient.id}`);

    // 6. Test Create Appointment
    console.log(`\nTesting Create Appointment...`);
    const appointmentData = {
      clientId: createdClient.id,
      professionalId: professional.id,
      date: today,
      time: "10:00", // Ensure this is available or might fail, but we just want to test endpoint reachability
      appointmentPriceInCents: 10000,
    };

    const resAppt = await fetch(
      `${BASE_URL}/clinics/${clinic.id}/appointments`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(appointmentData),
      },
    );
    const apptResult = await resAppt.json();
    console.log(`Status: ${resAppt.status}`, apptResult);

    if (resAppt.ok && apptResult.id) {
      // 7. Test Update Appointment
      console.log(`\nTesting Update Appointment...`);
      const updateData = {
        clientId: createdClient.id,
        professionalId: professional.id,
        date: today,
        time: "11:00",
        appointmentPriceInCents: 12000,
      };
      const resUpdate = await fetch(
        `${BASE_URL}/clinics/${clinic.id}/appointments/${apptResult.id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(updateData),
        },
      );
      console.log(`Status: ${resUpdate.status}`, await resUpdate.json());

      // 8. Test Cancel Appointment
      console.log(`\nTesting Cancel Appointment...`);
      const resCancel = await fetch(
        `${BASE_URL}/clinics/${clinic.id}/appointments/${apptResult.id}/cancel`,
        {
          method: "POST",
          headers,
        },
      );
      console.log(`Status: ${resCancel.status}`, await resCancel.json());
    }
  }

  console.log("\n✅ Verification Complete.");
}

main().catch(console.error);
