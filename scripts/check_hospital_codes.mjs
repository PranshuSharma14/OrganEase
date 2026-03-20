import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL);

async function checkHospitals() {
  try {
    console.log("Fetching all hospitals from database...\n");
    
    const hospitals = await sql`
      SELECT id, user_id, hospital_name, hospital_code, city, state
      FROM hospital_profiles
    `;

    console.log(`Found ${hospitals.length} hospital(s):\n`);
    
    if (hospitals.length === 0) {
      console.log("No hospitals found in database.");
      process.exit(0);
    }

    hospitals.forEach((h, i) => {
      console.log(`${i + 1}. ${h.hospital_name}`);
      console.log(`   ID: ${h.id}`);
      console.log(`   Hospital Code: ${h.hospital_code || "NOT SET"}`);
      console.log(`   City: ${h.city}, State: ${h.state}`);
      console.log("");
    });

    // Show problematic codes
    const missingCodes = hospitals.filter(h => !h.hospital_code);
    if (missingCodes.length > 0) {
      console.log(`\n⚠️  ${missingCodes.length} hospital(s) are missing hospital codes!`);
      console.log("These hospitals need codes before recipients can register.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkHospitals();
