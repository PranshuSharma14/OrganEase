import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "bold",
  },
  section: {
    marginBottom: 15,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1e40af",
  },
  text: {
    marginBottom: 3,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginVertical: 15,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 10,
    color: "#6b7280",
  },
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fef3c7",
    borderRadius: 5,
  },
});

type ConsentPDFData = {
  matchId: string;
  donorName: string;
  donorAge: number;
  donorBloodGroup: string;
  donorCity: string;
  recipientName: string;
  recipientAge: number;
  recipientBloodGroup: string;
  recipientCity: string;
  organType: string;
  hospitalName: string;
  hospitalCity: string;
  approvedDate: string;
  donorAcceptedDate: string;
  recipientAcceptedDate: string;
};

const ConsentDocument = ({ data }: { data: ConsentPDFData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>ORGAN DONATION CONSENT CERTIFICATE</Text>
      
      <View style={styles.section}>
        <Text style={styles.title}>Certificate ID: {data.matchId}</Text>
        <Text style={styles.text}>Generated on: {new Date().toLocaleString()}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.title}>DONOR INFORMATION</Text>
        <Text style={styles.text}>Name: {data.donorName}</Text>
        <Text style={styles.text}>Age: {data.donorAge} years</Text>
        <Text style={styles.text}>Blood Group: {data.donorBloodGroup}</Text>
        <Text style={styles.text}>Location: {data.donorCity}</Text>
        <Text style={styles.text}>Consent Date: {data.donorAcceptedDate}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.title}>RECIPIENT INFORMATION</Text>
        <Text style={styles.text}>Name: {data.recipientName}</Text>
        <Text style={styles.text}>Age: {data.recipientAge} years</Text>
        <Text style={styles.text}>Blood Group: {data.recipientBloodGroup}</Text>
        <Text style={styles.text}>Location: {data.recipientCity}</Text>
        <Text style={styles.text}>Consent Date: {data.recipientAcceptedDate}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.title}>DONATION DETAILS</Text>
        <Text style={styles.text}>Organ/Tissue: {data.organType.replace(/_/g, " ").toUpperCase()}</Text>
        <Text style={styles.text}>Hospital: {data.hospitalName}</Text>
        <Text style={styles.text}>Location: {data.hospitalCity}</Text>
        <Text style={styles.text}>Hospital Approval Date: {data.approvedDate}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.disclaimer}>
        <Text style={{ fontSize: 10, marginBottom: 5, fontWeight: "bold" }}>
          LEGAL DISCLAIMER
        </Text>
        <Text style={{ fontSize: 9 }}>
          This certificate confirms that both the donor and recipient have provided informed consent 
          for the living organ donation, and that the procedure has been approved by the hospital 
          authority. This donation is conducted in accordance with applicable laws and regulations 
          governing organ transplantation. This certificate is for verification purposes and does not 
          constitute a medical or legal contract.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>VERIFICATION</Text>
        <Text style={styles.text}>✓ Donor identity verified</Text>
        <Text style={styles.text}>✓ Recipient medical need verified</Text>
        <Text style={styles.text}>✓ Hospital authority approval obtained</Text>
        <Text style={styles.text}>✓ Medical compatibility confirmed</Text>
        <Text style={styles.text}>✓ Voluntary consent verified</Text>
      </View>

      <Text style={styles.footer}>
        OrganEase - Verified Living Organ Donation Platform{"\n"}
        This is a digitally generated certificate. No signature required.{"\n"}
        For verification, visit: organease.com/verify/{data.matchId}
      </Text>
    </Page>
  </Document>
);

export async function generateConsentPDF(data: ConsentPDFData): Promise<string> {
  try {
    // Generate PDF blob
    const blob = await pdf(<ConsentDocument data={data} />).toBlob();
    
    // Convert blob to buffer
    const buffer = Buffer.from(await blob.arrayBuffer());
    
    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "consents");
    await mkdir(uploadDir, { recursive: true });
    
    // Save PDF
    const fileName = `consent-${data.matchId}-${Date.now()}.pdf`;
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    
    // Return public URL
    return `/consents/${fileName}`;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate consent PDF");
  }
}
